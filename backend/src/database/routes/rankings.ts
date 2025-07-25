import { Router, Request, Response, NextFunction } from 'express';
import { config } from 'dotenv';
import jwt from 'jsonwebtoken';
import { pool } from '../dbconfig';

config();
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

const router = Router();

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
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded; 
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
};


router.get('/top10', authenticateUser, async (req: AuthenticatedRequest, res: Response) => {
    const connection = await pool.getConnection();
    
    try {
        
        await connection.beginTransaction();
        
        //use pool for only single queries, as it is more efficient
        //for multiple queries establish connection so you are performing all without 
        //closing connections in between
        
        const [top10result]: any = await pool.query(
            `SELECT e.entryID, e.userEmail, e.carName, e.carMake, e.carModel, e.upvotes,
                u.name as userName, u.profilephotokey,
                (SELECT GROUP_CONCAT(s3key ORDER BY s3key ASC) 
                FROM EntryPhotos ep1 WHERE ep1.entryID = e.entryID) as allPhotoKeys,
                (SELECT s3key FROM EntryPhotos ep2 
                WHERE ep2.entryID = e.entryID AND ep2.isMainPhoto = TRUE LIMIT 1) as mainPhotoKey
            FROM Entries e
            INNER JOIN Users u ON e.userEmail = u.userEmail
            WHERE u.isVerified = TRUE 
            ORDER BY e.upvotes DESC
            LIMIT 10
            `);
            
        const processedtop10 = top10result.map((car: any ) => ({
            carName: car.carName,
            carMake: car.carMake,
            carModel: car.Model,
            upvotes: car.upvotes,
            allPhotoKeys: car.allPhotoKeys ? car.allPhotoKeys.split(',') : [],
            mainPhotoKey: car.mainPhotoKey,
            profilephotokey: car.profilephotokey,
        }))
        
        console.log('SUCCESSFULLY QUERIES TOP 10 Entries');
        
        res.status(200).json({
            success: true,
            message: 'Top 10 Cars fetched successfully',
            data: processedtop10,
            count: processedtop10.length
        });
        
        
    } catch (error) {
    console.error('rankings server error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during car rankings fetch',
      errorCode: 'SERVER_ERROR'
    });
    }
    
})


export default router;