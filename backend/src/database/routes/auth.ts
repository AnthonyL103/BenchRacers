import { Router, Request, Response } from 'express';
import { config } from 'dotenv';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import sgMail from '@sendgrid/mail';
import { pool } from '../dbconfig'; 

config(); 
sgMail.setApiKey(process.env.MAILERKEY || '');
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

const router = Router();

router.post('/login', async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({ 
          success: false,
          message: 'Email and password are required',
          errorCode: 'MISSING_FIELDS'
        });
      }
  
      const [users]: any = await pool.query(
        'SELECT userEmail, name, password, accountCreated, userIndex, totalEntries, region, isEditor, isVerified, verificationToken FROM Users WHERE userEmail = ?', 
        [email]
      );
      
      if (users.length === 0) {
        return res.status(401).json({ 
          success: false,
          message: 'Invalid email or password',
          errorCode: 'INVALID_CREDENTIALS'
        });
      }
  
      const user = users[0];
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        return res.status(401).json({ 
          success: false,
          message: 'Invalid email or password',
          errorCode: 'INVALID_CREDENTIALS'
        });
      }
  
      if (!user.isVerified) {
        const verificationToken = uuidv4();
        
        await pool.query(
          'UPDATE Users SET verificationToken = ? WHERE userEmail = ?',
          [verificationToken, email]
        );
  
        const verificationUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/verify?token=${verificationToken}`;
        const msg = {
          to: email,
          from: process.env.EMAIL_USER || 'noreply@benchracers.com',
          subject: 'Verify your Bench Racers account',
          html: `
            <h1>Welcome to Bench Racers!</h1>
            <p>Please verify your email to complete your registration:</p>
            <a href="${verificationUrl}">Verify Email</a>
          `
        };
  
        try {
          await sgMail.send(msg);
          console.log('[LOGIN] New verification email sent');
        } catch (sendErr) {
          console.error('[LOGIN] Failed to send new verification email', sendErr);
        }
        
        return res.status(403).json({ 
          success: false,
          message: 'Please verify your email before logging in. A new verification email has been sent.',
          errorCode: 'EMAIL_NOT_VERIFIED'
        });
      }
  
      const token = jwt.sign(
        {
          userEmail: user.userEmail,
          name: user.name,
          accountCreated: user.accountCreated,
          userIndex: user.userIndex,
          totalEntries: user.totalEntries,
          region: user.region,
          isEditor: user.isEditor,
          isVerified: user.isVerified
        },
        JWT_SECRET,
        { expiresIn: '7d' }
      );
  
      res.status(200).json({
        success: true,
        message: 'Login successful',
        token,
        user: {
          userEmail: user.userEmail,
          name: user.name,
          accountCreated: user.accountCreated,
          userIndex: user.userIndex,
          totalEntries: user.totalEntries,
          region: user.region,
          isEditor: user.isEditor
        }
      });
    } catch (error) {
      console.error('[LOGIN] Server error:', error);
      res.status(500).json({ 
        success: false,
        message: 'Server error during login',
        errorCode: 'SERVER_ERROR'
      });
    }
});
  
router.post('/signup', async (req: Request, res: Response) => {
    console.log('[SIGNUP] Received signup request');
    
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();
      
      const { email, name, password, region } = req.body;
      console.log('[SIGNUP] Request body:', { email, name, password: !!password, region });
  
      if (!email || !name || !password || !region) {
        console.warn('[SIGNUP] Missing required fields');
        
        connection.release();
        
        return res.status(400).json({ 
          success: false,
          message: 'All fields are required',
          errorCode: 'MISSING_FIELDS',
          missingFields: [
            !email ? 'email' : null,
            !name ? 'name' : null,
            !password ? 'password' : null,
            !region ? 'region' : null
          ].filter(Boolean)
        });
      }
  
      if (password.length < 8) {
        connection.release();
        return res.status(400).json({
          success: false,
          message: 'Password must be at least 8 characters long',
          errorCode: 'WEAK_PASSWORD'
        });
      }
  
      const [existingUsers]: any = await connection.query(
        'SELECT userEmail, isVerified FROM Users WHERE userEmail = ?', 
        [email]
      );
      
      console.log('[SIGNUP] Checked for existing user:', existingUsers.length);
  
      if (existingUsers.length > 0) {
        const existingUser = existingUsers[0];
        
        if (!existingUser.isVerified) {
          const verificationToken = uuidv4();
          
          await connection.query(
            'UPDATE Users SET verificationToken = ? WHERE userEmail = ?',
            [verificationToken, email]
          );
          
          await connection.commit();
  
          const verificationUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/verify?token=${verificationToken}`;
          const msg = {
            to: email,
            from: process.env.EMAIL_USER || 'noreply@benchracers.com',
            subject: 'Verify your Bench Racers account',
            html: `
              <h1>Welcome to Bench Racers!</h1>
              <p>Please verify your email to complete your registration:</p>
              <a href="${verificationUrl}">Verify Email</a>
            `
          };
  
          try {
            await sgMail.send(msg);
            console.log('[SIGNUP] Resent verification email');
          } catch (sendErr) {
            console.error('[SIGNUP] Email resend failed');
          }
          
          connection.release();
          
          return res.status(409).json({ 
            success: false,
            message: 'An account with this email already exists but is not verified. A new verification email has been sent.',
            errorCode: 'USER_EXISTS_NOT_VERIFIED'
          });
        }
        
        console.warn('[SIGNUP] User already exists:', email);
        
        await connection.rollback();
        connection.release();
        
        return res.status(409).json({ 
          success: false,
          message: 'An account with this email already exists',
          errorCode: 'USER_EXISTS'
        });
      }
  
      const hashedPassword = await bcrypt.hash(password, 10);
      const verificationToken = uuidv4();
      const accountCreated = new Date();
  
      console.log('[SIGNUP] Inserting new user');
      
      await connection.query(
        `INSERT INTO Users 
         (userEmail, name, password, accountCreated, totalEntries, region, isEditor, isVerified, verificationToken) 
         VALUES (?, ?, ?, ?, 0, ?, FALSE, FALSE, ?)`,
        [email, name, hashedPassword, accountCreated, region, verificationToken]
      );
      
      await connection.commit();
      
      console.log('[SIGNUP] Inserted user successfully');
  
      const verificationUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/verify?token=${verificationToken}`;
      console.log('[SIGNUP] Generated verification URL:', verificationUrl);
  
      const msg = {
        to: email,
        from: process.env.EMAIL_USER || 'noreply@benchracers.com',
        subject: 'Verify your Bench Racers account',
        html: `
          <h1>Welcome to Bench Racers!</h1>
          <p>Thank you for signing up. Please verify your email:</p>
          <a href="${verificationUrl}">Verify Email</a>
        `
      };
  
      console.log('[SIGNUP] Sending verification email to:', msg.to);
      try {
        await sgMail.send(msg);
        console.log('[SIGNUP] Verification email sent');
      } catch (sendErr) {
        console.error('[SIGNUP] Email send failed');
        throw sendErr;
      }
  
      const token = jwt.sign(
        { userEmail: email, name, accountCreated, totalEntries: 0, region, isEditor: false, isVerified: false },
        JWT_SECRET,
        { expiresIn: '24h' }
      );
  
      console.log('[SIGNUP] JWT generated, returning success');
      
      connection.release();
      
      res.status(201).json({
        success: true,
        message: 'User created successfully. Please verify your email.',
        token,
        user: { userEmail: email, name, accountCreated, totalEntries: 0, region, isEditor: false, isVerified: false }
      });
    } catch (error) {
      await connection.rollback();
      connection.release();
      
      console.error('[SIGNUP] Error occurred:', error);
      res.status(500).json({ 
        success: false,
        message: 'Server error during signup',
        errorCode: 'SERVER_ERROR'
      });
    }
});
  
router.get('/verify', async (req: Request, res: Response) => {
  try {
    const { token } = req.query;
    if (!token || typeof token !== 'string') {
      return res.status(400).json({ message: 'Invalid verification token' });
    }

    const [result]: any = await pool.query(
      'UPDATE Users SET isVerified = TRUE, verificationToken = NULL WHERE verificationToken = ?',
      [token]
    );
    
    if (result.affectedRows === 0) {
      return res.status(400).json({ message: 'Invalid token' });
    }

    res.status(200).json({ message: 'Email verified. You can now login.' });
  } catch (error) {
    console.error('Verification error:', error);
    res.status(500).json({ message: 'Server error during verification' });
  }
});

router.post('/forgot-password', async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    const [users]: any = await pool.query(
      'SELECT userEmail FROM Users WHERE userEmail = ?', 
      [email]
    );
    
    const standardResponse = { message: 'If registered, a reset link will be sent.' };
    
    if (users.length === 0) {
      await new Promise(resolve => setTimeout(resolve, 100 + Math.random() * 100));
      return res.status(200).json(standardResponse);
    }

    const resetToken = uuidv4();
    const resetTokenExpiration = new Date(Date.now() + 3600000); // 1 hour

    await pool.query(
      'UPDATE Users SET resetToken = ?, resetTokenExpiration = ? WHERE userEmail = ?',
      [resetToken, resetTokenExpiration, email]
    );

    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;
    const msg = {
      to: email,
      from: process.env.EMAIL_USER || 'noreply@benchracers.com',
      subject: 'Reset your password',
      html: `
        <h1>Password Reset</h1>
        <p><a href="${resetUrl}">Reset Password</a></p>
        <p>This link expires in 1 hour.</p>
      `
    };

    await sgMail.send(msg);

    res.status(200).json(standardResponse);
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ message: 'Server error during reset request' });
  }
});

router.post('/reset-password', async (req: Request, res: Response) => {
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();
    
    const { token, newPassword } = req.body;
    if (!token || !newPassword) {
      connection.release();
      return res.status(400).json({ message: 'Token and password required' });
    }

    const [users]: any = await connection.query(
      'SELECT userEmail FROM Users WHERE resetToken = ? AND resetTokenExpiration > NOW()',
      [token]
    );
    
    if (users.length === 0) {
      await connection.rollback();
      connection.release();
      return res.status(400).json({ message: 'Invalid or expired token' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    await connection.query(
      'UPDATE Users SET password = ?, resetToken = NULL, resetTokenExpiration = NULL WHERE userEmail = ?',
      [hashedPassword, users[0].userEmail]
    );

    await connection.commit();
    connection.release();

    res.status(200).json({ message: 'Password has been reset. You can now login.' });
  } catch (error) {
    await connection.rollback();
    connection.release();
    
    console.error('Reset password error:', error);
    res.status(500).json({ message: 'Server error during password reset' });
  }
});

export default router;