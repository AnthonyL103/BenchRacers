import { Router, Request, Response } from 'express';
import { config } from 'dotenv';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import sgMail from '@sendgrid/mail';
import { pool } from '../dbconfig'; // Adjust if needed

config(); // Load .env
sgMail.setApiKey(process.env.MAILERKEY || '');
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

const router = Router();

// ===== AUTH ROUTES =====

// Signup route
router.post('/signup', async (req: Request, res: Response) => {
    console.log('[SIGNUP] Received signup request');
  
    try {
      const { email, name, password, region } = req.body;
      console.log('[SIGNUP] Request body:', { email, name, password: !!password, region });
  
      if (!email || !name || !password || !region) {
        console.warn('[SIGNUP] Missing required fields');
        return res.status(400).json({ message: 'All fields are required' });
      }
  
      const [existingUsers]: any = await pool.query('SELECT * FROM Users WHERE userID = ?', [email]);
      console.log('[SIGNUP] Checked for existing user:', existingUsers.length);
  
      if (existingUsers.length > 0) {
        console.warn('[SIGNUP] User already exists:', email);
        return res.status(409).json({ message: 'User already exists' });
      }
  
      const hashedPassword = await bcrypt.hash(password, 10);
      const verificationToken = uuidv4();
      const accountCreated = new Date();
  
      console.log('[SIGNUP] Inserting new user');
      await pool.query(
        `INSERT INTO Users 
         (userID, name, password, accountCreated, totalEntries, region, isEditor, isVerified, verificationToken) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [email, name, hashedPassword, accountCreated, 0, region, false, false, verificationToken]
      );
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
        { userID: email, name, accountCreated, totalEntries: 0, region, isEditor: false, isVerified: false },
        JWT_SECRET,
        { expiresIn: '24h' }
      );
  
      console.log('[SIGNUP] JWT generated, returning success');
      res.status(201).json({
        message: 'User created successfully. Please verify your email.',
        token,
        user: { userID: email, name, accountCreated, totalEntries: 0, region, isEditor: false, isVerified: false }
      });
    } catch (error) {
      console.error('[SIGNUP] Error occurred:', error);
      res.status(500).json({ message: 'Server error during signup' });
    }
  });
  

// Login route
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const [users]: any = await pool.query('SELECT * FROM Users WHERE userID = ?', [email]);
    if (users.length === 0 || !(await bcrypt.compare(password, users[0].password))) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const user = users[0];
    if (!user.isVerified) {
      return res.status(403).json({ message: 'Please verify your email before logging in' });
    }

    const token = jwt.sign(
      {
        userID: user.userID,
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
      message: 'Login successful',
      token,
      user: {
        userID: user.userID,
        name: user.name,
        accountCreated: user.accountCreated,
        userIndex: user.userIndex,
        totalEntries: user.totalEntries,
        region: user.region,
        isEditor: user.isEditor
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
});

// Email verification route
router.get('/verify', async (req: Request, res: Response) => {
  try {
    const { token } = req.query;
    if (!token || typeof token !== 'string') {
      return res.status(400).json({ message: 'Invalid verification token' });
    }

    const [users]: any = await pool.query('SELECT * FROM Users WHERE verificationToken = ?', [token]);
    if (users.length === 0) {
      return res.status(400).json({ message: 'Invalid token' });
    }

    await pool.query(
      'UPDATE Users SET isVerified = TRUE, verificationToken = NULL WHERE userID = ?',
      [users[0].userID]
    );

    res.status(200).json({ message: 'Email verified. You can now login.' });
  } catch (error) {
    console.error('Verification error:', error);
    res.status(500).json({ message: 'Server error during verification' });
  }
});

// Forgot password
router.post('/forgot-password', async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    const [users]: any = await pool.query('SELECT * FROM Users WHERE userID = ?', [email]);
    if (users.length === 0) {
      return res.status(200).json({ message: 'If registered, a reset link will be sent.' });
    }

    const resetToken = uuidv4();
    const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour

    await pool.query(
      'UPDATE Users SET resetToken = ?, resetTokenExpiry = ? WHERE userID = ?',
      [resetToken, resetTokenExpiry, email]
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

    res.status(200).json({ message: 'If registered, a reset link will be sent.' });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ message: 'Server error during reset request' });
  }
});

// Reset password
router.post('/reset-password', async (req: Request, res: Response) => {
  try {
    const { token, newPassword } = req.body;
    if (!token || !newPassword) {
      return res.status(400).json({ message: 'Token and password required' });
    }

    const [users]: any = await pool.query(
      'SELECT * FROM Users WHERE resetToken = ? AND resetTokenExpiry > NOW()',
      [token]
    );
    if (users.length === 0) {
      return res.status(400).json({ message: 'Invalid or expired token' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await pool.query(
      'UPDATE Users SET password = ?, resetToken = NULL, resetTokenExpiry = NULL WHERE userID = ?',
      [hashedPassword, users[0].userID]
    );

    res.status(200).json({ message: 'Password has been reset. You can now login.' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ message: 'Server error during password reset' });
  }
});

export default router;
