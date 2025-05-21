// Admin Routes
import { Router, Request, Response, NextFunction } from 'express';
import { config } from 'dotenv';
import jwt from 'jsonwebtoken';
import { pool } from '../dbconfig';
import { FieldPacket, ResultSetHeader } from 'mysql2/promise';

config();
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

const router = Router();

// Define a custom interface to extend the Request type
interface AuthenticatedRequest extends Request {
  user?: jwt.JwtPayload | string;
}

// Admin authentication middleware
const authenticateAdmin = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Authentication required' });
  }
  
  const token = authHeader.split(' ')[1];
  
  try {
    // Verify the JWT token
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    req.user = decoded;
    
    // Check if user is an admin/editor
    const [users]: any = await pool.query(
      'SELECT isEditor FROM Users WHERE userEmail = ?',
      [decoded.userEmail]
    );
    
    if (users.length === 0 || !users[0].isEditor) {
      return res.status(403).json({ message: 'Access denied: Admin privileges required' });
    }
    
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
};

// =============== USER ROUTES ===============

// Get all users
router.get('/users', authenticateAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { search, region, orderByDate, orderByName } = req.query;
    
    let query = `
      SELECT userEmail, name, region, accountCreated, totalEntries, isVerified, isEditor
      FROM Users
      WHERE 1=1
    `;
    
    const queryParams: any[] = [];
    
    // Add search filter if provided
    if (search) {
      query += ` AND (userEmail LIKE ? OR name LIKE ?)`;
      queryParams.push(`%${search}%`, `%${search}%`);
    }
    
    // Add region filter if provided
    if (region && region !== 'false') {
      query += ` AND region = ?`;
      queryParams.push(region);
    }
    
    // Add ordering
    if (orderByDate && orderByDate !== 'false') {
      query += ` ORDER BY accountCreated DESC`;
    } else if (orderByName && orderByName !== 'false') {
      query += ` ORDER BY name ASC`;
    } else {
      query += ` ORDER BY accountCreated DESC`;
    }
    
    const [users]: any = await pool.query(query, queryParams);
    
    res.status(200).json({
      success: true,
      users
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch users',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get a specific user
router.get('/users/:email', authenticateAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { email } = req.params;
    
    const [users]: any = await pool.query(
      `SELECT userEmail, name, region, accountCreated, totalEntries, isVerified, isEditor
       FROM Users
       WHERE userEmail = ?`,
      [email]
    );
    
    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    res.status(200).json({
      success: true,
      user: users[0]
    });
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Create a new user
router.post('/users', authenticateAdmin, async (req: AuthenticatedRequest, res: Response) => {
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();
    
    const { email, name, password, region, isVerified, isEditor } = req.body;
    
    if (!email || !name || !password || !region) {
      connection.release();
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: email, name, password, and region are required'
      });
    }
    
    // Check if user already exists
    const [existingUsers]: any = await connection.query(
      'SELECT userEmail FROM Users WHERE userEmail = ?',
      [email]
    );
    
    if (existingUsers.length > 0) {
      connection.release();
      return res.status(409).json({
        success: false,
        message: 'User with this email already exists'
      });
    }
    
    // Insert new user
    await connection.query(
      `INSERT INTO Users 
       (userEmail, name, password, region, accountCreated, totalEntries, isVerified, isEditor)
       VALUES (?, ?, ?, ?, NOW(), 0, ?, ?)`,
      [email, name, password, region, isVerified || false, isEditor || false]
    );
    
    await connection.commit();
    
    res.status(201).json({
      success: true,
      message: 'User created successfully'
    });
  } catch (error) {
    await connection.rollback();
    console.error('Error creating user:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create user',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  } finally {
    connection.release();
  }
});

// Update a user
router.put('/users/:email', authenticateAdmin, async (req: AuthenticatedRequest, res: Response) => {
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();
    
    const { email } = req.params;
    const { name, password, region, isVerified, isEditor } = req.body;
    
    // Check if user exists
    const [existingUsers]: any = await connection.query(
      'SELECT userEmail FROM Users WHERE userEmail = ?',
      [email]
    );
    
    if (existingUsers.length === 0) {
      connection.release();
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    let query = 'UPDATE Users SET ';
    const queryParams: any[] = [];
    const updateFields: string[] = [];
    
    if (name) {
      updateFields.push('name = ?');
      queryParams.push(name);
    }
    
    if (password) {
      updateFields.push('password = ?');
      queryParams.push(password);
    }
    
    if (region) {
      updateFields.push('region = ?');
      queryParams.push(region);
    }
    
    if (isVerified !== undefined) {
      updateFields.push('isVerified = ?');
      queryParams.push(isVerified);
    }
    
    if (isEditor !== undefined) {
      updateFields.push('isEditor = ?');
      queryParams.push(isEditor);
    }
    
    if (updateFields.length === 0) {
      connection.release();
      return res.status(400).json({
        success: false,
        message: 'No fields to update'
      });
    }
    
    query += updateFields.join(', ');
    query += ' WHERE userEmail = ?';
    queryParams.push(email);
    
    await connection.query(query, queryParams);
    await connection.commit();
    
    res.status(200).json({
      success: true,
      message: 'User updated successfully'
    });
  } catch (error) {
    await connection.rollback();
    console.error('Error updating user:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update user',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  } finally {
    connection.release();
  }
});

// Delete a user
router.delete('/users/:email', authenticateAdmin, async (req: AuthenticatedRequest, res: Response) => {
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();
    
    const { email } = req.params;
    
    // Check if user exists
    const [existingUsers]: any = await connection.query(
      'SELECT userEmail FROM Users WHERE userEmail = ?',
      [email]
    );
    
    if (existingUsers.length === 0) {
      connection.release();
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Delete the user (will cascade to entries and other related tables)
    await connection.query('DELETE FROM Users WHERE userEmail = ?', [email]);
    
    await connection.commit();
    
    res.status(200).json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    await connection.rollback();
    console.error('Error deleting user:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete user',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  } finally {
    connection.release();
  }
});

// =============== ENTRIES ROUTES ===============

// Get all entries
router.get('/entries', authenticateAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { search, region, category, noMods } = req.query;
    
    let query = `
      SELECT e.entryID, e.userEmail, e.carName, e.carColor, e.carMake, e.carModel, 
             e.carYear, e.totalCost, e.upvotes, e.category, e.region
      FROM Entries e
      WHERE 1=1
    `;
    
    const queryParams: any[] = [];
    
    // Add search filter if provided
    if (search) {
      query += ` AND (e.userEmail LIKE ? OR e.carName LIKE ? OR e.carMake LIKE ? OR e.carModel LIKE ?)`;
      queryParams.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
    }
    
    // Add region filter if provided
    if (region && region !== 'false') {
      query += ` AND e.region = ?`;
      queryParams.push(region);
    }
    
    // Add category filter if provided
    if (category && category !== 'false') {
      query += ` AND e.category = ?`;
      queryParams.push(category);
    }
    
    // Add no mods filter if provided
    if (noMods && noMods !== 'false') {
      query += ` AND e.totalMods = 0`;
    }
    
    // Order by newest first
    query += ` ORDER BY e.createdAt DESC`;
    
    const [entries]: any = await pool.query(query, queryParams);
    
    res.status(200).json({
      success: true,
      entries
    });
  } catch (error) {
    console.error('Error fetching entries:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch entries',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get a specific entry
router.get('/entries/:id', authenticateAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    
    // Get entry with photos in a single query
    const [results]: any = await pool.query(`
      SELECT 
        e.entryID, e.userEmail, e.carName, e.carMake, e.carModel, e.carYear, 
        e.carColor, e.description, e.totalMods, e.totalCost, e.category,
        e.region, e.upvotes, e.engine, e.transmission, e.drivetrain,
        e.horsepower, e.torque, e.viewCount, e.createdAt, e.updatedAt,
        p.s3Key as mainPhotoKey,
        GROUP_CONCAT(DISTINCT ap.photoID) as photoIDs,
        GROUP_CONCAT(DISTINCT ap.s3Key) as allPhotoKeys,
        GROUP_CONCAT(DISTINCT ap.isMainPhoto) as photoMainFlags,
        GROUP_CONCAT(DISTINCT t.tagName) as tags
      FROM Entries e
      LEFT JOIN EntryPhotos p ON e.entryID = p.entryID AND p.isMainPhoto = TRUE
      LEFT JOIN EntryPhotos ap ON e.entryID = ap.entryID
      LEFT JOIN EntryTags et ON e.entryID = et.entryID
      LEFT JOIN Tags t ON et.tagID = t.tagID
      WHERE e.entryID = ?
      GROUP BY e.entryID
    `, [id]);
    
    if (results.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Entry not found'
      });
    }
    
    const entry = results[0];
    
    // Process photo data
    if (entry.photoIDs && entry.allPhotoKeys) {
      const photoIDs = entry.photoIDs.split(',');
      const photoKeys = entry.allPhotoKeys.split(',');
      const photoMainFlags = entry.photoMainFlags.split(',').map((flag: string) => flag === '1');
      
      entry.photos = photoIDs.map((id: string, index: number) => ({
        photoID: parseInt(id),
        s3Key: photoKeys[index],
        isMainPhoto: photoMainFlags[index]
      }));
      
      entry.allPhotoKeys = photoKeys;
    } else {
      entry.photos = [];
      entry.allPhotoKeys = [];
    }
    
    // Process tags
    entry.tags = entry.tags ? entry.tags.split(',') : [];
    
    // Get mods associated with this entry
    const [mods]: any = await pool.query(`
      SELECT m.modID, m.brand, m.category, m.cost, m.description, m.link
      FROM EntryMods em
      JOIN Mods m ON em.modID = m.modID
      WHERE em.entryID = ?
    `, [id]);
    
    entry.mods = mods || [];
    
    res.status(200).json({
      success: true,
      entry
    });
  } catch (error) {
    console.error('Error fetching entry details:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch entry details',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Create a new entry
router.post('/entries', authenticateAdmin, async (req: AuthenticatedRequest, res: Response) => {
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();
    
    const { 
      email, carName, carMake, carModel, carYear, carColor, description,
      totalCost, category, region, engine, transmission, 
      drivetrain, horsepower, torque, photos, tags, mods
    } = req.body;
    
    // Validate required fields
    if (!email || !carName || !carMake || !carModel || !category || !region) {
      connection.release();
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }
    
    // Verify user exists
    const [users]: any = await connection.query(
      'SELECT userEmail FROM Users WHERE userEmail = ?',
      [email]
    );
    
    if (users.length === 0) {
      connection.release();
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Calculate total mods count
    const totalMods = mods && Array.isArray(mods) ? mods.length : 0;
    
    // Insert the new entry
    const [result]: any = await connection.query(
      `INSERT INTO Entries 
       (userEmail, carName, carMake, carModel, carYear, carColor, description,
        totalMods, totalCost, category, region, engine, transmission, drivetrain,
        horsepower, torque)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        email, carName, carMake, carModel, carYear || null, carColor || null,
        description || null, totalMods, totalCost || 0, category, region,
        engine || null, transmission || null, drivetrain || null,
        horsepower || null, torque || null
      ]
    );
    
    const entryID = result.insertId;
    
    // Add photos if provided
    if (photos && Array.isArray(photos) && photos.length > 0) {
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
    
    // Add mods if provided
    if (mods && Array.isArray(mods) && mods.length > 0) {
      const modValues = mods.map((modId: number) => [entryID, modId]);
      
      await connection.query(
        'INSERT INTO EntryMods (entryID, modID) VALUES ?',
        [modValues]
      );
    }
    
    // Add tags if provided
    if (tags && Array.isArray(tags) && tags.length > 0) {
      // Process each tag
      for (const tagName of tags) {
        // Check if tag already exists
        const [existingTags]: any = await connection.query(
          'SELECT tagID FROM Tags WHERE tagName = ?',
          [tagName]
        );
        
        let tagID;
        
        if (existingTags.length > 0) {
          tagID = existingTags[0].tagID;
        } else {
          // Create new tag
          const [tagResult]: any = await connection.query(
            'INSERT INTO Tags (tagName) VALUES (?)',
            [tagName]
          );
          
          tagID = tagResult.insertId;
        }
        
        // Link tag to entry
        await connection.query(
          'INSERT INTO EntryTags (entryID, tagID) VALUES (?, ?)',
          [entryID, tagID]
        );
      }
    }
    
    // Update user's totalEntries count
    await connection.query(
      'UPDATE Users SET totalEntries = totalEntries + 1 WHERE userEmail = ?',
      [email]
    );
    
    await connection.commit();
    
    res.status(201).json({
      success: true,
      message: 'Entry created successfully',
      entryID
    });
  } catch (error) {
    await connection.rollback();
    console.error('Error creating entry:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create entry',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  } finally {
    connection.release();
  }
});

// Update an existing entry
router.put('/entries/:id', authenticateAdmin, async (req: AuthenticatedRequest, res: Response) => {
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();
    
    const { id } = req.params;
    const { 
      email, carName, carMake, carModel, carYear, carColor, description,
      totalCost, category, region, engine, transmission, 
      drivetrain, horsepower, torque, photos, tags, mods
    } = req.body;
    
    // Check if entry exists
    const [existingEntries]: any = await connection.query(
      'SELECT entryID, userEmail FROM Entries WHERE entryID = ?',
      [id]
    );
    
    if (existingEntries.length === 0) {
      connection.release();
      return res.status(404).json({
        success: false,
        message: 'Entry not found'
      });
    }
    
    const originalEmail = existingEntries[0].userEmail;
    const emailChanged = email && email !== originalEmail;
    
    // If email is changing, verify the new user exists
    if (emailChanged) {
      const [users]: any = await connection.query(
        'SELECT userEmail FROM Users WHERE userEmail = ?',
        [email]
      );
      
      if (users.length === 0) {
        connection.release();
        return res.status(404).json({
          success: false,
          message: 'New user not found'
        });
      }
    }
    
    // Calculate total mods count
    const totalMods = mods && Array.isArray(mods) ? mods.length : 0;
    
    // Update the entry
    await connection.query(
      `UPDATE Entries 
       SET userEmail = ?, carName = ?, carMake = ?, carModel = ?, carYear = ?, 
           carColor = ?, description = ?, totalMods = ?, totalCost = ?, 
           category = ?, region = ?, engine = ?, transmission = ?, 
           drivetrain = ?, horsepower = ?, torque = ?
       WHERE entryID = ?`,
      [
        email || originalEmail, carName, carMake, carModel, carYear || null, 
        carColor || null, description || null, totalMods, totalCost || 0, 
        category, region, engine || null, transmission || null, 
        drivetrain || null, horsepower || null, torque || null, id
      ]
    );
    
    // Update photos if provided
    if (photos && Array.isArray(photos)) {
      // Delete existing photos
      await connection.query('DELETE FROM EntryPhotos WHERE entryID = ?', [id]);
      
      if (photos.length > 0) {
        const photoValues = photos.map((photo: any) => [
          id,
          photo.s3Key,
          photo.isMainPhoto || false
        ]);
        
        await connection.query(
          `INSERT INTO EntryPhotos (entryID, s3Key, isMainPhoto)
           VALUES ?`,
          [photoValues]
        );
      }
    }
    
    // Update mods if provided
    if (mods && Array.isArray(mods)) {
      // Delete existing mod associations
      await connection.query('DELETE FROM EntryMods WHERE entryID = ?', [id]);
      
      if (mods.length > 0) {
        const modValues = mods.map((modId: number) => [id, modId]);
        
        await connection.query(
          'INSERT INTO EntryMods (entryID, modID) VALUES ?',
          [modValues]
        );
      }
    }
    
    // Update tags if provided
    if (tags && Array.isArray(tags)) {
      // Delete existing tag associations
      await connection.query('DELETE FROM EntryTags WHERE entryID = ?', [id]);
      
      if (tags.length > 0) {
        // Process each tag
        for (const tagName of tags) {
          // Check if tag already exists
          const [existingTags]: any = await connection.query(
            'SELECT tagID FROM Tags WHERE tagName = ?',
            [tagName]
          );
          
          let tagID;
          
          if (existingTags.length > 0) {
            tagID = existingTags[0].tagID;
          } else {
            // Create new tag
            const [tagResult]: any = await connection.query(
              'INSERT INTO Tags (tagName) VALUES (?)',
              [tagName]
            );
            
            tagID = tagResult.insertId;
          }
          
          // Link tag to entry
          await connection.query(
            'INSERT INTO EntryTags (entryID, tagID) VALUES (?, ?)',
            [id, tagID]
          );
        }
      }
    }
    
    // If user email changed, update both users' totalEntries counts
    if (emailChanged) {
      await connection.query(
        'UPDATE Users SET totalEntries = totalEntries - 1 WHERE userEmail = ?',
        [originalEmail]
      );
      
      await connection.query(
        'UPDATE Users SET totalEntries = totalEntries + 1 WHERE userEmail = ?',
        [email]
      );
    }
    
    await connection.commit();
    
    res.status(200).json({
      success: true,
      message: 'Entry updated successfully'
    });
  } catch (error) {
    await connection.rollback();
    console.error('Error updating entry:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update entry',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  } finally {
    connection.release();
  }
});

// Delete an entry
router.delete('/entries/:id', authenticateAdmin, async (req: AuthenticatedRequest, res: Response) => {
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();
    
    const { id } = req.params;
    
    // Check if entry exists and get user email
    const [existingEntries]: any = await connection.query(
      'SELECT entryID, userEmail FROM Entries WHERE entryID = ?',
      [id]
    );
    
    if (existingEntries.length === 0) {
      connection.release();
      return res.status(404).json({
        success: false,
        message: 'Entry not found'
      });
    }
    
    const userEmail = existingEntries[0].userEmail;
    
    // Delete the entry (will cascade to photos, tags, and mods)
    await connection.query('DELETE FROM Entries WHERE entryID = ?', [id]);
    
    // Update user's totalEntries count
    await connection.query(
      'UPDATE Users SET totalEntries = GREATEST(totalEntries - 1, 0) WHERE userEmail = ?',
      [userEmail]
    );
    
    await connection.commit();
    
    res.status(200).json({
      success: true,
      message: 'Entry deleted successfully'
    });
  } catch (error) {
    await connection.rollback();
    console.error('Error deleting entry:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete entry',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  } finally {
    connection.release();
  }
});

// =============== MODS ROUTES ===============

// Get all mods
router.get('/mods', authenticateAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { search, category, brand, usedByEntry } = req.query;
    
    let query = `
      SELECT m.modID, m.brand, m.category, m.cost, m.description, m.link
      FROM Mods m
    `;
    
    const queryParams: any[] = [];
    
    // Add join if filtering by entry
    if (usedByEntry && usedByEntry !== 'false') {
      query = `
        SELECT m.modID, m.brand, m.category, m.cost, m.description, m.link, e.entryID
        FROM Mods m
        JOIN EntryMods em ON m.modID = em.modID
        JOIN Entries e ON em.entryID = e.entryID
      `;
    }
    
    query += ` WHERE 1=1`;
    
    // Add search filter if provided
    if (search) {
      query += ` AND (m.brand LIKE ? OR m.description LIKE ?)`;
      queryParams.push(`%${search}%`, `%${search}%`);
    }
    
    // Add category filter if provided
    if (category && category !== 'false') {
      query += ` AND m.category = ?`;
      queryParams.push(category);
    }
    
    // Add brand filter if provided
    if (brand && brand !== 'false') {
      query += ` AND m.brand = ?`;
      queryParams.push(brand);
    }
    
    // Add ordering
    query += ` ORDER BY m.brand, m.category`;
    
    const [mods]: any = await pool.query(query, queryParams);
    
    res.status(200).json({
      success: true,
      mods
    });
  } catch (error) {
    console.error('Error fetching mods:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch mods',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get a specific mod
router.get('/mods/:id', authenticateAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    
    const [mods]: any = await pool.query(
      `SELECT modID, brand, category, cost, description, link
       FROM Mods
       WHERE modID = ?`,
      [id]
    );
    
    if (mods.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Mod not found'
      });
    }
    
    // Get entries using this mod
    const [entries]: any = await pool.query(`
      SELECT e.entryID, e.carName, e.carMake, e.carModel
      FROM Entries e
      JOIN EntryMods em ON e.entryID = em.entryID
      WHERE em.modID = ?
    `, [id]);
    
    const mod = {
      ...mods[0],
      entries: entries || []
    };
    
    res.status(200).json({
      success: true,
      mod
    });
  } catch (error) {
    console.error('Error fetching mod details:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch mod details',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Create a new mod
router.post('/mods', authenticateAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { brand, category, cost, description, link } = req.body;

    if (!brand || !category || cost === undefined || !link) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: brand, category, cost, and link are required'
      });
    }

    await pool.query(
      `INSERT INTO Mods (brand, category, cost, description, link)
       VALUES (?, ?, ?, ?, ?)`,
      [brand, category, cost, description || '', link]
    );

    res.status(201).json({
      success: true,
      message: 'Mod created successfully'
    });
  } catch (error) {
    console.error('Error creating mod:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create mod',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

router.put('/mods/:id', authenticateAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { brand, category, cost, description, link } = req.body;

    if (!brand || !category || cost === undefined || !link) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: brand, category, cost, and link are required'
      });
    }

    const [existingMods]: any = await pool.query(
      'SELECT modID FROM Mods WHERE modID = ?',
      [id]
    );

    if (existingMods.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Mod not found'
      });
    }

    await pool.query(
      `UPDATE Mods 
       SET brand = ?, category = ?, cost = ?, description = ?, link = ?
       WHERE modID = ?`,
      [brand, category, cost, description || '', link, id]
    );

    res.status(200).json({
      success: true,
      message: 'Mod updated successfully'
    });
  } catch (error) {
    console.error('Error updating mod:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update mod',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});


// Delete a mod
router.delete('/mods/:id', authenticateAdmin, async (req: AuthenticatedRequest, res: Response) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const { id } = req.params;

    // Check if mod exists
    const [existingMods]: any = await connection.query(
      'SELECT modID FROM Mods WHERE modID = ?',
      [id]
    );

    if (existingMods.length === 0) {
      connection.release();
      return res.status(404).json({
        success: false,
        message: 'Mod not found'
      });
    }

    // Remove any entry-mod associations
    await connection.query('DELETE FROM EntryMods WHERE modID = ?', [id]);

    // Now delete the mod
    await connection.query('DELETE FROM Mods WHERE modID = ?', [id]);

    await connection.commit();

    res.status(200).json({
      success: true,
      message: 'Mod deleted successfully'
    });
  } catch (error) {
    await connection.rollback();
    console.error('Error deleting mod:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete mod',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  } finally {
    connection.release();
  }
});


router.get('/photos', authenticateAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { search, mainOnly } = req.query;

    let query = `
      SELECT photoID, entryID, s3Key, isMainPhoto, uploadDate
      FROM EntryPhotos
      WHERE 1=1
    `;
    const params: any[] = [];

    if (search) {
      query += ` AND s3Key LIKE ?`;
      params.push(`%${search}%`);
    }

    if (mainOnly && mainOnly !== 'false') {
      query += ` AND isMainPhoto = TRUE`;
    }

    query += ` ORDER BY uploadDate DESC`;

    const [photos]: any = await pool.query(query, params);

    res.status(200).json({ success: true, photos });
  } catch (error) {
    console.error("Error fetching photos:", error);
    res.status(500).json({ success: false, message: "Failed to fetch photos" });
  }
});

router.put('/photos/:id', authenticateAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { s3Key, isMainPhoto, uploadDate } = req.body;

    await pool.query(
      `UPDATE EntryPhotos
       SET s3Key = ?, isMainPhoto = ?, uploadDate = ?
       WHERE photoID = ?`,
      [s3Key, !!isMainPhoto, uploadDate, id]
    );

    res.status(200).json({ success: true, message: 'Photo updated successfully' });
  } catch (error) {
    console.error('Error updating photo:', error);
    res.status(500).json({ success: false, message: 'Failed to update photo' });
  }
});

router.delete('/photos/:id', authenticateAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;

    await pool.query('DELETE FROM EntryPhotos WHERE photoID = ?', [id]);

    res.status(200).json({ success: true, message: 'Photo deleted successfully' });
  } catch (error) {
    console.error('Error deleting photo:', error);
    res.status(500).json({ success: false, message: 'Failed to delete photo' });
  }
});



router.get('/tags', authenticateAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const [tags]: any = await pool.query(`
      SELECT t.tagID, t.tagName, COUNT(et.entryID) AS entryCount
      FROM Tags t
      LEFT JOIN EntryTags et ON t.tagID = et.tagID
      GROUP BY t.tagID
      ORDER BY t.tagName ASC
    `);

    res.status(200).json({ success: true, tags });
  } catch (error) {
    console.error("Error fetching tags:", error);
    res.status(500).json({ success: false, message: "Failed to fetch tags" });
  }
});

router.put('/tags/:id', authenticateAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { tagName } = req.body;

    await pool.query(
      `UPDATE Tags SET tagName = ? WHERE tagID = ?`,
      [tagName, id]
    );

    res.status(200).json({ success: true, message: 'Tag updated successfully' });
  } catch (error) {
    console.error('Error updating tag:', error);
    res.status(500).json({ success: false, message: 'Failed to update tag' });
  }
});

router.delete('/tags/:id', authenticateAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;

    await pool.query('DELETE FROM Tags WHERE tagID = ?', [id]);

    res.status(200).json({ success: true, message: 'Tag deleted successfully' });
  } catch (error) {
    console.error('Error deleting tag:', error);
    res.status(500).json({ success: false, message: 'Failed to delete tag' });
  }
});



router.get('/awards', authenticateAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { search, type, user } = req.query;

    let query = `
      SELECT awardID, userEmail, awardType, awardDate
      FROM Awards
      WHERE 1=1
    `;
    const params: any[] = [];

    if (search) {
      query += ` AND (userEmail LIKE ? OR awardType LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`);
    }

    if (type && type !== 'false') {
      query += ` AND awardType = ?`;
      params.push(type);
    }

    if (user && user !== 'false') {
      query += ` AND userEmail = ?`;
      params.push(user);
    }

    query += ` ORDER BY awardDate DESC`;

    const [awards]: any = await pool.query(query, params);

    res.status(200).json({ success: true, awards });
  } catch (error) {
    console.error("Error fetching awards:", error);
    res.status(500).json({ success: false, message: "Failed to fetch awards" });
  }
});

router.put('/awards/:id', authenticateAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { userEmail, awardType, awardDate } = req.body;

    await pool.query(
      `UPDATE Awards
       SET userEmail = ?, awardType = ?, awardDate = ?
       WHERE awardID = ?`,
      [userEmail, awardType, awardDate, id]
    );

    res.status(200).json({ success: true, message: 'Award updated successfully' });
  } catch (error) {
    console.error('Error updating award:', error);
    res.status(500).json({ success: false, message: 'Failed to update award' });
  }
});

router.delete('/awards/:id', authenticateAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;

    await pool.query('DELETE FROM Awards WHERE awardID = ?', [id]);

    res.status(200).json({ success: true, message: 'Award deleted successfully' });
  } catch (error) {
    console.error('Error deleting award:', error);
    res.status(500).json({ success: false, message: 'Failed to delete award' });
  }
});






export default router;
