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

// Get user's cars with photos
router.get('/user', authenticateUser, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user as any;
    
    // Get all cars for the user
    const [carsResult]: any = await pool.query(`
      SELECT e.*, 
        (SELECT s3Key FROM EntryPhotos WHERE entryID = e.entryID AND isMainPhoto = TRUE LIMIT 1) as mainPhotoKey
      FROM Entries e
      WHERE e.userEmail = ?
      ORDER BY e.createdAt DESC
    `, [user.userEmail]);
    
    // For each car, get all photo keys
    const cars = await Promise.all(carsResult.map(async (car: any) => {
      const [photos]: any = await pool.query(`
        SELECT s3Key
        FROM EntryPhotos
        WHERE entryID = ?
        ORDER BY isMainPhoto DESC, uploadDate ASC
      `, [car.entryID]);
      
      return {
        ...car,
        allPhotoKeys: photos.map((photo: any) => photo.s3Key)
      };
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

// Get a specific car by ID with photos
router.get('/:entryID', authenticateUser, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { entryID } = req.params;
    const user = req.user as any;
    
    // Query the car with photos
    const [cars]: any = await pool.query(`
      SELECT e.*, 
        (SELECT s3Key FROM EntryPhotos WHERE entryID = e.entryID AND isMainPhoto = TRUE LIMIT 1) as mainPhotoKey
      FROM Entries e
      WHERE e.entryID = ? AND e.userEmail = ?
    `, [entryID, user.userEmail]);
    
    if (cars.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Car not found or you do not have permission to view this car'
      });
    }
    
    const car = cars[0];
    
    // Get all photos for this car
    const [photos]: any = await pool.query(`
      SELECT photoID, s3Key, isMainPhoto, uploadDate
      FROM EntryPhotos
      WHERE entryID = ?
      ORDER BY isMainPhoto DESC, uploadDate ASC
    `, [entryID]);
    
    // Add photos to car object
    car.photos = photos;
    car.allPhotoKeys = photos.map((photo: any) => photo.s3Key);
    
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

// Add a new car with photos
router.post('/', authenticateUser, async (req: AuthenticatedRequest, res: Response) => {
  // Use a connection for transaction
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();
    
    const user = req.user as any;
    const { 
      carName, carMake, carModel, carYear, carColor, description,
      totalMods, totalCost, category, region, engine, transmission, 
      drivetrain, horsepower, torque, photos, tags, mods,
    } = req.body;
    
    // Validate required fields
    if (!carName || !carMake || !carModel || !category || !region) {
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
    
    // Insert the new car
    const [result]: any = await connection.query(
      `INSERT INTO Entries 
       (userEmail, carName, carMake, carModel, carYear, carColor, description,
        totalMods, totalCost, category, region, engine, transmission, drivetrain,
        horsepower, torque)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        user.userEmail, carName, carMake, carModel, carYear || null, carColor || null, 
        description || null, totalMods || 0, totalCost || 0, category, region,
        engine || null, transmission || null, drivetrain || null,
        horsepower || null, torque || null
      ]
    );
    
    const entryID = result.insertId;
    
    // Insert photos
    for (const photo of photos) {
      await connection.query(
        `INSERT INTO EntryPhotos (entryID, s3Key, isMainPhoto)
         VALUES (?, ?, ?)`,
        [entryID, photo.s3Key, photo.isMainPhoto || false]
      );
    }
    
    // Insert mods associations
    if (mods && Array.isArray(mods) && mods.length > 0) {
      for (const modId of mods) {
        await connection.query(
          'INSERT INTO EntryMods (entryID, modID) VALUES (?, ?)',
          [entryID, modId]
        );
      }
    }
    
    // Insert tags
    if (tags && Array.isArray(tags) && tags.length > 0) {
      for (const tag of tags) {
        // Try to insert the tag, or get its ID if it already exists
        let tagID;
        
        try {
          // Check if tag exists
          const [existingTags]: any = await connection.query(
            'SELECT tagID FROM Tags WHERE tagName = ?',
            [tag]
          );
          
          if (existingTags.length > 0) {
            // Tag exists, use its ID
            tagID = existingTags[0].tagID;
          } else {
            // Tag doesn't exist, create it
            const [tagResult]: any = await connection.query(
              'INSERT INTO Tags (tagName) VALUES (?)',
              [tag]
            );
            tagID = tagResult.insertId;
          }
          
          // Associate tag with entry
          await connection.query(
            'INSERT INTO EntryTags (entryID, tagID) VALUES (?, ?)',
            [entryID, tagID]
          );
        } catch (error) {
          console.error('Error processing tag:', tag, error);
          // Continue with other tags
        }
      }
    }
    
    // Increment user's totalEntries count
    await connection.query(
      'UPDATE Users SET totalEntries = totalEntries + 1 WHERE userEmail = ?',
      [user.userEmail]
    );
    
    // Commit transaction
    await connection.commit();
    
    // Get the new car with its main photo
    const [cars]: any = await pool.query(`
      SELECT e.*, 
        (SELECT s3Key FROM EntryPhotos WHERE entryID = e.entryID AND isMainPhoto = TRUE LIMIT 1) as mainPhotoKey
      FROM Entries e
      WHERE e.entryID = ?
    `, [entryID]);
    
    // Get all photos for this car
    const [entryPhotos]: any = await pool.query(`
      SELECT s3Key
      FROM EntryPhotos
      WHERE entryID = ?
      ORDER BY isMainPhoto DESC, uploadDate ASC
    `, [entryID]);
    
    // Add photos to car object
    const car = cars[0];
    car.allPhotoKeys = entryPhotos.map((photo: any) => photo.s3Key);
    
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

// Define types for your database entities
// Define EntryPhoto interface
interface EntryPhoto {
    s3Key: string;
    entryID: number;
    isMainPhoto?: boolean;
}
  
router.delete('/delete', authenticateUser, async (req: AuthenticatedRequest, res: Response) => {
  const connection = await pool.getConnection();
  
  try {
    const { entryID } = req.body;
    const user = req.user as any; // Simple any type
    
    await connection.beginTransaction();
    
    // Using any for the query results
    const [existingCars]: [any[], any] = await connection.query(
      'SELECT * FROM Entries WHERE entryID = ? AND userEmail = ?',
      [entryID, user.userEmail]
    );
    
    if (existingCars.length === 0) {
      await connection.rollback();
      return res.status(404).json({
        success: false,
        message: 'Car not found or you do not have permission to delete this car'
      });
    }
    
    // Get photos with any for field packets
    const [photos] = await connection.query(
      'SELECT s3Key FROM EntryPhotos WHERE entryID = ?',
      [entryID]
    ) as [EntryPhoto[], any];
    
    // Delete the car
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
    if (photos.length > 0) {
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
  
// Update a car including photos
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
    
    // Check if the car exists and belongs to the user
    const [existingCars]: any = await connection.query(
      'SELECT * FROM Entries WHERE entryID = ? AND userEmail = ?',
      [entryID, user.userEmail]
    );
    
    if (existingCars.length === 0) {
      await connection.rollback();
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
    
    // Update photos if provided
    if (photos && Array.isArray(photos) && photos.length > 0) {
      // Delete existing photos
      await connection.query('DELETE FROM EntryPhotos WHERE entryID = ?', [entryID]);
      
      // Insert new photos
      for (const photo of photos) {
        await connection.query(
          `INSERT INTO EntryPhotos (entryID, s3Key, isMainPhoto)
           VALUES (?, ?, ?)`,
          [entryID, photo.s3Key, photo.isMainPhoto || false]
        );
      }
    }
    
    // Update mods if provided
    if (mods && Array.isArray(mods)) {
      // Delete existing associations
      await connection.query('DELETE FROM EntryMods WHERE entryID = ?', [entryID]);
      
      // Insert new associations
      for (const modId of mods) {
        await connection.query(
          'INSERT INTO EntryMods (entryID, modID) VALUES (?, ?)',
          [entryID, modId]
        );
      }
    }
    
    // Update tags if provided
    if (tags && Array.isArray(tags)) {
      // Delete existing tag associations
      await connection.query('DELETE FROM EntryTags WHERE entryID = ?', [entryID]);
      
      // Insert new tag associations
      for (const tag of tags) {
        // Try to insert the tag, or get its ID if it already exists
        let tagID;
        
        try {
          // Check if tag exists
          const [existingTags]: any = await connection.query(
            'SELECT tagID FROM Tags WHERE tagName = ?',
            [tag]
          );
          
          if (existingTags.length > 0) {
            // Tag exists, use its ID
            tagID = existingTags[0].tagID;
          } else {
            // Tag doesn't exist, create it
            const [tagResult]: any = await connection.query(
              'INSERT INTO Tags (tagName) VALUES (?)',
              [tag]
            );
            tagID = tagResult.insertId;
          }
          
          // Associate tag with entry
          await connection.query(
            'INSERT INTO EntryTags (entryID, tagID) VALUES (?, ?)',
            [entryID, tagID]
          );
        } catch (error) {
          console.error('Error processing tag:', tag, error);
          // Continue with other tags
        }
      }
    }
    
    // Commit transaction
    await connection.commit();
    
    // Get the updated car with photos
    const [cars]: any = await pool.query(`
      SELECT e.*, 
        (SELECT s3Key FROM EntryPhotos WHERE entryID = e.entryID AND isMainPhoto = TRUE LIMIT 1) as mainPhotoKey
      FROM Entries e
      WHERE e.entryID = ?
    `, [entryID]);
    
    // Get all photos for this car
    const [entryPhotos]: any = await pool.query(`
      SELECT s3Key
      FROM EntryPhotos
      WHERE entryID = ?
      ORDER BY isMainPhoto DESC, uploadDate ASC
    `, [entryID]);
    
    // Add photos to car object
    const car = cars[0];
    car.allPhotoKeys = entryPhotos.map((photo: any) => photo.s3Key);
    
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

// Delete a car
router.delete('/:entryID', authenticateUser, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { entryID } = req.params;
    const user = req.user as any;
    
    // Check if the car exists and belongs to the user
    const [existingCars]: any = await pool.query(
      'SELECT * FROM Entries WHERE entryID = ? AND userEmail = ?',
      [entryID, user.userEmail]
    );
    
    if (existingCars.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Car not found or you do not have permission to delete this car'
      });
    }
    
    // Get photos before deleting (so we can potentially delete from S3 later)
    const [photos]: any = await pool.query(
      'SELECT s3Key FROM EntryPhotos WHERE entryID = ?',
      [entryID]
    );
    
    // Delete the car (this will cascade delete photos and other relations due to ON DELETE CASCADE)
    await pool.query(
      'DELETE FROM Entries WHERE entryID = ? AND userEmail = ?',
      [entryID, user.userEmail]
    );
    
    // Optionally: Delete photos from S3
    // This could be done asynchronously or with a queue system in a production app
    /*
    for (const photo of photos) {
      try {
        await s3.deleteObject({
          Bucket: BUCKET_NAME,
          Key: photo.s3Key
        }).promise();
      } catch (error) {
        console.error('Error deleting photo from S3:', photo.s3Key, error);
      }
    }
    */
    
    // Decrement user's totalEntries count
    await pool.query(
      'UPDATE Users SET totalEntries = GREATEST(totalEntries - 1, 0) WHERE userEmail = ?',
      [user.userEmail]
    );
    
    res.status(200).json({
      success: true,
      message: 'Car deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting car:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete car',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});



router.get('/mods', authenticateUser, async (req: AuthenticatedRequest, res: Response) => {
  try {
    // Query all mods from the unified Mods table
    const [mods]: any = await pool.query(
      `SELECT modID as id, brand, category, cost, description, link 
       FROM Mods
       ORDER BY category, brand`
    );
    
    // Return as a flat array (or optionally grouped if your frontend expects it)
    res.status(200).json({
      success: true,
      mods: mods // This is now a flat array with category property included
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

export default router;