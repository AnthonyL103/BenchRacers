// Optimized Garage Routes - Query Optimization Only
import { Router, Request, Response, NextFunction } from 'express';
import { config } from 'dotenv';
import jwt from 'jsonwebtoken';
import { pool } from '../dbconfig';
import AWS from 'aws-sdk';
import { FieldPacket, ResultSetHeader } from 'mysql2/promise';

config();
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Configure AWS S3
const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION || 'us-east-1'
});

const BUCKET_NAME = process.env.S3_BUCKET_NAME || 'your-bucket-name';

const router = Router();

// Define a custom interface to extend the Request type
interface AuthenticatedRequest extends Request {
  user?: jwt.JwtPayload | string;
}

const authenticateUser = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Authentication required' });
  }
  
  const token = authHeader.split(' ')[1];
  
  try {
    // Verify the JWT token
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded; // Attach the user data to the request
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
};

// Generate presigned URL for S3 upload
router.get('/s3/presigned-url', authenticateUser, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { fileName, fileType } = req.query;
    
    if (!fileName || !fileType || typeof fileName !== 'string' || typeof fileType !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'fileName and fileType are required as query parameters'
      });
    }
    
    // Generate a unique key for the file
    const user = req.user as any;
    const key = `users/${user.userEmail}/${Date.now()}-${fileName.replace(/\s+/g, '_')}`;
    
    // Create presigned URL
    const presignedUrl = s3.getSignedUrl('putObject', {
      Bucket: BUCKET_NAME,
      Key: key,
      ContentType: fileType,
      Expires: 300 // URL expires in 5 minutes
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


// Get all available mods - OPTIMIZED QUERY
router.get('/mods', authenticateUser, async (req: AuthenticatedRequest, res: Response) => {
  try {
    console.log('Fetching all mods');
    // This query is already optimal - using indexes on category and brand
    const [mods]: any = await pool.query(
      `SELECT modID as id, brand, category, cost, description, link 
       FROM Mods
       ORDER BY category, brand`
    );
    
    // Return as a flat array
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


// Get user's cars with photos - OPTIMIZED QUERY
router.get('/user', authenticateUser, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user as any;
    
    // OPTIMIZATION: Use JOIN instead of subquery and fetch all photos in a single query
    const [results]: any = await pool.query(`
      SELECT 
        e.entryID, e.userEmail, e.carName, e.carMake, e.carModel, e.carYear, 
        e.carColor, e.carTrim, e.description, e.totalMods, e.totalCost, e.category,
        e.region, e.upvotes, e.engine, e.transmission, e.drivetrain,
        e.horsepower, e.torque, e.viewCount, e.createdAt, e.updatedAt,
        p.s3Key as mainPhotoKey,
        GROUP_CONCAT(DISTINCT ap.s3Key) as allPhotoKeys
      FROM Entries e
      LEFT JOIN EntryPhotos p ON e.entryID = p.entryID AND p.isMainPhoto = TRUE
      LEFT JOIN EntryPhotos ap ON e.entryID = ap.entryID
      WHERE e.userEmail = ?
      GROUP BY e.entryID
      ORDER BY e.createdAt DESC
    `, [user.userEmail]);
    
    // Process the results to convert the concatenated photo keys to arrays
    const cars = results.map((car: any) => ({
      ...car,
      allPhotoKeys: car.allPhotoKeys ? car.allPhotoKeys.split(',') : []
    }));
    
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

// Get a specific car by ID with photos and tags - OPTIMIZED QUERY
router.get('/:entryID', authenticateUser, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { entryID } = req.params;
    const user = req.user as any;
    
    // OPTIMIZATION: Use JOIN instead of subquery, get car, photos, and tags in a single query
    const [results]: any = await pool.query(`
      SELECT 
        e.entryID, e.userEmail, e.carName, e.carMake, e.carModel, e.carYear, 
        e.carColor, e.carTrim, e.description, e.totalMods, e.totalCost, e.category,
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
    
    // Process the concatenated photo data into an array of photo objects
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
    
    // Process the concatenated tag data into an array of tag objects
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
    
    // Get mods associated with this car
    const [mods]: any = await pool.query(`
      SELECT m.modID, m.brand, m.category, m.cost, m.description, m.link
      FROM EntryMods em
      JOIN Mods m ON em.modID = m.modID
      WHERE em.entryID = ?
    `, [entryID]);
    
    car.mods = mods || [];
    
    // Clean up temporary fields
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

// Add a new car with photos - OPTIMIZED QUERIES
router.post('/', authenticateUser, async (req: AuthenticatedRequest, res: Response) => {
  // Use a connection for transaction
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();
    
    const user = req.user as any;
    const { 
      carName, carMake, carModel, carYear, carColor, description,
      totalMods, carTrim, totalCost, category, region, engine, transmission, 
      drivetrain, horsepower, torque, photos, tags, mods,
    } = req.body;
    
    // Validate required fields
    if (!carName || !carMake || !carModel || !carTrim || !category || !region) {
      connection.release(); // OPTIMIZATION: Early release on validation failure
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }
    
    if (!photos || !Array.isArray(photos) || photos.length === 0) {
      connection.release(); // OPTIMIZATION: Early release on validation failure
      return res.status(400).json({
        success: false,
        message: 'At least one photo is required'
      });
    }
    
    // Insert the new car
    const [result]: any = await connection.query(
      `INSERT INTO Entries 
       (userEmail, carName, carMake, carModel, carYear, carColor, carTrim, description,
        totalMods, totalCost, category, region, engine, transmission, drivetrain,
        horsepower, torque)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        user.userEmail, carName, carMake, carModel, carYear || null, carColor || null, carTrim || null,
        description || null, totalMods || 0, totalCost || 0, category, region,
        engine || null, transmission || null, drivetrain || null,
        horsepower || null, torque || null
      ]
    );
    
    const entryID = result.insertId;
    
    // OPTIMIZATION: Batch insert photos
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
    
    // OPTIMIZATION: Batch insert mods associations
    if (mods && Array.isArray(mods) && mods.length > 0) {
      const modValues = mods.map((modId: number) => [entryID, modId]);
      
      await connection.query(
        'INSERT INTO EntryMods (entryID, modID) VALUES ?',
        [modValues]
      );
    }
    
    // OPTIMIZATION: Process tags more efficiently
    if (tags && Array.isArray(tags) && tags.length > 0) {
      // Get all existing tags in one query
      const [existingTags]: any = await connection.query(
        'SELECT tagID, tagName FROM Tags WHERE tagName IN (?)',
        [tags]
      );
      
      // Create map for quick lookups
      const existingTagsMap = new Map();
      existingTags.forEach((tag: any) => {
        existingTagsMap.set(tag.tagName, tag.tagID);
      });
      
      // Find tags that need to be created
      const tagsToCreate = tags.filter((tag: string) => !existingTagsMap.has(tag));
      
      // Batch insert new tags if needed
      if (tagsToCreate.length > 0) {
        const tagInsertValues = tagsToCreate.map((tag: string) => [tag]);
        
        const [tagResult]: any = await connection.query(
          'INSERT INTO Tags (tagName) VALUES ?',
          [tagInsertValues]
        );
        
        // Add newly created tags to map
        let newTagId = tagResult.insertId;
        tagsToCreate.forEach((tag: string) => {
          existingTagsMap.set(tag, newTagId++);
        });
      }
      
      // Prepare values for batch insert of tag associations
      const tagAssociationValues = [];
      for (const tag of tags) {
        const tagID = existingTagsMap.get(tag);
        if (tagID) {
          tagAssociationValues.push([entryID, tagID]);
        }
      }
      
      // Batch insert all tag associations
      if (tagAssociationValues.length > 0) {
        await connection.query(
          'INSERT INTO EntryTags (entryID, tagID) VALUES ?',
          [tagAssociationValues]
        );
      }
    }
    
    // Increment user's totalEntries count
    await connection.query(
      'UPDATE Users SET totalEntries = totalEntries + 1 WHERE userEmail = ?',
      [user.userEmail]
    );
    
    // Commit transaction
    await connection.commit();
    
    // OPTIMIZATION: Get new car and photos in a single query
    const [results]: any = await pool.query(`
      SELECT 
        e.entryID, e.userEmail, e.carName, e.carMake, e.carModel, e.carYear, 
        e.carColor, e.description, e.totalMods, e.totalCost, e.category,
        e.region, e.upvotes, e.engine, e.transmission, e.drivetrain,
        e.horsepower, e.torque, e.viewCount, e.createdAt, e.updatedAt,
        p.s3Key as mainPhotoKey,
        GROUP_CONCAT(DISTINCT ap.s3Key) as allPhotoKeys
      FROM Entries e
      LEFT JOIN EntryPhotos p ON e.entryID = p.entryID AND p.isMainPhoto = TRUE
      LEFT JOIN EntryPhotos ap ON e.entryID = ap.entryID
      WHERE e.entryID = ?
      GROUP BY e.entryID
    `, [entryID]);
    
    // Process the car with its photos
    const car = results[0];
    car.allPhotoKeys = car.allPhotoKeys ? car.allPhotoKeys.split(',') : [];
    
    res.status(201).json({
      success: true,
      message: 'Car added successfully',
      car
    });
  } catch (error) {
    // Rollback transaction on error
    await connection.rollback();
    
    console.error('Error adding car:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add car',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  } finally {
    // Release connection
    connection.release();
  }
});

// Update an existing car with photos
router.put('/update/:entryID', authenticateUser, async (req: AuthenticatedRequest, res: Response) => {
  // Use a connection for transaction
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();
    
    const user = req.user as any;
    const entryID = parseInt(req.params.entryID);
    
    // Validate that entryID is provided and is a number
    if (!entryID || isNaN(entryID)) {
      connection.release();
      return res.status(400).json({
        success: false,
        message: 'Invalid entry ID'
      });
    }
    
    const { 
      carName, carMake, carModel, carYear, carColor, carTrim, description,
      totalMods, totalCost, category, region, engine, transmission, 
      drivetrain, horsepower, torque, photos, tags, mods,
    } = req.body;
    
    // Validate required fields
    if (!carName || !carMake || !carModel || !carTrim || !category || !region) {
      connection.release();
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }
    
    if (!photos || !Array.isArray(photos) || photos.length === 0) {
      connection.release();
      return res.status(400).json({
        success: false,
        message: 'At least one photo is required'
      });
    }
    
    // Check if the car entry exists and belongs to the user
    const [existingEntry]: any = await connection.query(
      'SELECT entryID FROM Entries WHERE entryID = ? AND userEmail = ?',
      [entryID, user.userEmail]
    );
    
    if (!existingEntry || existingEntry.length === 0) {
      connection.release();
      return res.status(404).json({
        success: false,
        message: 'Car entry not found or you do not have permission to update it'
      });
    }
    
    // Update the car entry
    await connection.query(
      `UPDATE Entries SET 
        carName = ?, carMake = ?, carModel = ?, carYear = ?, carColor = ?, carTrim = ?,
        description = ?, totalMods = ?, totalCost = ?, category = ?, 
        region = ?, engine = ?, transmission = ?, drivetrain = ?,
        horsepower = ?, torque = ?, updatedAt = NOW()
       WHERE entryID = ? AND userEmail = ?`,
      [
        carName, carMake, carModel, carYear || null, carColor || null, carTrim || null,
        description || null, totalMods || 0, totalCost || 0, category, region,
        engine || null, transmission || null, drivetrain || null,
        horsepower || null, torque || null, entryID, user.userEmail
      ]
    );
    
    // Handle photos: Delete existing photos and add new ones
    // First, delete existing photo associations
    await connection.query(
      'DELETE FROM EntryPhotos WHERE entryID = ?',
      [entryID]
    );
    
    // Then add new photos
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
    
    // Handle mods: Delete existing mods and add new ones
    // First, delete existing mod associations
    await connection.query(
      'DELETE FROM EntryMods WHERE entryID = ?',
      [entryID]
    );
    
    // Then add new mods
    if (mods && Array.isArray(mods) && mods.length > 0) {
      const modValues = mods.map((modId: number) => [entryID, modId]);
      
      await connection.query(
        'INSERT INTO EntryMods (entryID, modID) VALUES ?',
        [modValues]
      );
    }
    
    // Handle tags: Delete existing tags and add new ones
    // First, delete existing tag associations
    await connection.query(
      'DELETE FROM EntryTags WHERE entryID = ?',
      [entryID]
    );
    
    // Process new tags
    if (tags && Array.isArray(tags) && tags.length > 0) {
      // Get all existing tags in one query
      const [existingTags]: any = await connection.query(
        'SELECT tagID, tagName FROM Tags WHERE tagName IN (?)',
        [tags]
      );
      
      // Create map for quick lookups
      const existingTagsMap = new Map();
      existingTags.forEach((tag: any) => {
        existingTagsMap.set(tag.tagName, tag.tagID);
      });
      
      // Find tags that need to be created
      const tagsToCreate = tags.filter((tag: string) => !existingTagsMap.has(tag));
      
      // Batch insert new tags if needed
      if (tagsToCreate.length > 0) {
        const tagInsertValues = tagsToCreate.map((tag: string) => [tag]);
        
        const [tagResult]: any = await connection.query(
          'INSERT INTO Tags (tagName) VALUES ?',
          [tagInsertValues]
        );
        
        // Add newly created tags to map
        let newTagId = tagResult.insertId;
        tagsToCreate.forEach((tag: string) => {
          existingTagsMap.set(tag, newTagId++);
        });
      }
      
      // Prepare values for batch insert of tag associations
      const tagAssociationValues = [];
      for (const tag of tags) {
        const tagID = existingTagsMap.get(tag);
        if (tagID) {
          tagAssociationValues.push([entryID, tagID]);
        }
      }
      
      // Batch insert all tag associations
      if (tagAssociationValues.length > 0) {
        await connection.query(
          'INSERT INTO EntryTags (entryID, tagID) VALUES ?',
          [tagAssociationValues]
        );
      }
    }
    
    // Commit transaction
    await connection.commit();
    
    // Get updated car and photos in a single query
    const [results]: any = await pool.query(`
      SELECT 
        e.entryID, e.userEmail, e.carName, e.carMake, e.carModel, e.carYear, 
        e.carColor, e.carTrim, e.description, e.totalMods, e.totalCost, e.category,
        e.region, e.upvotes, e.engine, e.transmission, e.drivetrain,
        e.horsepower, e.torque, e.viewCount, e.createdAt, e.updatedAt,
        p.s3Key as mainPhotoKey,
        GROUP_CONCAT(DISTINCT ap.s3Key) as allPhotoKeys,
        GROUP_CONCAT(DISTINCT t.tagName) as tags
      FROM Entries e
      LEFT JOIN EntryPhotos p ON e.entryID = p.entryID AND p.isMainPhoto = TRUE
      LEFT JOIN EntryPhotos ap ON e.entryID = ap.entryID
      LEFT JOIN EntryTags et ON e.entryID = et.entryID
      LEFT JOIN Tags t ON et.tagID = t.tagID
      WHERE e.entryID = ?
      GROUP BY e.entryID
    `, [entryID]);
    
    // Process the car with its photos and tags
    const car = results[0];
    car.allPhotoKeys = car.allPhotoKeys ? car.allPhotoKeys.split(',') : [];
    car.tags = car.tags ? car.tags.split(',') : [];
    
    // Get associated mods
    const [modResults]: any = await pool.query(`
      SELECT m.modID, m.brand, m.cost, m.description, m.category, m.link
      FROM EntryMods em
      JOIN Mods m ON em.modID = m.modID
      WHERE em.entryID = ?
    `, [entryID]);
    
    car.mods = modResults || [];
    
    res.status(200).json({
      success: true,
      message: 'Car updated successfully',
      car
    });
  } catch (error) {
    // Rollback transaction on error
    await connection.rollback();
    
    console.error('Error updating car:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update car',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  } finally {
    // Release connection
    connection.release();
  }
});

// Define types for your database entities
interface EntryPhoto {
    s3Key: string;
    entryID: number;
    isMainPhoto?: boolean;
}
  
// Delete car - OPTIMIZED QUERY
router.delete('/delete', authenticateUser, async (req: AuthenticatedRequest, res: Response) => {
  const connection = await pool.getConnection();
  
  try {
    const { entryID } = req.body;
    const user = req.user as any;
    
    await connection.beginTransaction();
    
    // OPTIMIZATION: Only select needed fields
    const [existingCars]: [any[], any] = await connection.query(
      'SELECT entryID FROM Entries WHERE entryID = ? AND userEmail = ?',
      [entryID, user.userEmail]
    );
    
    if (existingCars.length === 0) {
      await connection.rollback();
      connection.release();
      return res.status(404).json({
        success: false,
        message: 'Car not found or you do not have permission to delete this car'
      });
    }
    
    // Get photos
    const [photos] = await connection.query(
      'SELECT s3Key FROM EntryPhotos WHERE entryID = ?',
      [entryID]
    ) as [EntryPhoto[], any];
    
    // OPTIMIZATION: Perform delete and update operations in one transaction
    // Delete the car (with cascading deletes for related records)
    await connection.query(
      'DELETE FROM Entries WHERE entryID = ? AND userEmail = ?',
      [entryID, user.userEmail]
    );
    
    // Update user stats
    await connection.query(
      'UPDATE Users SET totalEntries = GREATEST(totalEntries - 1, 0) WHERE userEmail = ?',
      [user.userEmail]
    );
    
    await connection.commit();
    
    // Process photos - no more TypeScript errors
    // This happens after we've already responded to the client
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
  
// Update a car including photos - OPTIMIZED QUERIES
router.put('/:entryID', authenticateUser, async (req: AuthenticatedRequest, res: Response) => {
  // Use a connection for transaction
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();
    
    const { entryID } = req.params;
    const user = req.user as any;
    const { 
      carName, carMake, carModel, carYear, carColor, description,
      totalMods, totalCost, category, region, engine, transmission, 
      drivetrain, horsepower, torque, photos, tags, mods,
    } = req.body;
    
    // OPTIMIZATION: Only select needed fields
    const [existingCars]: any = await connection.query(
      'SELECT entryID FROM Entries WHERE entryID = ? AND userEmail = ?',
      [entryID, user.userEmail]
    );
    
    if (existingCars.length === 0) {
      await connection.rollback();
      connection.release();
      return res.status(404).json({
        success: false,
        message: 'Car not found or you do not have permission to update this car'
      });
    }
    
    // Update the car
    await connection.query(
      `UPDATE Entries 
       SET carName = ?, carMake = ?, carModel = ?, carYear = ?, carColor = ?, 
           description = ?, totalMods = ?, totalCost = ?, category = ?, region = ?,
           engine = ?, transmission = ?, drivetrain = ?, horsepower = ?, torque = ?
       WHERE entryID = ? AND userEmail = ?`,
      [
        carName, carMake, carModel, carYear || null, carColor || null, 
        description || null, totalMods || 0, totalCost || 0, category, region,
        engine || null, transmission || null, drivetrain || null,
        horsepower || null, torque || null,
        entryID, user.userEmail
      ]
    );
    
    // OPTIMIZATION: Batch insert photos if provided
    if (photos && Array.isArray(photos) && photos.length > 0) {
      // Delete existing photos
      await connection.query('DELETE FROM EntryPhotos WHERE entryID = ?', [entryID]);
      
      // Batch insert new photos
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
    
    // OPTIMIZATION: Batch insert mods if provided
    if (mods && Array.isArray(mods)) {
      // Delete existing associations
      await connection.query('DELETE FROM EntryMods WHERE entryID = ?', [entryID]);
      
      if (mods.length > 0) {
        // Batch insert new associations
        const modValues = mods.map((modId: number) => [entryID, modId]);
        
        await connection.query(
          'INSERT INTO EntryMods (entryID, modID) VALUES ?',
          [modValues]
        );
      }
    }
    
    // OPTIMIZATION: Process tags more efficiently
    if (tags && Array.isArray(tags)) {
      // Delete existing tag associations
      await connection.query('DELETE FROM EntryTags WHERE entryID = ?', [entryID]);
      
      if (tags.length > 0) {
        // Get all existing tags in one query
        const [existingTags]: any = await connection.query(
          'SELECT tagID, tagName FROM Tags WHERE tagName IN (?)',
          [tags]
        );
        
        // Create map for quick lookups
        const existingTagsMap = new Map();
        existingTags.forEach((tag: any) => {
          existingTagsMap.set(tag.tagName, tag.tagID);
        });
        
        // Find tags that need to be created
        const tagsToCreate = tags.filter((tag: string) => !existingTagsMap.has(tag));
        
        // Batch insert new tags if needed
        if (tagsToCreate.length > 0) {
          const tagInsertValues = tagsToCreate.map((tag: string) => [tag]);
          
          const [tagResult]: any = await connection.query(
            'INSERT INTO Tags (tagName) VALUES ?',
            [tagInsertValues]
          );
          
          // Add newly created tags to map
          let newTagId = tagResult.insertId;
          tagsToCreate.forEach((tag: string) => {
            existingTagsMap.set(tag, newTagId++);
          });
        }
        
        // Prepare values for batch insert of tag associations
        const tagAssociationValues = [];
        for (const tag of tags) {
          const tagID = existingTagsMap.get(tag);
          if (tagID) {
            tagAssociationValues.push([entryID, tagID]);
          }
        }
        
        // Batch insert all tag associations
        if (tagAssociationValues.length > 0) {
          await connection.query(
            'INSERT INTO EntryTags (entryID, tagID) VALUES ?',
            [tagAssociationValues]
          );
        }
      }
    }
    
    // Commit transaction
    await connection.commit();
    
    // OPTIMIZATION: Get updated car and photos in a single query
    const [results]: any = await pool.query(`
      SELECT 
        e.entryID, e.userEmail, e.carName, e.carMake, e.carModel, e.carYear, 
        e.carColor, e.description, e.totalMods, e.totalCost, e.category,
        e.region, e.upvotes, e.engine, e.transmission, e.drivetrain,
        e.horsepower, e.torque, e.viewCount, e.createdAt, e.updatedAt,
        p.s3Key as mainPhotoKey,
        GROUP_CONCAT(DISTINCT ap.s3Key) as allPhotoKeys
      FROM Entries e
      LEFT JOIN EntryPhotos p ON e.entryID = p.entryID AND p.isMainPhoto = TRUE
      LEFT JOIN EntryPhotos ap ON e.entryID = ap.entryID
      WHERE e.entryID = ?
      GROUP BY e.entryID
    `, [entryID]);
    
    // Process the car with its photos
    const car = results[0];
    car.allPhotoKeys = car.allPhotoKeys ? car.allPhotoKeys.split(',') : [];
    
    res.status(200).json({
      success: true,
      message: 'Car updated successfully',
      car
    });
  } catch (error) {
    // Rollback transaction on error
    await connection.rollback();
    
    console.error('Error updating car:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update car',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  } finally {
    // Release connection
    connection.release();
  }
});

// Delete a car - OPTIMIZED QUERY (this endpoint seems redundant with /delete)
router.delete('/:entryID', authenticateUser, async (req: AuthenticatedRequest, res: Response) => {
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();
    
    const { entryID } = req.params;
    const user = req.user as any;
    
    // OPTIMIZATION: Only select needed fields
    const [existingCars]: any = await connection.query(
      'SELECT entryID FROM Entries WHERE entryID = ? AND userEmail = ?',
      [entryID, user.userEmail]
    );
    
    if (existingCars.length === 0) {
      await connection.rollback();
      connection.release();
      return res.status(404).json({
        success: false,
        message: 'Car not found or you do not have permission to delete this car'
      });
    }
    
    // Get photos before deleting
    const [photos]: any = await connection.query(
      'SELECT s3Key FROM EntryPhotos WHERE entryID = ?',
      [entryID]
    );
    
    // OPTIMIZATION: Use transaction for both operations
    // Delete the car (with cascading deletes for related records)
    await connection.query(
      'DELETE FROM Entries WHERE entryID = ? AND userEmail = ?',
      [entryID, user.userEmail]
    );
    
    // Update user's entry count
    await connection.query(
      'UPDATE Users SET totalEntries = GREATEST(totalEntries - 1, 0) WHERE userEmail = ?',
      [user.userEmail]
    );
    
    await connection.commit();
    
    // Optionally process S3 deletions asynchronously
    if (photos.length > 0) {
      // Don't wait for this to complete before responding
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

export default router;