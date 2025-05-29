import { Router, Request, Response } from 'express';
import { config } from 'dotenv';
import jwt from 'jsonwebtoken';
import { pool } from '../dbconfig';

// Extend Express Request interface to include 'user'
declare global {
  namespace Express {
    interface Request {
      user?: any;
    }
  }
}

config();
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

const router = Router();

// Middleware to verify JWT token (optional for explore route)
const authenticateToken = (req: Request, res: Response, next: any) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    // For explore route, we can allow anonymous access
    req.user = null;
    return next();
  }

  jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
    if (err) {
      req.user = null;
    } else {
      req.user = user;
    }
    next();
  });
};

// POST /explore/cars - Fetch cars for exploration
router.post('/cars', authenticateToken, async (req: Request, res: Response) => {
  try {
    console.log('[EXPLORE] Received explore request');
    
    const { swipedCars = [], likedCars = [], limit = 10, region = null, category = null } = req.body;
    
    // Validate limit
    const safeLimit = Math.min(Math.max(parseInt(limit) || 10, 1), 50);
    
    let query = `
      SELECT 
        e.entryID,
        e.userEmail as userID,
        e.carName,
        e.carMake,
        e.carModel,
        e.carYear,
        e.carColor,
        e.carTrim,
        e.description,
        e.totalMods,
        e.totalCost,
        e.category,
        e.region,
        e.upvotes,
        e.engine,
        e.transmission,
        e.drivetrain,
        e.horsepower,
        e.torque,
        e.viewCount,
        e.createdAt,
        ep.s3Key as s3ContentID,
        u.name as userName,
        GROUP_CONCAT(DISTINCT t.tagName ORDER BY t.tagName ASC) as tags
      FROM Entries e
      INNER JOIN Users u ON e.userEmail = u.userEmail
      LEFT JOIN EntryPhotos ep ON e.entryID = ep.entryID AND ep.isMainPhoto = TRUE
      LEFT JOIN EntryTags et ON e.entryID = et.entryID
      LEFT JOIN Tags t ON et.tagID = t.tagID
      WHERE u.isVerified = TRUE
    `;
    
    const queryParams: any[] = [];
    
    // Exclude already swiped cars
    if (swipedCars.length > 0) {
      const placeholders = swipedCars.map(() => '?').join(',');
      query += ` AND e.entryID NOT IN (${placeholders})`;
      queryParams.push(...swipedCars);
    }
    
    // Filter by region if specified
    if (region && region !== 'all') {
      query += ` AND e.region = ?`;
      queryParams.push(region);
    }
    
    // Filter by category if specified
    if (category && category !== 'all') {
      query += ` AND e.category = ?`;
      queryParams.push(category);
    }
    
    // Exclude user's own entries if authenticated
    if (req.user && req.user.userEmail) {
      query += ` AND e.userEmail != ?`;
      queryParams.push(req.user.userEmail);
    }
    
    // Group by entry to handle the LEFT JOINs properly
    query += ` GROUP BY e.entryID`;
    
    // Add random ordering and limit
    query += ` ORDER BY RAND() LIMIT ?`;
    queryParams.push(safeLimit);
    
    console.log('[EXPLORE] Executing query with params:', { 
      swipedCount: swipedCars.length, 
      region, 
      category,
      limit: safeLimit,
      userEmail: req.user?.userEmail || 'anonymous'
    });
    
    const [cars]: any = await pool.query(query, queryParams);
    
    // Process the results to parse tags
    const processedCars = cars.map((car: any) => ({
      ...car,
      tags: car.tags ? car.tags.split(',') : []
    }));
    
    console.log('[EXPLORE] Found cars:', processedCars.length);
    
    res.status(200).json({
      success: true,
      message: 'Cars fetched successfully',
      data: processedCars,
      count: processedCars.length
    });
    
  } catch (error) {
    console.error('[EXPLORE] Server error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during car fetch',
      errorCode: 'SERVER_ERROR'
    });
  }
});

// POST /explore/like - Like a car
router.post('/like', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { carId } = req.body;
    
    if (!carId) {
      return res.status(400).json({
        success: false,
        message: 'Car ID is required',
        errorCode: 'MISSING_CAR_ID'
      });
    }
    
    if (!req.user || !req.user.userEmail) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required to like cars',
        errorCode: 'AUTH_REQUIRED'
      });
    }
    
    console.log('[EXPLORE] Processing like for car:', carId, 'by user:', req.user.userEmail);
    
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();
      
      // Check if car exists
      const [cars]: any = await connection.query(
        'SELECT entryID, userEmail, upvotes FROM Entries WHERE entryID = ?',
        [carId]
      );
      
      if (cars.length === 0) {
        await connection.rollback();
        connection.release();
        return res.status(404).json({
          success: false,
          message: 'Car not found',
          errorCode: 'CAR_NOT_FOUND'
        });
      }
      
      const car = cars[0];
      
      // Prevent self-liking
      if (car.userEmail === req.user.userEmail) {
        await connection.rollback();
        connection.release();
        return res.status(400).json({
          success: false,
          message: 'Cannot like your own car',
          errorCode: 'SELF_LIKE_FORBIDDEN'
        });
      }
      
      // Check if already liked (optional: implement likes tracking table)
      // For now, we'll just increment the upvotes
      
      // Increment upvotes
      await connection.query(
        'UPDATE Entries SET upvotes = upvotes + 1 WHERE entryID = ?',
        [carId]
      );
      
      // Optional: Track the like in a separate table
      // await connection.query(
      //   'INSERT IGNORE INTO Likes (userEmail, entryID, likedAt) VALUES (?, ?, NOW())',
      //   [req.user.userEmail, carId]
      // );
      
      await connection.commit();
      connection.release();
      
      console.log('[EXPLORE] Like processed successfully');
      
      res.status(200).json({
        success: true,
        message: 'Car liked successfully',
        newUpvotes: car.upvotes + 1
      });
      
    } catch (error) {
      await connection.rollback();
      connection.release();
      throw error;
    }
    
  } catch (error) {
    console.error('[EXPLORE] Like error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during like operation',
      errorCode: 'SERVER_ERROR'
    });
  }
});

// POST /explore/report - Report a car (optional)
router.post('/report', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { carId, reason } = req.body;
    
    if (!carId || !reason) {
      return res.status(400).json({
        success: false,
        message: 'Car ID and reason are required',
        errorCode: 'MISSING_FIELDS'
      });
    }
    
    if (!req.user || !req.user.userEmail) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required to report cars',
        errorCode: 'AUTH_REQUIRED'
      });
    }
    
    console.log('[EXPLORE] Processing report for car:', carId, 'by user:', req.user.userEmail);
    
    // Check if car exists
    const [cars]: any = await pool.query(
      'SELECT entryID FROM Entries WHERE entryID = ?',
      [carId]
    );
    
    if (cars.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Car not found',
        errorCode: 'CAR_NOT_FOUND'
      });
    }
    
    // Insert report (you'll need to create a Reports table)
    // await pool.query(
    //   'INSERT INTO Reports (reporterEmail, entryID, reason, reportedAt) VALUES (?, ?, ?, NOW())',
    //   [req.user.userEmail, carId, reason]
    // );
    
    console.log('[EXPLORE] Report processed successfully');
    
    res.status(200).json({
      success: true,
      message: 'Report submitted successfully'
    });
    
  } catch (error) {
    console.error('[EXPLORE] Report error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during report submission',
      errorCode: 'SERVER_ERROR'
    });
  }
});

// GET /explore/stats - Get exploration statistics (optional)
router.get('/stats', async (req: Request, res: Response) => {
  try {
    console.log('[EXPLORE] Fetching stats');
    
    const [stats]: any = await pool.query(`
      SELECT 
        COUNT(*) as totalCars,
        COUNT(DISTINCT e.userEmail) as totalUsers,
        AVG(e.upvotes) as avgUpvotes,
        COUNT(DISTINCT e.region) as totalRegions,
        COUNT(DISTINCT e.category) as totalCategories,
        AVG(e.viewCount) as avgViews,
        SUM(e.totalMods) as totalMods,
        AVG(e.totalCost) as avgCost
      FROM Entries e
      INNER JOIN Users u ON e.userEmail = u.userEmail
      WHERE u.isVerified = TRUE
    `);
    
    const [regionStats]: any = await pool.query(`
      SELECT 
        e.region,
        COUNT(*) as count
      FROM Entries e
      INNER JOIN Users u ON e.userEmail = u.userEmail
      WHERE u.isVerified = TRUE
      GROUP BY e.region
      ORDER BY count DESC
    `);
    
    const [categoryStats]: any = await pool.query(`
      SELECT 
        e.category,
        COUNT(*) as count,
        AVG(e.upvotes) as avgUpvotes
      FROM Entries e
      INNER JOIN Users u ON e.userEmail = u.userEmail
      WHERE u.isVerified = TRUE
      GROUP BY e.category
      ORDER BY count DESC
    `);
    
    const [popularTags]: any = await pool.query(`
      SELECT 
        t.tagName,
        COUNT(*) as count
      FROM Tags t
      INNER JOIN EntryTags et ON t.tagID = et.tagID
      INNER JOIN Entries e ON et.entryID = e.entryID
      INNER JOIN Users u ON e.userEmail = u.userEmail
      WHERE u.isVerified = TRUE
      GROUP BY t.tagID, t.tagName
      ORDER BY count DESC
      LIMIT 20
    `);
    
    res.status(200).json({
      success: true,
      message: 'Stats fetched successfully',
      data: {
        overview: stats[0],
        regionBreakdown: regionStats,
        categoryBreakdown: categoryStats,
        popularTags: popularTags
      }
    });
    
  } catch (error) {
    console.error('[EXPLORE] Stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during stats fetch',
      errorCode: 'SERVER_ERROR'
    });
  }
});

export default router;