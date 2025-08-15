import { Router, Request, Response } from 'express';
import { config } from 'dotenv';
import jwt from 'jsonwebtoken';
import { pool } from '../dbconfig';

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

const authenticateToken = (req: Request, res: Response, next: any) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
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

router.post('/cars', authenticateToken, async (req: Request, res: Response) => {
  console.log('[EXPLORE] Route hit - starting execution');
  console.log('[EXPLORE] Request body:', JSON.stringify(req.body, null, 2));
  console.log('[EXPLORE] Request user:', req.user);
  
  try {
    //Did rand calculation outside of query as that is very expensive especailly with
    //querying multiple tables and doing group concatenations
    
    //also split queries up so they happen un nested within each other, so we get closer to linear time
    
    interface CarData {
      entryID: number;
      userID: string;
      carName: string;
      carMake: string;
      carModel: string;
      carYear: string;
      carColor: string;
      basecost: number;
      carTrim: string;
      description: string;
      totalMods: number;
      totalCost: number;
      category: string;
      region: string;
      upvotes: number;
      commentCount: number;
      engine: string;
      transmission: string;
      drivetrain: string;
      horsepower: number;
      torque: number;
      viewCount: number;
      createdAt: Date;
      userName: string;
      profilephotokey: string;
    }

    interface PhotoData {
      entryID: number;
      allPhotoKeys: string;
      mainPhotoKey: string;
    }

    interface TagData {
      entryID: number;
      tags: string;
    }
    
    interface ModData {
        entryID: number;
        mods: string; 
    }
    
    //we filter out all entries, that aren't liked or swiped, then we apply the random offset whcihc means when we query we skip a random amount from the unfiltered for more "randomness in a sense"
    
    const { swipedCars = [], likedCars = [], limit = 10, region = null, category = null } = req.body;
    
    console.log('[EXPLORE] Extracted parameters:', {
      swipedCars: swipedCars.length,
      likedCars: likedCars.length,
      limit,
      region,
      category
    });
    
    let baseQuery = `
      SELECT 
        e.entryID, e.userEmail as userID, e.carName, e.carMake, e.carModel,
        e.carYear, e.carColor, e.basecost, e.carTrim, e.description, e.totalMods, e.totalCost,
        e.category, e.region, e.upvotes, e.commentCount, e.engine, e.transmission,
        e.drivetrain, e.horsepower, e.torque, e.viewCount, e.createdAt,
        u.name as userName, u.profilephotokey
      FROM Entries e
      INNER JOIN Users u ON e.userEmail = u.userEmail
      WHERE u.isVerified = TRUE
    `;
    
    const queryParams: any[] = [];
    
    if (swipedCars.length > 0) {
      const placeholders = swipedCars.map(() => '?').join(',');
      baseQuery += ` AND e.entryID NOT IN (${placeholders})`;
      queryParams.push(...swipedCars);
      console.log('[EXPLORE] Added swiped cars filter, excluded IDs:', swipedCars);
    }
    
    if (likedCars.length > 0) {
      const likedPlaceholders = likedCars.map(() => '?').join(',');
      baseQuery += ` AND e.entryID NOT IN (${likedPlaceholders})`;
      queryParams.push(...likedCars);
      console.log('[EXPLORE] Added liked cars filter, excluded IDs:', likedCars);
    }
    
    if (region && region !== 'all') {
      baseQuery += ` AND e.region = ?`;
      queryParams.push(region);
      console.log('[EXPLORE] Added region filter:', region);
    }
    
    if (category && category !== 'all') {
      baseQuery += ` AND e.category = ?`;
      queryParams.push(category);
      console.log('[EXPLORE] Added category filter:', category);
    }
    
    if (req.user && req.user.userEmail) {
      baseQuery += ` AND e.userEmail != ?`;
      queryParams.push(req.user.userEmail);
      console.log('[EXPLORE] Excluded current user:', req.user.userEmail);
    }
    
    console.log('[EXPLORE] Base query built:', baseQuery);
    console.log('[EXPLORE] Query params before count:', queryParams);
    
    // Build count query properly by reconstructing it
    let countQuery = `
      SELECT COUNT(*) as total
      FROM Entries e
      INNER JOIN Users u ON e.userEmail = u.userEmail
      WHERE u.isVerified = TRUE
    `;
    
    // Add the same filters as the main query
    if (swipedCars.length > 0) {
      const placeholders = swipedCars.map(() => '?').join(',');
      countQuery += ` AND e.entryID NOT IN (${placeholders})`;
    }
    
    if (likedCars.length > 0) {
      const likedPlaceholders = likedCars.map(() => '?').join(',');
      countQuery += ` AND e.entryID NOT IN (${likedPlaceholders})`;
    }
    
    if (region && region !== 'all') {
      countQuery += ` AND e.region = ?`;
    }
    
    if (category && category !== 'all') {
      countQuery += ` AND e.category = ?`;
    }
    
    if (req.user && req.user.userEmail) {
      countQuery += ` AND e.userEmail != ?`;
    }
    
    console.log('[EXPLORE] Count query:', countQuery);
    console.log('[EXPLORE] About to execute count query...');
    
    const [countResult]: any = await pool.query(countQuery, queryParams);
    console.log('[EXPLORE] Count query result:', countResult);
    
    const totalCount = Number(countResult[0]?.total) || 0;
    const safeLimit = Number(Math.min(Math.max(parseInt(limit) || 10, 1), 50));

    console.log('[EXPLORE] Total count:', totalCount);
    console.log('[EXPLORE] Safe limit:', safeLimit);

    if (isNaN(totalCount) || isNaN(safeLimit)) {
      console.error('[EXPLORE] Type conversion failed:', { totalCount, safeLimit });
      return res.status(500).json({
          success: false,
          message: 'Server error during parameter validation',
          errorCode: 'PARAMETER_ERROR'
      });
    }
    
    if (totalCount === 0) {
      console.log('[EXPLORE] No cars found in database with current filters');
      return res.status(200).json({
        success: true,
        message: 'No cars found',
        data: [],
        count: 0
      });
    }
    
    const maxOffset = Math.max(0, totalCount - safeLimit);
    const randomOffset = Math.floor(Math.random() * (maxOffset + 1));

    console.log('[EXPLORE] Pagination calculated:', {
      maxOffset,
      randomOffset,
      totalCount,
      safeLimit
    });

    const mainQueryParams = [...queryParams, safeLimit, randomOffset];

    baseQuery += ` ORDER BY e.entryID LIMIT ? OFFSET ?`;

    console.log('[EXPLORE] Final query:', baseQuery);
    console.log('[EXPLORE] Main query params:', mainQueryParams);
    console.log('[EXPLORE] About to execute main query...');

    const [cars]: any = await pool.query(baseQuery, mainQueryParams);
    
    console.log('[EXPLORE] Main query executed, result count:', cars.length);
    console.log('[EXPLORE] First car (if any):', cars[0] || 'No cars returned');
    
    if (cars.length === 0) {
      console.log('[EXPLORE] Main query returned no cars');
      return res.status(200).json({
        success: true,
        message: 'No cars found',
        data: [],
        count: 0
      });
    }
    
    const entryIds = cars.map((car: any) => car.entryID);
    console.log('[EXPLORE] Entry IDs for photo/tag queries:', entryIds);

    const photoPlaceholders = entryIds.map(() => '?').join(',');
    
    console.log('[EXPLORE] About to fetch photos...');
    const [photos]: any = await pool.query(`
      SELECT 
        entryID,
        GROUP_CONCAT(s3key ORDER BY s3key ASC) as allPhotoKeys,
        MAX(CASE WHEN isMainPhoto = TRUE THEN s3key END) as mainPhotoKey
      FROM EntryPhotos 
      WHERE entryID IN (${photoPlaceholders})
      GROUP BY entryID
    `, entryIds);
    
    console.log('[EXPLORE] Photos fetched, count:', photos.length);
    console.log('[EXPLORE] Sample photo data:', photos[0] || 'No photos');
    
    console.log('[EXPLORE] About to fetch tags...');
    const [tags]: any = await pool.query(`
      SELECT 
        et.entryID,
        GROUP_CONCAT(t.tagName ORDER BY t.tagName ASC) as tags
      FROM EntryTags et
      INNER JOIN Tags t ON et.tagID = t.tagID
      WHERE et.entryID IN (${photoPlaceholders})
      GROUP BY et.entryID
    `, entryIds);
    
    console.log('[EXPLORE] Tags fetched, count:', tags.length);
    console.log('[EXPLORE] Sample tag data:', tags[0] || 'No tags');
    
    console.log('[EXPLORE] About to fetch mods...');
    const [mods]: any = await pool.query(`
    SELECT 
        em.entryID,
        m.modID,
        m.brand,
        m.category,
        m.cost,
        m.description,
        m.link,
        m.isCustom,
        m.type,
        m.partNumber
    FROM EntryMods em
    INNER JOIN Mods m ON em.modID = m.modID
    WHERE em.entryID IN (${photoPlaceholders})
    ORDER BY em.entryID, m.brand, m.category
    `, entryIds);

    console.log('[EXPLORE] Mods fetched, count:', mods.length);
    console.log('[EXPLORE] Sample mod data:', mods[0] || 'No mods');

    
    const photoMap = new Map<number, PhotoData>(
      photos.map((p: any) => [p.entryID, p])
    );
    const tagMap = new Map<number, TagData>(
      tags.map((t: any) => [t.entryID, t])
    );
    
    const modMap = new Map<number, any[]>();
    mods.forEach((mod: any) => {
    if (!modMap.has(mod.entryID)) {
        modMap.set(mod.entryID, []);
    }
    modMap.get(mod.entryID)!.push({
        modID: mod.modID,
        brand: mod.brand,
        category: mod.category,
        cost: mod.cost,
        description: mod.description,
        link: mod.link,
        isCustom: !!mod.isCustom,
        type: mod.type,
        partNumber: mod.partNumber
    });
    });

    console.log('[EXPLORE] Maps created - photoMap size:', photoMap.size, 'tagMap size:', tagMap.size);

    const processedCars = cars.map((car: CarData) => {
    const photoData = photoMap.get(car.entryID);
    const tagData = tagMap.get(car.entryID);
    const modData = modMap.get(car.entryID);

    return {
        ...car,
        allPhotoKeys: photoData?.allPhotoKeys ? photoData.allPhotoKeys.split(',') : [],
        mainPhotoKey: photoData?.mainPhotoKey || null,
        tags: tagData?.tags ? tagData.tags.split(',') : [],
        mods: modData || []
    };
    });
    
    
    
    console.log('[EXPLORE] Cars processed, final count:', processedCars.length);
    console.log('[EXPLORE] Sample processed car:', processedCars[0] || 'No processed cars');
    console.log('[EXPLORE] About to send response...');
    
    res.status(200).json({
      success: true,
      message: 'Cars fetched successfully',
      data: processedCars,
      count: processedCars.length
    });
    
    console.log('[EXPLORE] Response sent successfully');
    
  } catch (error) {
    console.error('[EXPLORE] Server error occurred:', error);
    console.error('[EXPLORE] Error stack:', error instanceof Error ? error.stack : 'No stack trace available');
    res.status(500).json({
      success: false,
      message: 'Server error during car fetch',
      errorCode: 'SERVER_ERROR'
    });
  }
});


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
      
      const [cars]: any = await connection.query(
        'SELECT entryID, userEmail, upvotes FROM Entries WHERE entryID = ?',
        [carId]
      );
      
      if (cars.length === 0) {
        //rollback undoes all changes, good for error handling
        await connection.rollback();
        connection.release();
        return res.status(404).json({
          success: false,
          message: 'Car not found',
          errorCode: 'CAR_NOT_FOUND'
        });
      }
      
      const car = cars[0];
      
      if (car.userEmail === req.user.userEmail) {
        await connection.rollback();
        connection.release();
        return res.status(400).json({
          success: false,
          message: 'Cannot like your own car please pass',
          errorCode: 'SELF_LIKE_FORBIDDEN'
        });
      }
      
      
      await connection.query(
        'UPDATE Entries SET upvotes = upvotes + 1 WHERE entryID = ?',
        [carId]
      );
      
     
      //must use commit for update and insert queries, and release for connection.query
      //if using pool no need to do this as pool handles the operation automatically
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


router.get('/getcomments/:entryID', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { entryID } = req.params;
    const { page = 1, limit = 20 } = req.query;
    
    if (!entryID) {
      return res.status(400).json({
        success: false,
        message: 'Entry ID is required',
        errorCode: 'MISSING_ENTRY_ID'
      });
    }

    console.log('[COMMENTS] Fetching comments for entry:', entryID);

    const safeLimit = Math.min(Math.max(parseInt(limit as string) || 20, 1), 100);
    const safeOffset = (Math.max(parseInt(page as string) || 1, 1) - 1) * safeLimit;

    // Verify entry exists
    const [entries]: any = await pool.query(
      'SELECT entryID FROM Entries WHERE entryID = ?',
      [entryID]
    );

    if (entries.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Entry not found',
        errorCode: 'ENTRY_NOT_FOUND'
      });
    }

    const [topLevelComments]: any = await pool.query(`
      SELECT 
        c.commentID,
        c.entryID,
        c.userEmail,
        c.commentText,
        c.parentCommentID,
        c.createdAt,
        c.updatedAt,
        c.isDeleted,
        u.name as userName,
        COUNT(replies.commentID) as replyCount
      FROM Comments c
      INNER JOIN Users u ON c.userEmail = u.userEmail
      LEFT JOIN Comments replies ON c.commentID = replies.parentCommentID AND replies.isDeleted = FALSE
      WHERE c.entryID = ? AND c.parentCommentID IS NULL AND c.isDeleted = FALSE
      GROUP BY c.commentID
      ORDER BY c.createdAt DESC
      LIMIT ? OFFSET ?
    `, [entryID, safeLimit, safeOffset]);

    const commentsWithReplies = await Promise.all(
      topLevelComments.map(async (comment: any) => {
        const [replies]: any = await pool.query(`
          SELECT 
            c.commentID,
            c.entryID,
            c.userEmail,
            c.commentText,
            c.parentCommentID,
            c.createdAt,
            c.updatedAt,
            c.isDeleted,
            u.name as userName
          FROM Comments c
          INNER JOIN Users u ON c.userEmail = u.userEmail
          WHERE c.parentCommentID = ? AND c.isDeleted = FALSE
          ORDER BY c.createdAt ASC
          LIMIT 5
        `, [comment.commentID]);

        return {
          ...comment,
          replies: replies,
          hasMoreReplies: replies.length === 5 && comment.replyCount > 5
        };
      })
    );

    const [totalCount]: any = await pool.query(
      'SELECT COUNT(*) as total FROM Comments WHERE entryID = ? AND parentCommentID IS NULL AND isDeleted = FALSE',
      [entryID]
    );

    res.status(200).json({
      success: true,
      message: 'Comments fetched successfully',
      data: {
        comments: commentsWithReplies,
        pagination: {
          currentPage: parseInt(page as string) || 1,
          totalPages: Math.ceil(totalCount[0].total / safeLimit),
          totalComments: totalCount[0].total,
          hasMore: safeOffset + commentsWithReplies.length < totalCount[0].total
        }
      }
    });

  } catch (error) {
    console.error('[COMMENTS] Fetch error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during comment fetch',
      errorCode: 'SERVER_ERROR'
    });
  }
});

// GET /explore/comments/:commentID/replies - Get replies to a specific comment
router.get('/comments/:commentID/replies', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { commentID } = req.params;
    const { page = 1, limit = 10 } = req.query;

    if (!commentID) {
      return res.status(400).json({
        success: false,
        message: 'Comment ID is required',
        errorCode: 'MISSING_COMMENT_ID'
      });
    }

    console.log('[COMMENTS] Fetching replies for comment:', commentID);

    const safeLimit = Math.min(Math.max(parseInt(limit as string) || 10, 1), 50);
    const safeOffset = (Math.max(parseInt(page as string) || 1, 1) - 1) * safeLimit;

    // Verify parent comment exists
    const [parentComment]: any = await pool.query(
      'SELECT commentID FROM Comments WHERE commentID = ? AND isDeleted = FALSE',
      [commentID]
    );

    if (parentComment.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Parent comment not found',
        errorCode: 'COMMENT_NOT_FOUND'
      });
    }

    // Get replies
    const [replies]: any = await pool.query(`
      SELECT 
        c.commentID,
        c.entryID,
        c.userEmail,
        c.commentText,
        c.parentCommentID,
        c.createdAt,
        c.updatedAt,
        u.name as userName
      FROM Comments c
      INNER JOIN Users u ON c.userEmail = u.userEmail
      WHERE c.parentCommentID = ? AND c.isDeleted = FALSE
      ORDER BY c.createdAt ASC
      LIMIT ? OFFSET ?
    `, [commentID, safeLimit, safeOffset]);

    // Get total reply count
    const [totalCount]: any = await pool.query(
      'SELECT COUNT(*) as total FROM Comments WHERE parentCommentID = ? AND isDeleted = FALSE',
      [commentID]
    );

    res.status(200).json({
      success: true,
      message: 'Replies fetched successfully',
      data: {
        replies: replies,
        pagination: {
          currentPage: parseInt(page as string) || 1,
          totalPages: Math.ceil(totalCount[0].total / safeLimit),
          totalReplies: totalCount[0].total,
          hasMore: safeOffset + replies.length < totalCount[0].total
        }
      }
    });

  } catch (error) {
    console.error('[COMMENTS] Replies fetch error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during replies fetch',
      errorCode: 'SERVER_ERROR'
    });
  }
});

// POST /explore/comments - Create a new comment
router.post('/addcomments', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { entryID, commentText, parentCommentID = null } = req.body;

    if (!entryID || !commentText) {
      return res.status(400).json({
        success: false,
        message: 'Entry ID and comment text are required',
        errorCode: 'MISSING_FIELDS'
      });
    }

    if (!req.user || !req.user.userEmail) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required to comment',
        errorCode: 'AUTH_REQUIRED'
      });
    }

    // Validate comment length
    if (commentText.trim().length < 1 || commentText.length > 1000) {
      return res.status(400).json({
        success: false,
        message: 'Comment must be between 1 and 1000 characters',
        errorCode: 'INVALID_COMMENT_LENGTH'
      });
    }

    console.log('[COMMENTS] Creating comment for entry:', entryID, 'by user:', req.user.userEmail);

    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();

      // Verify entry exists
      const [entries]: any = await connection.query(
        'SELECT entryID, userEmail FROM Entries WHERE entryID = ?',
        [entryID]
      );

      if (entries.length === 0) {
        await connection.rollback();
        connection.release();
        return res.status(404).json({
          success: false,
          message: 'Entry not found',
          errorCode: 'ENTRY_NOT_FOUND'
        });
      }

      // If it's a reply, verify parent comment exists and belongs to same entry
      if (parentCommentID) {
        const [parentComments]: any = await connection.query(
          'SELECT commentID, entryID FROM Comments WHERE commentID = ? AND isDeleted = FALSE',
          [parentCommentID]
        );

        if (parentComments.length === 0) {
          await connection.rollback();
          connection.release();
          return res.status(404).json({
            success: false,
            message: 'Parent comment not found',
            errorCode: 'PARENT_COMMENT_NOT_FOUND'
          });
        }

        if (parentComments[0].entryID !== parseInt(entryID)) {
          await connection.rollback();
          connection.release();
          return res.status(400).json({
            success: false,
            message: 'Parent comment does not belong to this entry',
            errorCode: 'INVALID_PARENT_COMMENT'
          });
        }
      }

      // Insert comment
      const [result]: any = await connection.query(`
        INSERT INTO Comments (entryID, userEmail, commentText, parentCommentID, createdAt, updatedAt)
        VALUES (?, ?, ?, ?, NOW(), NOW())
      `, [entryID, req.user.userEmail, commentText.trim(), parentCommentID]);

      const commentID = result.insertId;

      // Update comment count on entry (only for top-level comments)
      if (!parentCommentID) {
        await connection.query(
          'UPDATE Entries SET commentCount = commentCount + 1 WHERE entryID = ?',
          [entryID]
        );
      }

      // Get the created comment with user info
      const [newComment]: any = await connection.query(`
        SELECT 
          c.commentID,
          c.entryID,
          c.userEmail,
          c.commentText,
          c.parentCommentID,
          c.createdAt,
          c.updatedAt,
          u.name as userName
        FROM Comments c
        INNER JOIN Users u ON c.userEmail = u.userEmail
        WHERE c.commentID = ?
      `, [commentID]);

      await connection.commit();
      connection.release();

      console.log('[COMMENTS] Comment created successfully with ID:', commentID);

      res.status(201).json({
        success: true,
        message: 'Comment created successfully',
        data: newComment[0]
      });

    } catch (error) {
      await connection.rollback();
      connection.release();
      throw error;
    }

  } catch (error) {
    console.error('[COMMENTS] Create error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during comment creation',
      errorCode: 'SERVER_ERROR'
    });
  }
});

// PUT /explore/comments/:commentID - Update a comment
router.put('/updatecomments/:commentID', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { commentID } = req.params;
    const { commentText } = req.body;

    if (!commentID || !commentText) {
      return res.status(400).json({
        success: false,
        message: 'Comment ID and text are required',
        errorCode: 'MISSING_FIELDS'
      });
    }

    if (!req.user || !req.user.userEmail) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required to update comments',
        errorCode: 'AUTH_REQUIRED'
      });
    }

    // Validate comment length
    if (commentText.trim().length < 1 || commentText.length > 1000) {
      return res.status(400).json({
        success: false,
        message: 'Comment must be between 1 and 1000 characters',
        errorCode: 'INVALID_COMMENT_LENGTH'
      });
    }

    console.log('[COMMENTS] Updating comment:', commentID, 'by user:', req.user.userEmail);

    // Check if comment exists and user owns it
    const [comments]: any = await pool.query(
      'SELECT commentID, userEmail, commentText FROM Comments WHERE commentID = ? AND isDeleted = FALSE',
      [commentID]
    );

    if (comments.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Comment not found',
        errorCode: 'COMMENT_NOT_FOUND'
      });
    }

    const comment = comments[0];

    if (comment.userEmail !== req.user.userEmail) {
      return res.status(403).json({
        success: false,
        message: 'You can only edit your own comments',
        errorCode: 'UNAUTHORIZED_EDIT'
      });
    }

    // Update comment
    await pool.query(
      'UPDATE Comments SET commentText = ?, updatedAt = NOW() WHERE commentID = ?',
      [commentText.trim(), commentID]
    );

    // Get updated comment with user info
    const [updatedComment]: any = await pool.query(`
      SELECT 
        c.commentID,
        c.entryID,
        c.userEmail,
        c.commentText,
        c.parentCommentID,
        c.createdAt,
        c.updatedAt,
        u.name as userName
      FROM Comments c
      INNER JOIN Users u ON c.userEmail = u.userEmail
      WHERE c.commentID = ?
    `, [commentID]);

    console.log('[COMMENTS] Comment updated successfully');

    res.status(200).json({
      success: true,
      message: 'Comment updated successfully',
      data: updatedComment[0]
    });

  } catch (error) {
    console.error('[COMMENTS] Update error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during comment update',
      errorCode: 'SERVER_ERROR'
    });
  }
});

// DELETE /explore/comments/:commentID - Delete a comment (soft delete)
router.delete('/delcomments/:commentID', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { commentID } = req.params;

    if (!commentID) {
      return res.status(400).json({
        success: false,
        message: 'Comment ID is required',
        errorCode: 'MISSING_COMMENT_ID'
      });
    }

    if (!req.user || !req.user.userEmail) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required to delete comments',
        errorCode: 'AUTH_REQUIRED'
      });
    }

    console.log('[COMMENTS] Deleting comment:', commentID, 'by user:', req.user.userEmail);

    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();

      // Check if comment exists and user owns it (or is admin)
      const [comments]: any = await connection.query(
        'SELECT commentID, userEmail, entryID, parentCommentID FROM Comments WHERE commentID = ? AND isDeleted = FALSE',
        [commentID]
      );

      if (comments.length === 0) {
        await connection.rollback();
        connection.release();
        return res.status(404).json({
          success: false,
          message: 'Comment not found',
          errorCode: 'COMMENT_NOT_FOUND'
        });
      }

      const comment = comments[0];

      // Check if user can delete (owner or admin)
      const [users]: any = await connection.query(
        'SELECT isEditor FROM Users WHERE userEmail = ?',
        [req.user.userEmail]
      );

      const isOwner = comment.userEmail === req.user.userEmail;
      const isAdmin = users.length > 0 && users[0].isEditor;

      if (!isOwner && !isAdmin) {
        await connection.rollback();
        connection.release();
        return res.status(403).json({
          success: false,
          message: 'You can only delete your own comments',
          errorCode: 'UNAUTHORIZED_DELETE'
        });
      }

      // Soft delete the comment
      await connection.query(
        'UPDATE Comments SET isDeleted = TRUE, updatedAt = NOW() WHERE commentID = ?',
        [commentID]
      );

      // Update comment count on entry (only for top-level comments)
      if (!comment.parentCommentID) {
        await connection.query(
          'UPDATE Entries SET commentCount = GREATEST(commentCount - 1, 0) WHERE entryID = ?',
          [comment.entryID]
        );
      }

      await connection.commit();
      connection.release();

      console.log('[COMMENTS] Comment deleted successfully');

      res.status(200).json({
        success: true,
        message: 'Comment deleted successfully'
      });

    } catch (error) {
      await connection.rollback();
      connection.release();
      throw error;
    }

  } catch (error) {
    console.error('[COMMENTS] Delete error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during comment deletion',
      errorCode: 'SERVER_ERROR'
    });
  }
});

export default router;