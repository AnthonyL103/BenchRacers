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
        //use pool for only single queries, as it is more efficient
        //for multiple queries establish connection so you are performing all without 
        //closing connections in between
        
        const [top10result]: any = await connection.query(
            `SELECT 
              e.entryID, e.userEmail, e.carName, e.carMake, e.carModel, e.carYear, 
              e.carColor, e.basecost, e.carTrim, e.description, e.totalMods, e.totalCost, e.category,
              e.region, e.upvotes, e.engine, e.transmission, e.drivetrain,
              e.horsepower, e.torque, e.viewCount, e.createdAt, e.updatedAt, u.profilePhotoKey, u.name as userName
              p.s3Key as mainPhotoKey,
              GROUP_CONCAT(DISTINCT ap.s3Key) as allPhotoKeys,
              GROUP_CONCAT(DISTINCT t.tagName) as tagNames
            FROM Entries e
            JOIN Users u ON e.userEmail = u.userEmail
            LEFT JOIN EntryPhotos p ON e.entryID = p.entryID AND p.isMainPhoto = TRUE
            LEFT JOIN EntryPhotos ap ON e.entryID = ap.entryID
            LEFT JOIN EntryTags et ON e.entryID = et.entryID
            LEFT JOIN Tags t ON et.tagID = t.tagID
            WHERE u.isVerified = TRUE 
            GROUP BY e.entryID
            ORDER BY e.upvotes DESC
            LIMIT 10
            `);
        
        const carIds = top10result.map((car: any) => car.entryID);
        
        let modsMap = new Map();
        
        if (carIds.length > 0) {
        const [modsResults]: any = await connection.query(`
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
        const cars = top10result.map((car: any) => ({
        ...car,
        allPhotoKeys: car.allPhotoKeys ? car.allPhotoKeys.split(',') : [],
        tags: car.tagNames ? car.tagNames.split(',') : [],
        mods: modsMap.get(car.entryID) || []
        }));
        
        console.log('SUCCESSFULLY QUERIES TOP 10 Entries');
        
        res.status(200).json({
            success: true,
            message: 'Top 10 Cars fetched successfully',
            data: cars,
            count: cars.length
        });
        
        
    } catch (error) {
        console.error('rankings server error:', error);
        res.status(500).json({
        success: false,
        message: 'Server error during car rankings fetch',
        errorCode: 'SERVER_ERROR'
        });
    } finally {
        connection?.release();
    }
});


export default router;