import { Router, Request, Response, NextFunction } from 'express';
import { config } from 'dotenv';
import jwt from 'jsonwebtoken';
import { pool } from '../dbconfig';
import AWS from 'aws-sdk';
import axios from 'axios';

config();
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION || 'us-east-1'
});

const BUCKET_NAME = process.env.S3_BUCKET_NAME || 'your-bucket-name';

const router = Router();

interface AuthenticatedRequest extends Request {
  user?: jwt.JwtPayload | string;
}

const processCustomMods = async (connection: any, mods: any[]): Promise<number[]> => {
  const modIds: number[] = [];
  
  for (const mod of mods) {
    if (mod.isCustom) {
      const [result]: any = await connection.query(
        `INSERT INTO Mods (brand, category, cost, description, link, type, partNumber, isCustom)
         VALUES (?, ?, ?, ?, ?, ?, ?, TRUE)`,
        [
          mod.brand,
          mod.category,
          mod.cost,
          mod.description || '',
          '', 
          mod.type || '',
          mod.partNumber || ''
        ]
      );
      modIds.push(result.insertId);
    } else {
      modIds.push(mod.id || mod.modID);
    }
  }
  
  return modIds;
};


const authenticateUser = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Authentication required' });
  }
  
  const token = authHeader.split(' ')[1];
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded; 
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
};

router.get('/s3/presigned-url', authenticateUser, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { fileName, fileType } = req.query;
    
    if (!fileName || !fileType || typeof fileName !== 'string' || typeof fileType !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'fileName and fileType are required as query parameters'
      });
    }
    
    const user = req.user as any;
    const key = `users/${user.userEmail}/${Date.now()}-${fileName.replace(/\s+/g, '_')}`;
    
    const presignedUrl = s3.getSignedUrl('putObject', {
      Bucket: BUCKET_NAME,
      Key: key,
      ContentType: fileType,
      Expires: 300 
    });
    
    res.status(200).json({
      success: true,
      url: presignedUrl,
      key: key
    });
  } catch (error) {
    console.error('Error generating presigned URL:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate presigned URL',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

router.put('/update/:entryID', authenticateUser, async (req: AuthenticatedRequest, res: Response) => {
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();
    
    const user = req.user as any;
    const entryID = parseInt(req.params.entryID);
    
    if (!entryID || isNaN(entryID)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid entry ID'
      });
    }
    
    const { 
      carName, carMake, carModel, carYear, carColor, basecost, carTrim, description,
      totalMods, totalCost, category, region, engine, transmission, 
      drivetrain, horsepower, torque, photos, tags, mods,
    } = req.body;
    
    if (!carName || !carMake || !carModel || !carTrim || !category || !region) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }
    
    if (!photos || !Array.isArray(photos) || photos.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'At least one photo is required'
      });
    }
    
    const [existingEntry]: any = await connection.query(
      'SELECT entryID FROM Entries WHERE entryID = ? AND userEmail = ?',
      [entryID, user.userEmail]
    );
    
    if (!existingEntry || existingEntry.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Car entry not found or you do not have permission to update it'
      });
    }
    
    // Update entry details
    await connection.query(
      `UPDATE Entries SET 
        carName = ?, carMake = ?, carModel = ?, carYear = ?, carColor = ?, basecost = ?, carTrim = ?,
        description = ?, totalMods = ?, totalCost = ?, category = ?, 
        region = ?, engine = ?, transmission = ?, drivetrain = ?,
        horsepower = ?, torque = ?, updatedAt = NOW()
       WHERE entryID = ? AND userEmail = ?`,
      [
        carName, carMake, carModel, carYear || null, carColor || null, basecost || null, carTrim || null,
        description || null, totalMods || 0, totalCost || 0, category, region,
        engine || null, transmission || null, drivetrain || null,
        horsepower || null, torque || null, entryID, user.userEmail
      ]
    );
    
    // Update photos
    await connection.query(
      'DELETE FROM EntryPhotos WHERE entryID = ?',
      [entryID]
    );
    
    if (photos.length > 0) {
      const photoValues = photos.map((photo: any) => [
        entryID,
        photo.s3Key,
        photo.isMainPhoto || false
      ]);
      
      await connection.query(
        `INSERT INTO EntryPhotos (entryID, s3Key, isMainPhoto)
         VALUES ?`,
        [photoValues]
      );
    }
    
    await connection.query(
      'DELETE FROM EntryMods WHERE entryID = ?',
      [entryID]
    );
    
    if (mods && Array.isArray(mods) && mods.length > 0) {
      const processedModIds = await processCustomMods(connection, mods);
      
      if (processedModIds.length > 0) {
        const modValues = processedModIds.map((modId: number) => [entryID, modId]);
        
        await connection.query(
          'INSERT INTO EntryMods (entryID, modID) VALUES ?',
          [modValues]
        );
      }
    }
    
    await connection.query(
      'DELETE FROM EntryTags WHERE entryID = ?',
      [entryID]
    );
    
    if (tags && Array.isArray(tags) && tags.length > 0) {
      const [existingTags]: any = await connection.query(
        'SELECT tagID, tagName FROM Tags WHERE tagName IN (?)',
        [tags]
      );
      
      const existingTagsMap = new Map();
      existingTags.forEach((tag: any) => {
        existingTagsMap.set(tag.tagName, tag.tagID);
      });
      
      const tagsToCreate = tags.filter((tag: string) => !existingTagsMap.has(tag));
      
      if (tagsToCreate.length > 0) {
        const tagInsertValues = tagsToCreate.map((tag: string) => [tag]);
        
        const [tagResult]: any = await connection.query(
          'INSERT INTO Tags (tagName) VALUES ?',
          [tagInsertValues]
        );
        
        let newTagId = tagResult.insertId;
        tagsToCreate.forEach((tag: string) => {
          existingTagsMap.set(tag, newTagId++);
        });
      }
      
      const tagAssociationValues = [];
      for (const tag of tags) {
        const tagID = existingTagsMap.get(tag);
        if (tagID) {
          tagAssociationValues.push([entryID, tagID]);
        }
      }
      
      if (tagAssociationValues.length > 0) {
        await connection.query(
          'INSERT INTO EntryTags (entryID, tagID) VALUES ?',
          [tagAssociationValues]
        );
      }
    }
    
    await connection.commit();
    
    res.status(200).json({
      success: true,
      message: 'Car updated successfully',
    });
  } catch (error) {
    await connection.rollback();
    
    console.error('Error updating car:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update car',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  } finally {
    connection.release();
  }
});

router.get('/mods', authenticateUser, async (req: AuthenticatedRequest, res: Response) => {
  try {
    console.log('Fetching all mods');
    const [mods]: any = await pool.query(
      `SELECT modID as id, brand, category, cost, description, link, isCustom, type, partNumber
       FROM Mods
       ORDER BY category, brand`
    );
        
    res.status(200).json({
      success: true,
      mods: mods
    });
  } catch (error) {
    console.error('Error fetching all mods:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch modifications',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});


router.get('/user', authenticateUser, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user as any;
    
    const [carsResults]: any = await pool.query(`
      SELECT 
        e.entryID, e.userEmail, e.carName, e.carMake, e.carModel, e.carYear, 
        e.carColor, e.basecost, e.carTrim, e.description, e.totalMods, e.totalCost, e.category,
        e.region, e.upvotes, e.engine, e.transmission, e.drivetrain,
        e.horsepower, e.torque, e.viewCount, e.createdAt, e.updatedAt,
        p.s3Key as mainPhotoKey,
        GROUP_CONCAT(DISTINCT ap.s3Key) as allPhotoKeys,
        GROUP_CONCAT(DISTINCT t.tagName) as tagNames
      FROM Entries e
      LEFT JOIN EntryPhotos p ON e.entryID = p.entryID AND p.isMainPhoto = TRUE
      LEFT JOIN EntryPhotos ap ON e.entryID = ap.entryID
      LEFT JOIN EntryTags et ON e.entryID = et.entryID
      LEFT JOIN Tags t ON et.tagID = t.tagID
      WHERE e.userEmail = ?
      GROUP BY e.entryID
      ORDER BY e.createdAt DESC
    `, [user.userEmail]);
    
    const carIds = carsResults.map((car: any) => car.entryID);
    
    let modsMap = new Map();
    
    if (carIds.length > 0) {
      const [modsResults]: any = await pool.query(`
        SELECT 
          em.entryID, 
          m.modID, m.brand, m.category, m.cost, m.description, m.link
        FROM EntryMods em
        JOIN Mods m ON em.modID = m.modID
        WHERE em.entryID IN (?)
      `, [carIds]);
      
      modsResults.forEach((mod: any) => {
        if (!modsMap.has(mod.entryID)) {
          modsMap.set(mod.entryID, []);
        }
        modsMap.get(mod.entryID).push({
          modID: mod.modID,
          brand: mod.brand,
          category: mod.category,
          cost: mod.cost,
          description: mod.description,
          link: mod.link
        });
      });
    }
    
    const cars = carsResults.map((car: any) => ({
      ...car,
      allPhotoKeys: car.allPhotoKeys ? car.allPhotoKeys.split(',') : [],
      tags: car.tagNames ? car.tagNames.split(',') : [],
      mods: modsMap.get(car.entryID) || []
    }));
    
    console.log("Fetched user cars:", cars);
    res.status(200).json({
      success: true,
      cars
    });
  } catch (error) {
    console.error('Error fetching user cars:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch cars',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

router.get('/:entryID', authenticateUser, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { entryID } = req.params;
    const user = req.user as any;
    
    const [results]: any = await pool.query(`
      SELECT 
        e.entryID, e.userEmail, e.carName, e.carMake, e.carModel, e.carYear, 
        e.carColor, e.basecost, e.carTrim, e.description, e.totalMods, e.totalCost, e.category,
        e.region, e.upvotes, e.engine, e.transmission, e.drivetrain,
        e.horsepower, e.torque, e.viewCount, e.createdAt, e.updatedAt,
        p.s3Key as mainPhotoKey,
        GROUP_CONCAT(DISTINCT ap.photoID) as photoIDs,
        GROUP_CONCAT(DISTINCT ap.s3Key) as allPhotoKeys,
        GROUP_CONCAT(DISTINCT ap.isMainPhoto) as photoMainFlags,
        GROUP_CONCAT(DISTINCT ap.uploadDate) as photoUploadDates,
        GROUP_CONCAT(DISTINCT t.tagID) as tagIDs,
        GROUP_CONCAT(DISTINCT t.tagName) as tagNames
      FROM Entries e
      LEFT JOIN EntryPhotos p ON e.entryID = p.entryID AND p.isMainPhoto = TRUE
      LEFT JOIN EntryPhotos ap ON e.entryID = ap.entryID
      LEFT JOIN EntryTags et ON e.entryID = et.entryID
      LEFT JOIN Tags t ON et.tagID = t.tagID
      WHERE e.entryID = ? AND e.userEmail = ?
      GROUP BY e.entryID
    `, [entryID, user.userEmail]);
    
    if (results.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Car not found or you do not have permission to view this car'
      });
    }
    
    const car = results[0];
    
    if (car.photoIDs && car.allPhotoKeys) {
      const photoIDs = car.photoIDs.split(',');
      const photoKeys = car.allPhotoKeys.split(',');
      const photoMainFlags = car.photoMainFlags.split(',').map((flag: string) => flag === '1');
      const photoUploadDates = car.photoUploadDates.split(',');
      
      car.photos = photoIDs.map((id: string, index: number) => ({
        photoID: parseInt(id),
        s3Key: photoKeys[index],
        isMainPhoto: photoMainFlags[index],
        uploadDate: photoUploadDates[index]
      }));
      
      car.allPhotoKeys = photoKeys;
    } else {
      car.photos = [];
      car.allPhotoKeys = [];
    }
    
    if (car.tagIDs && car.tagNames) {
      const tagIDs = car.tagIDs.split(',');
      const tagNames = car.tagNames.split(',');
      
      car.tags = tagIDs.map((id: string, index: number) => ({
        tagID: parseInt(id),
        tagName: tagNames[index]
      }));
    } else {
      car.tags = [];
    }
    
    const [mods]: any = await pool.query(`
      SELECT m.modID, m.brand, m.category, m.cost, m.description, m.link
      FROM EntryMods em
      JOIN Mods m ON em.modID = m.modID
      WHERE em.entryID = ?
    `, [entryID]);
    
    car.mods = mods || [];
    
    delete car.photoIDs;
    delete car.photoMainFlags;
    delete car.photoUploadDates;
    delete car.tagIDs;
    delete car.tagNames;
    
    res.status(200).json({
      success: true,
      car
    });
  } catch (error) {
    console.error('Error fetching car details:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch car details',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

router.post('/', authenticateUser, async (req: AuthenticatedRequest, res: Response) => {
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();
    
    const user = req.user as any;
    const { 
      carName, carMake, carModel, carYear, carColor,basecost, description,
      totalMods, carTrim, totalCost, category, region, engine, transmission, 
      drivetrain, horsepower, torque, photos, tags, mods,
    } = req.body;
    
    if (!carName || !carMake || !carModel || !carTrim || !category || !region) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }
    
    if (!photos || !Array.isArray(photos) || photos.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'At least one photo is required'
      });
    }
    
    const [result]: any = await connection.query(
      `INSERT INTO Entries 
       (userEmail, carName, carMake, carModel, carYear, carColor, basecost, carTrim, description,
        totalMods, totalCost, category, region, engine, transmission, drivetrain,
        horsepower, torque)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        user.userEmail, carName, carMake, carModel, carYear || null, carColor || null, basecost || null, carTrim || null,
        description || null, totalMods || 0, totalCost || 0, category, region,
        engine || null, transmission || null, drivetrain || null,
        horsepower || null, torque || null
      ]
    );
    
    const entryID = result.insertId;
    
    if (photos.length > 0) {
      const photoValues = photos.map((photo: any) => [
        entryID,
        photo.s3Key,
        photo.isMainPhoto || false
      ]);
      
      await connection.query(
        `INSERT INTO EntryPhotos (entryID, s3Key, isMainPhoto)
         VALUES ?`,
        [photoValues]
      );
    }
    
    if (mods && Array.isArray(mods) && mods.length > 0) {
        const processedModIds = await processCustomMods(connection, mods);
        
        if (processedModIds.length > 0) {
            const modValues = processedModIds.map((modId: number) => [entryID, modId]);
            
            await connection.query(
            'INSERT INTO EntryMods (entryID, modID) VALUES ?',
            [modValues]
            );
        }
    }
    
    if (tags && Array.isArray(tags) && tags.length > 0) {
      const [existingTags]: any = await connection.query(
        'SELECT tagID, tagName FROM Tags WHERE tagName IN (?)',
        [tags]
      );
      
      const existingTagsMap = new Map();
      existingTags.forEach((tag: any) => {
        existingTagsMap.set(tag.tagName, tag.tagID);
      });
      
      const tagsToCreate = tags.filter((tag: string) => !existingTagsMap.has(tag));
      
      if (tagsToCreate.length > 0) {
        const tagInsertValues = tagsToCreate.map((tag: string) => [tag]);
        
        const [tagResult]: any = await connection.query(
          'INSERT INTO Tags (tagName) VALUES ?',
          [tagInsertValues]
        );
        
        let newTagId = tagResult.insertId;
        tagsToCreate.forEach((tag: string) => {
          existingTagsMap.set(tag, newTagId++);
        });
      }
      
      const tagAssociationValues = [];
      for (const tag of tags) {
        const tagID = existingTagsMap.get(tag);
        if (tagID) {
          tagAssociationValues.push([entryID, tagID]);
        }
      }
      
      if (tagAssociationValues.length > 0) {
        await connection.query(
          'INSERT INTO EntryTags (entryID, tagID) VALUES ?',
          [tagAssociationValues]
        );
      }
    }
    
    await connection.query(
      'UPDATE Users SET totalEntries = totalEntries + 1 WHERE userEmail = ?',
      [user.userEmail]
    );
    
    await connection.commit();
        
    res.status(201).json({
      success: true,
      message: 'Car added successfully',
    });
  } catch (error) {
    await connection.rollback();
    
    console.error('Error adding car:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add car',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  } finally {
    connection.release();
  }
});



interface EntryPhoto {
    s3Key: string;
    entryID: number;
    isMainPhoto?: boolean;
}
  
router.delete('/delete', authenticateUser, async (req: AuthenticatedRequest, res: Response) => {
  const connection = await pool.getConnection();
  
  try {
    const { entryID } = req.body;
    const user = req.user as any;
    
    await connection.beginTransaction();
    
    const [existingCars]: [any[], any] = await connection.query(
      'SELECT entryID FROM Entries WHERE entryID = ? AND userEmail = ?',
      [entryID, user.userEmail]
    );
    
    if (existingCars.length === 0) {
      await connection.rollback();
      return res.status(404).json({
        success: false,
        message: 'Car not found or you do not have permission to delete this car'
      });
    }
    
    const [photos] = await connection.query(
      'SELECT s3Key FROM EntryPhotos WHERE entryID = ?',
      [entryID]
    ) as [EntryPhoto[], any];
    
    
    await connection.query(
      'DELETE FROM Entries WHERE entryID = ? AND userEmail = ?',
      [entryID, user.userEmail]
    );
    
    await connection.query(
      'UPDATE Users SET totalEntries = GREATEST(totalEntries - 1, 0) WHERE userEmail = ?',
      [user.userEmail]
    );
    
    await connection.commit();
    
    
    if (photos.length > 0) {
      setTimeout(async () => {
        try {
          await Promise.all(photos.map((photo: any) => 
            s3.deleteObject({
              Bucket: BUCKET_NAME,
              Key: photo.s3Key
            }).promise()
          ));
        } catch (s3Error) {
          console.error('Error deleting photos from S3:', s3Error);
        }
      }, 0);
    }
    
    res.status(200).json({
      success: true,
      message: 'Car deleted successfully'
    });
    
  } catch (error) {
    await connection.rollback();
    console.error('Error deleting car:', error);
    res.status(500).json({
      success: false, 
      message: 'Failed to delete car',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  } finally {
    connection.release();
  }
});
  
router.put('/:entryID', authenticateUser, async (req: AuthenticatedRequest, res: Response) => {
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();
    
    const { entryID } = req.params;
    const user = req.user as any;
    const { 
      carName, carMake, carModel, carYear, carColor, basecost, description,
      totalMods, totalCost, category, region, engine, transmission, 
      drivetrain, horsepower, torque, photos, tags, mods,
    } = req.body;
    
    const [existingCars]: any = await connection.query(
      'SELECT entryID FROM Entries WHERE entryID = ? AND userEmail = ?',
      [entryID, user.userEmail]
    );
    
    if (existingCars.length === 0) {
      await connection.rollback();
      return res.status(404).json({
        success: false,
        message: 'Car not found or you do not have permission to update this car'
      });
    }
    
    await connection.query(
      `UPDATE Entries 
       SET carName = ?, carMake = ?, carModel = ?, carYear = ?, carColor = ?, basecost = ?,
           description = ?, totalMods = ?, totalCost = ?, category = ?, region = ?,
           engine = ?, transmission = ?, drivetrain = ?, horsepower = ?, torque = ?
       WHERE entryID = ? AND userEmail = ?`,
      [
        carName, carMake, carModel, carYear || null, carColor || null, basecost || null,
        description || null, totalMods || 0, totalCost || 0, category, region,
        engine || null, transmission || null, drivetrain || null,
        horsepower || null, torque || null,
        entryID, user.userEmail
      ]
    );
    
    if (photos && Array.isArray(photos) && photos.length > 0) {
      await connection.query('DELETE FROM EntryPhotos WHERE entryID = ?', [entryID]);
      
      const photoValues = photos.map((photo: any) => [
        entryID,
        photo.s3Key,
        photo.isMainPhoto || false
      ]);
      
      await connection.query(
        `INSERT INTO EntryPhotos (entryID, s3Key, isMainPhoto)
         VALUES ?`,
        [photoValues]
      );
    }
    
    if (mods && Array.isArray(mods)) {
      await connection.query('DELETE FROM EntryMods WHERE entryID = ?', [entryID]);
      
      if (mods.length > 0) {
        const modValues = mods.map((modId: number) => [entryID, modId]);
        
        await connection.query(
          'INSERT INTO EntryMods (entryID, modID) VALUES ?',
          [modValues]
        );
      }
    }
    
    if (tags && Array.isArray(tags)) {
      await connection.query('DELETE FROM EntryTags WHERE entryID = ?', [entryID]);
      
      if (tags.length > 0) {
        const [existingTags]: any = await connection.query(
          'SELECT tagID, tagName FROM Tags WHERE tagName IN (?)',
          [tags]
        );
        
        const existingTagsMap = new Map();
        existingTags.forEach((tag: any) => {
          existingTagsMap.set(tag.tagName, tag.tagID);
        });
        
        const tagsToCreate = tags.filter((tag: string) => !existingTagsMap.has(tag));
        
        if (tagsToCreate.length > 0) {
          const tagInsertValues = tagsToCreate.map((tag: string) => [tag]);
          
          const [tagResult]: any = await connection.query(
            'INSERT INTO Tags (tagName) VALUES ?',
            [tagInsertValues]
          );
          
          let newTagId = tagResult.insertId;
          tagsToCreate.forEach((tag: string) => {
            existingTagsMap.set(tag, newTagId++);
          });
        }
        
        const tagAssociationValues = [];
        for (const tag of tags) {
          const tagID = existingTagsMap.get(tag);
          if (tagID) {
            tagAssociationValues.push([entryID, tagID]);
          }
        }
        
        if (tagAssociationValues.length > 0) {
          await connection.query(
            'INSERT INTO EntryTags (entryID, tagID) VALUES ?',
            [tagAssociationValues]
          );
        }
      }
    }
    
    await connection.commit();
    
    res.status(200).json({
      success: true,
      message: 'Car updated successfully',
    });
  } catch (error) {
    await connection.rollback();
    
    console.error('Error updating car:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update car',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  } finally {
    connection.release();
  }
});

router.delete('/:entryID', authenticateUser, async (req: AuthenticatedRequest, res: Response) => {
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();
    
    const { entryID } = req.params;
    const user = req.user as any;
    
    const [existingCars]: any = await connection.query(
      'SELECT entryID FROM Entries WHERE entryID = ? AND userEmail = ?',
      [entryID, user.userEmail]
    );
    
    if (existingCars.length === 0) {
      await connection.rollback();
      return res.status(404).json({
        success: false,
        message: 'Car not found or you do not have permission to delete this car'
      });
    }
    
    const [photos]: any = await connection.query(
      'SELECT s3Key FROM EntryPhotos WHERE entryID = ?',
      [entryID]
    );
    
 
    await connection.query(
      'DELETE FROM Entries WHERE entryID = ? AND userEmail = ?',
      [entryID, user.userEmail]
    );
    
    await connection.query(
      'UPDATE Users SET totalEntries = GREATEST(totalEntries - 1, 0) WHERE userEmail = ?',
      [user.userEmail]
    );
    
    await connection.commit();
    
    if (photos.length > 0) {
      setTimeout(async () => {
        try {
          await Promise.all(photos.map((photo: any) => 
            s3.deleteObject({
              Bucket: BUCKET_NAME,
              Key: photo.s3Key
            }).promise()
          ));
        } catch (error) {
          console.error('Error deleting photos from S3:', error);
        }
      }, 0);
    }
    
    res.status(200).json({
      success: true,
      message: 'Car deleted successfully'
    });
  } catch (error) {
    await connection.rollback();
    console.error('Error deleting car:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete car',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  } finally {
    connection.release();
  }
});

router.get('/vinlookup/:vin', authenticateUser, async (req: AuthenticatedRequest, res: Response) => {
  const { vin } = req.params;
  
  try {
    if (!vin || vin.length !== 17) {
      return res.status(400).json({
        success: false,
        message: 'Invalid VIN format. VIN must be exactly 17 characters.'
      });
    }
    
    if (/[IOQ]/i.test(vin)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid VIN format. VIN cannot contain letters I, O, or Q.'
      });
    }    
    const nhtsaResponse = await axios.get(`https://vpic.nhtsa.dot.gov/api/vehicles/DecodeVin/${vin}?format=json`);
    const nhtsaData = nhtsaResponse.data;
    
    if (!nhtsaResponse.data || nhtsaResponse.status !== 200) {
      throw new Error(`NHTSA API returned ${nhtsaResponse.status}: ${nhtsaResponse.statusText}`);
    }
    
    
    if (!nhtsaData.Results || nhtsaData.Results.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No data found for this VIN'
      });
    }
    
    const findValue = (variableName: string): string => {
      const result = nhtsaData.Results.find((item: any) => 
        item.Variable?.toLowerCase().includes(variableName.toLowerCase())
      );
      return result?.Value || "";
    };
    
  
    const extractTrim = (): string => {
      const trim = findValue("Trim");
      const series = findValue("Series");
      const trim2 = findValue("Trim2");
      
      const trimParts = [trim, series, trim2].filter(Boolean);
      return trimParts.join(" ") || "";
    };
    
    const formatEngine = (): string => {
      const cylinders = findValue("Engine Number of Cylinders");
      const configuration = findValue("Engine Configuration");
      const fuelType = findValue("Fuel Type Primary");
      const displacement = findValue("Displacement (L)");
      const engineModel = findValue("Engine Model");
      const turbocharger = findValue("Turbocharger");
      
      let engine = "";
      
      if (displacement) {
        engine += `${displacement}L `;
      }
      
      if (cylinders && configuration) {
        engine += `${configuration}${cylinders} `;
      } else if (cylinders) {
        engine += `${cylinders}-Cylinder `;
      }
      
      if (turbocharger && turbocharger.toLowerCase() === "yes") {
        engine += "Turbo ";
      }
      
      if (fuelType && fuelType.toLowerCase() !== "gasoline") {
        engine += `${fuelType} `;
      }
      
      if (engineModel) {
        engine += `(${engineModel})`;
      }
      
      return engine.trim() || engineModel || "";
    };
    
    const formatTransmission = (): string => {
      const transmissionStyle = findValue("Transmission Style");
      const transmissionSpeeds = findValue("Transmission Speeds");
      const transmissionDescriptor = findValue("Transmission Descriptor");
      
      let transmission = "";
      
      if (transmissionSpeeds) {
        transmission += `${transmissionSpeeds}-Speed `;
      }
      
      if (transmissionStyle) {
        let style = transmissionStyle;
        if (style.toLowerCase().includes("manual")) {
          transmission += "Manual";
        } else if (style.toLowerCase().includes("automatic")) {
          transmission += "Automatic";
        } else if (style.toLowerCase().includes("cvt")) {
          transmission += "CVT";
        } else if (style.toLowerCase().includes("dct") || style.toLowerCase().includes("dual")) {
          transmission += "Dual-Clutch";
        } else {
          transmission += style;
        }
      }
      
      if (transmissionDescriptor && transmissionDescriptor !== transmissionStyle) {
        transmission += ` (${transmissionDescriptor})`;
      }
      
      return transmission.trim() || transmissionStyle || "";
    };
    
    const formatDrivetrain = (driveType: string): string => {
      if (!driveType) return "";
      
      const driveTypeLower = driveType.toLowerCase();
      
      if (driveTypeLower.includes("front")) return "FWD";
      if (driveTypeLower.includes("rear")) return "RWD";
      if (driveTypeLower.includes("all") || driveTypeLower.includes("awd")) return "AWD";
      if (driveTypeLower.includes("4wd") || driveTypeLower.includes("four")) return "4WD";
      
      return driveType;
    };
    
    const make = findValue("Make");
    const model = findValue("Model");
    const year = findValue("Model Year");
    
    if (!make || !model || !year) {
      return res.status(400).json({
        success: false,
        message: 'Incomplete vehicle data found for this VIN'
      });
    }
    
    const vinData = {
      make,
      model,
      year,
      trim: extractTrim(),
      engine: formatEngine(),
      transmission: formatTransmission(),
      drivetrain: formatDrivetrain(findValue("Drive Type")),
      color: ""
    };
    
    const cleanedData: any = {};
    Object.entries(vinData).forEach(([key, value]) => {
      if (value && value.trim() !== "") {
        cleanedData[key] = value;
      }
    });
    
    console.log(`✅ VIN lookup successful for ${vin}:`, cleanedData);
    
    res.json({
      success: true,
      message: 'VIN lookup successful',
      data: cleanedData,
      vin: vin
    });
    
  } catch (error) {
    console.error(`❌ VIN lookup error for ${vin}:`, error);
    
    let errorMessage = 'Failed to lookup VIN';
    if (error instanceof Error) {
      if (error.message.includes('NHTSA API')) {
        errorMessage = 'VIN database temporarily unavailable';
      } else if (error.message.includes('fetch')) {
        errorMessage = 'Network error while looking up VIN';
      } else {
        errorMessage = error.message;
      }
    }
    
    res.status(500).json({
      success: false,
      message: errorMessage
    });
  }
});


export default router;