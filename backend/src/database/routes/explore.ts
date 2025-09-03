import { Router, Request, Response } from 'express';
import { config } from 'dotenv';
import jwt from 'jsonwebtoken';
import { pool } from '../dbconfig';
import { connect } from 'http2';

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
  
  const connection = await pool.getConnection();
  
  try {
    const { swipedCars = [], likedCars = [], limit = 10, region = null, category = null } = req.body;
    
    console.log('[EXPLORE] Extracted parameters:', {
      swipedCars: swipedCars.length,
      likedCars: likedCars.length,
      limit,
      region,
      category
    });
    
    // Updated base query with LEFT JOIN to EntryUpvotes
    let baseQuery = `
      SELECT 
        e.entryID, e.userEmail as userID, e.carName, e.carMake, e.carModel,
        e.carYear, e.carColor, e.basecost, e.carTrim, e.description, e.totalMods, e.totalCost,
        e.category, e.region, e.upvotes, e.commentCount, e.engine, e.transmission,
        e.drivetrain, e.horsepower, e.torque, e.viewCount, e.createdAt,
        u.name as userName, u.profilephotokey,
        CASE WHEN eu.entryUpvoteID IS NOT NULL THEN TRUE ELSE FALSE END as hasUpvoted
      FROM Entries e
      INNER JOIN Users u ON e.userEmail = u.userEmail
      LEFT JOIN EntryUpvotes eu ON e.entryID = eu.entryID AND eu.userEmail = ?
      WHERE u.isVerified = TRUE
    `;
    
    // Add the user's email as the first parameter for the LEFT JOINdd
    const queryParams: any[] = [req.user?.userEmail || null];
    
    // All your existing filter logic stays the same
    if (swipedCars.length > 0) {
      const placeholders = swipedCars.map(() => '?').join(',');
      baseQuery += ` AND e.entryID NOT IN (${placeholders})`;
      queryParams.push(...swipedCars);
    }
    
    if (likedCars.length > 0) {
      const likedPlaceholders = likedCars.map(() => '?').join(',');
      baseQuery += ` AND e.entryID NOT IN (${likedPlaceholders})`;
      queryParams.push(...likedCars);
    }
    
    if (region && region !== 'all') {
      baseQuery += ` AND e.region = ?`;
      queryParams.push(region);
    }
    
    if (category && category !== 'all') {
      baseQuery += ` AND e.category = ?`;
      queryParams.push(category);
    }
    
    if (req.user && req.user.userEmail) {
      baseQuery += ` AND e.userEmail != ?`;
      queryParams.push(req.user.userEmail);
    }
    
    // Updated count query with same LEFT JOIN pattern
    let countQuery = `
      SELECT COUNT(*) as total
      FROM Entries e
      INNER JOIN Users u ON e.userEmail = u.userEmail
      WHERE u.isVerified = TRUE
    `;
    
    // Count query uses same parameters except for the initial userEmail for LEFT JOIN
    const countQueryParams = queryParams.slice(1); // Remove the first userEmail parameter
    
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
    
    console.log('[EXPLORE] About to execute count query...');
    
    // Execute count query with appropriate parameters
    const [countResult]: any = await connection.query(countQuery, countQueryParams);
    console.log('[EXPLORE] Count query result:', countResult);
    
    const totalCount = Number(countResult[0]?.total) || 0;
    const safeLimit = Number(Math.min(Math.max(parseInt(limit) || 10, 1), 50));

    if (totalCount === 0) {
      return res.status(200).json({
        success: true,
        message: 'No cars found',
        data: [],
        count: 0
      });
    }
    
    const maxOffset = Math.max(0, totalCount - safeLimit);
    const randomOffset = Math.floor(Math.random() * (maxOffset + 1));
    const mainQueryParams = [...queryParams, safeLimit, randomOffset];
    baseQuery += ` ORDER BY e.entryID LIMIT ? OFFSET ?`;

    console.log('[EXPLORE] About to execute main query...');
    const [cars]: any = await connection.query(baseQuery, mainQueryParams);
    
    console.log('[EXPLORE] Main query executed, result count:', cars.length);
    
    // Rest of your existing code remains the same...
    if (cars.length === 0) {
      return res.status(200).json({
        success: true,
        message: 'No cars found',
        data: [],
        count: 0
      });
    }
    
    const entryIds = cars.map((car: any) => car.entryID);
    const photoPlaceholders = entryIds.map(() => '?').join(',');
    
    console.log('[EXPLORE] About to fetch photos...');
    const [photos]: any = await connection.query(`
      SELECT 
        entryID,
        GROUP_CONCAT(s3key ORDER BY s3key ASC) as allPhotoKeys,
        MAX(CASE WHEN isMainPhoto = TRUE THEN s3key END) as mainPhotoKey
      FROM EntryPhotos 
      WHERE entryID IN (${photoPlaceholders})
      GROUP BY entryID
    `, entryIds);
    
    console.log('[EXPLORE] About to fetch tags...');
    const [tags]: any = await connection.query(`
      SELECT 
        et.entryID,
        GROUP_CONCAT(t.tagName ORDER BY t.tagName ASC) as tags
      FROM EntryTags et
      INNER JOIN Tags t ON et.tagID = t.tagID
      WHERE et.entryID IN (${photoPlaceholders})
      GROUP BY et.entryID
    `, entryIds);
    
    console.log('[EXPLORE] About to fetch mods...');
    const [mods]: any = await connection.query(`
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

    // Process the data with hasUpvoted already included from the main query
    const photoMap = new Map<number, any>(photos.map((p: any) => [p.entryID, p]));
    const tagMap = new Map<number, any>(tags.map((t: any) => [t.entryID, t]));
    
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

    const processedCars = cars.map((car: any) => {
      const photoData = photoMap.get(car.entryID);
      const tagData = tagMap.get(car.entryID);
      const modData = modMap.get(car.entryID);

      return {
        ...car,
        allPhotoKeys: photoData?.allPhotoKeys ? photoData.allPhotoKeys.split(',') : [],
        mainPhotoKey: photoData?.mainPhotoKey || null,
        tags: tagData?.tags ? tagData.tags.split(',') : [],
        mods: modData || [],
        hasUpvoted: !!car.hasUpvoted // Convert to boolean, already fetched from main query
      };
    });
    
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
    res.status(500).json({
      success: false,
      message: 'Server error during car fetch',
      errorCode: 'SERVER_ERROR'
    });
  } finally {
    connection.release();
    console.log('[EXPLORE] Connection released');
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
        return res.status(404).json({
          success: false,
          message: 'Car not found',
          errorCode: 'CAR_NOT_FOUND'
        });
      }
      
      const [existingUpvotes]: any = await connection.query(
        'SELECT * FROM EntryUpvotes WHERE entryID = ? AND userEmail = ?',
        [carId, req.user.userEmail]
      );
      
      let action: string;
      
      let newUpvoteCount: number;
      
      if (existingUpvotes.length > 0) {
        await connection.query(
            'DELETE FROM EntryUpvotes WHERE entryID = ? AND userEmail = ?',
            [carId, req.user.userEmail]
        );
        
        await connection.query(
            'UPDATE Entries SET upvotes = GREATEST(upvotes - 1, 0) WHERE entryID = ?',
            [carId]
            );
        action = 'unupvoted';
      
        } else {
        await connection.query(
            'INSERT INTO EntryUpvotes (entryID, userEmail) VALUES (?, ?)',
            [carId, req.user.userEmail]
        );
        
        console.log('[EXPLORE] Inserting upvote record for user:', req.user.userEmail, 'and car:', carId);
        
        await connection.query(
            'UPDATE Entries SET upvotes = upvotes + 1 WHERE entryID = ?',
            [carId]
        );
        action = 'upvoted';
      }
      const updatedUpvotes: any = await connection.query(
        'SELECT upvotes FROM Entries WHERE entryID = ?',
        [carId]
      );
      
      newUpvoteCount = updatedUpvotes[0].upvotes;
      
      await connection.commit();
      
      console.log('[EXPLORE] Like processed successfully');
      
      res.status(200).json({
        success: true,
        message: `Car ${action} successfully`,
        newUpvotes: newUpvoteCount,
        hasUpvoted: action === 'upvoted'
      });
      
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
        connection.release();
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

  const connection = await pool.getConnection();
  try {
    console.log('[EXPLORE] Fetching stats');
    
    const [stats]: any = await connection.query(`
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
    
    const [regionStats]: any = await connection.query(`
      SELECT 
        e.region,
        COUNT(*) as count
      FROM Entries e
      INNER JOIN Users u ON e.userEmail = u.userEmail
      WHERE u.isVerified = TRUE
      GROUP BY e.region
      ORDER BY count DESC
    `);
    
    const [categoryStats]: any = await connection.query(`
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
    
    const [popularTags]: any = await connection.query(`
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
  } finally {
    connection.release();
  }
});


// GET /explore/getcomments/:entryID - Get comments for an entry
router.get('/getcomments/:entryID', authenticateToken, async (req: Request, res: Response) => {
  const connection = await pool.getConnection();
  
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
    const [entries]: any = await connection.query(
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

    const [topLevelComments]: any = await connection.query(`
      SELECT 
        c.commentID,
        c.entryID,
        c.userEmail,
        c.commentText,
        c.parentCommentID,
        c.createdAt,
        c.likes,
        c.updatedAt,
        c.isDeleted,
        u.name as userName,
        u.profilephotokey as profilePhotoKey,
        COUNT(replies.commentID) as replyCount,
        CASE WHEN cl.commentLikeID IS NOT NULL THEN TRUE ELSE FALSE END as hasLiked
      FROM Comments c
      INNER JOIN Users u ON c.userEmail = u.userEmail
      LEFT JOIN Comments replies ON c.commentID = replies.parentCommentID AND replies.isDeleted = FALSE
      LEFT JOIN CommentLikes cl ON c.commentID = cl.commentID AND cl.userEmail = ?
      WHERE c.entryID = ? AND c.parentCommentID IS NULL AND c.isDeleted = FALSE
      GROUP BY c.commentID
      ORDER BY c.createdAt DESC
      LIMIT ? OFFSET ?
    `, [req.user?.userEmail, entryID, safeLimit, safeOffset]);

    const commentsWithReplies = await Promise.all(
      topLevelComments.map(async (comment: any) => {
        const [replies]: any = await connection.query(`
          SELECT 
            c.commentID,
            c.entryID,
            c.userEmail,
            c.commentText,
            c.parentCommentID,
            c.createdAt,
            c.likes,
            c.updatedAt,
            c.isDeleted,
            u.name as userName,
            u.profilephotokey as profilePhotoKey,
            CASE WHEN cl.commentLikeID IS NOT NULL THEN TRUE ELSE FALSE END as hasLiked
          FROM Comments c
          INNER JOIN Users u ON c.userEmail = u.userEmail
          LEFT JOIN CommentLikes cl ON c.commentID = cl.commentID AND cl.userEmail = ?
          WHERE c.parentCommentID = ? AND c.isDeleted = FALSE
          ORDER BY c.createdAt ASC
          LIMIT 5
        `, [req.user?.userEmail, comment.commentID]);

        return {
          ...comment,
          replies: replies,
          hasMoreReplies: replies.length === 5 && comment.replyCount > 5
        };
      })
    );

    const [totalCount]: any = await connection.query(
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
  } finally {
    connection.release();
  }
});

// POST /explore/likecomment/:commentID - Like/unlike a comment
router.post('/likecomment/:commentID', authenticateToken, async (req: Request, res: Response) => {
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
        message: 'Authentication required to like comments',
        errorCode: 'AUTH_REQUIRED'
      });
    }

    console.log('[COMMENTS] Toggling like for comment:', commentID, 'by user:', req.user.userEmail);

    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();

      // Verify comment exists
      const [comments]: any = await connection.query(
        'SELECT commentID FROM Comments WHERE commentID = ? AND isDeleted = FALSE',
        [commentID]
      );

      if (comments.length === 0) {
        await connection.rollback();
        return res.status(404).json({
          success: false,
          message: 'Comment not found',
          errorCode: 'COMMENT_NOT_FOUND'
        });
      }

      // Check if user already liked this comment
      const [existingLikes]: any = await connection.query(
        'SELECT commentLikeID FROM CommentLikes WHERE commentID = ? AND userEmail = ?',
        [commentID, req.user.userEmail]
      );

      let action: string;
      let newLikeCount: number;

      if (existingLikes.length > 0) {
        // Unlike - remove like and decrement count
        await connection.query(
          'DELETE FROM CommentLikes WHERE commentID = ? AND userEmail = ?',
          [commentID, req.user.userEmail]
        );
        
        await connection.query(
          'UPDATE Comments SET likes = GREATEST(likes - 1, 0) WHERE commentID = ?',
          [commentID]
        );
        
        action = 'unliked';
      } else {
        // Like - add like and increment count
        await connection.query(
          'INSERT INTO CommentLikes (commentID, userEmail) VALUES (?, ?)',
          [commentID, req.user.userEmail]
        );
        
        await connection.query(
          'UPDATE Comments SET likes = likes + 1 WHERE commentID = ?',
          [commentID]
        );
        
        action = 'liked';
      }

      // Get updated like count
      const [updatedComment]: any = await connection.query(
        'SELECT likes FROM Comments WHERE commentID = ?',
        [commentID]
      );
      
      newLikeCount = updatedComment[0].likes;

      await connection.commit();

      console.log(`[COMMENTS] Comment ${action} successfully`);

      res.status(200).json({
        success: true,
        message: `Comment ${action} successfully`,
        data: {
          action,
          likes: newLikeCount,
          hasLiked: action === 'liked'
        }
      });

    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
        connection.release();
    }

  } catch (error) {
    console.error('[COMMENTS] Like toggle error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during like toggle',
      errorCode: 'SERVER_ERROR'
    });
  }
});

// PUT /explore/editcomment/:commentID - Edit a comment
router.put('/editcomment/:commentID', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { commentText } = req.body;
    const { commentID } = req.params;

    if (!commentText) {
      return res.status(400).json({
        success: false,
        message: 'Comment text is required',
        errorCode: 'MISSING_COMMENT_TEXT'
      });
    }

    if (!req.user || !req.user.userEmail) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required to edit comments',
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

    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();

      // Verify comment exists and user owns it
      const [comments]: any = await connection.query(
        'SELECT commentID, userEmail FROM Comments WHERE commentID = ? AND isDeleted = FALSE',
        [commentID]
      );

      if (comments.length === 0) {
        await connection.rollback();
        return res.status(404).json({
          success: false,
          message: 'Comment not found',
          errorCode: 'COMMENT_NOT_FOUND'
        });
      }

      // Check if user owns the comment
      if (comments[0].userEmail !== req.user.userEmail) {
        await connection.rollback();
        return res.status(403).json({
          success: false,
          message: 'You can only edit your own comments',
          errorCode: 'UNAUTHORIZED_EDIT'
        });
      }

      // Update the comment text
      await connection.query(
        'UPDATE Comments SET commentText = ?, updatedAt = NOW() WHERE commentID = ?',
        [commentText.trim(), commentID]
      );

      await connection.commit();

      console.log('[COMMENTS] Comment edited successfully');

      return res.status(200).json({
        success: true,
        message: 'Comment updated successfully'
      });

    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
        connection.release();
    }
  } catch (error) {
    console.error('[COMMENTS] Update error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during comment update',
      errorCode: 'SERVER_ERROR'
    });
  }
});

// POST /explore/addcomments - Create a new comment
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
        'SELECT entryID FROM Entries WHERE entryID = ?',
        [entryID]
      );

      if (entries.length === 0) {
        await connection.rollback();
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
          return res.status(404).json({
            success: false,
            message: 'Parent comment not found',
            errorCode: 'PARENT_COMMENT_NOT_FOUND'
          });
        }

        if (parentComments[0].entryID !== parseInt(entryID)) {
          await connection.rollback();
          return res.status(400).json({
            success: false,
            message: 'Parent comment does not belong to this entry',
            errorCode: 'INVALID_PARENT_COMMENT'
          });
        }
      }

      // Insert comment
      const [result]: any = await connection.query(`
        INSERT INTO Comments (entryID, userEmail, commentText, parentCommentID, createdAt, updatedAt, likes)
        VALUES (?, ?, ?, ?, NOW(), NOW(), 0)
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
          c.likes,
          u.name as userName,
          u.profilephotokey as profilePhotoKey
        FROM Comments c
        INNER JOIN Users u ON c.userEmail = u.userEmail
        WHERE c.commentID = ?
      `, [commentID]);

      await connection.commit();

      console.log('[COMMENTS] Comment created successfully with ID:', commentID);

      res.status(201).json({
        success: true,
        message: 'Comment created successfully',
        data: {
          ...newComment[0],
          hasLiked: false // New comment, user hasn't liked it yet
        }
      });

    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
        connection.release();
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

// DELETE /explore/delcomments/:commentID - Delete a comment (soft delete)
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

      console.log('[COMMENTS] Comment deleted successfully');

      res.status(200).json({
        success: true,
        message: 'Comment deleted successfully'
      });

    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
        connection.release();
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