import { Router, Request, Response, NextFunction } from 'express';
import { config } from 'dotenv';
import jwt from 'jsonwebtoken';
import { pool } from '../dbconfig';
import AWS from 'aws-sdk';
import { FieldPacket, ResultSetHeader } from 'mysql2/promise';
import axios from 'axios';

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
        
        const [result]: any = await connection.query(
            `SELECT userEmail, carName, carMake, 
            carModel,  FROM ENTRIES`
        )
        
        
    }
})


export default router;