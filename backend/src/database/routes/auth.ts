import express, { Request, Response, NextFunction, Router } from 'express';
import cors from 'cors';
import { config } from 'dotenv';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import sgMail from '@sendgrid/mail';
import { pool } from '../dbconfig'; // Adjust path as needed

// Initialize dotenv
config();

// Create Express app and router
const app = express();
const router = Router();

// Middleware
app.use(express.json());
app.use(cors());

// Setup Stripe

// Setup SendGrid
sgMail.setApiKey(process.env.MAILERKEY || '');

// JWT secret key
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// ===== AUTH ROUTES =====

// Signup route
router.post('/signup', async (req: Request, res: Response) => {
  try {
    const { email, name, password, region } = req.body;

    // Validate input
    if (!email || !name || !password || !region) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    // Check if user already exists
    const [existingUsers]: any = await pool.query(
      'SELECT * FROM Users WHERE userID = ?',
      [email]
    );

    if (existingUsers.length > 0) {
      return res.status(409).json({ message: 'User already exists' });
    }

    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Generate verification token
    const verificationToken = uuidv4();

    // Current date for account creation
    const accountCreated = new Date();

    // Insert user into database
    const [result]: any = await pool.query(
      `INSERT INTO Users 
       (userID, name, password, accountCreated, totalEntries, region, isEditor, isVerified, verificationToken) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [email, name, hashedPassword, accountCreated, 0, region, false, false, verificationToken]
    );

    // Send verification email with SendGrid
    const verificationUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/verify?token=${verificationToken}`;
    
    const msg = {
      to: email,
      from: process.env.EMAIL_USER || 'noreply@benchracers.com', // Use your verified SendGrid email
      subject: 'Verify your Bench Racers account',
      html: `
        <h1>Welcome to Bench Racers!</h1>
        <p>Thank you for signing up. Please verify your email by clicking the link below:</p>
        <a href="${verificationUrl}">Verify Email</a>
        <p>If you did not create this account, please ignore this email.</p>
      `
    };

    await sgMail.send(msg);

    // Generate JWT token (can be used for auto-login)
    const token = jwt.sign(
      { 
        userID: email,
        name,
        accountCreated,
        totalEntries: 0,
        region,
        isEditor: false,
        isVerified: false
      }, 
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Return success
    res.status(201).json({ 
      message: 'User created successfully. Please check your email to verify your account.',
      token,
      user: {
        userID: email,
        name,
        accountCreated,
        totalEntries: 0,
        region,
        isEditor: false,
        isVerified: false
      }
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ message: 'Server error during signup process' });
  }
});

// Login route
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    // Get user from database
    const [users]: any = await pool.query(
      'SELECT * FROM Users WHERE userID = ?',
      [email]
    );

    // Check if user exists
    if (users.length === 0) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const user = users[0];

    // Compare passwords
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Check if user is verified
    if (!user.isVerified) {
      return res.status(403).json({ message: 'Please verify your email before logging in' });
    }

    // Generate JWT token
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

    // Return user data and token
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
    res.status(500).json({ message: 'Server error during login process' });
  }
});

// Email verification route
router.get('/verify', async (req: Request, res: Response) => {
  try {
    const { token } = req.query;

    if (!token || typeof token !== 'string') {
      return res.status(400).json({ message: 'Invalid verification token' });
    }

    // Find user with this verification token
    const [users]: any = await pool.query(
      'SELECT * FROM Users WHERE verificationToken = ?', 
      [token]
    );

    if (users.length === 0) {
      return res.status(400).json({ message: 'Invalid verification token' });
    }

    // Update user to verified status
    await pool.query(
      'UPDATE Users SET isVerified = TRUE, verificationToken = NULL WHERE userID = ?', 
      [users[0].userID]
    );

    // Redirect to login page or return success
    res.status(200).json({ message: 'Email verified successfully. You can now login.' });
  } catch (error) {
    console.error('Verification error:', error);
    res.status(500).json({ message: 'Server error during verification process' });
  }
});

// Password reset request route
router.post('/forgot-password', async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    // Check if user exists
    const [users]: any = await pool.query(
      'SELECT * FROM Users WHERE userID = ?',
      [email]
    );

    if (users.length === 0) {
      // For security reasons, don't reveal that the user doesn't exist
      return res.status(200).json({ message: 'If your email is registered, you will receive a password reset link' });
    }

    // Generate reset token
    const resetToken = uuidv4();
    const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour from now

    // Store token in database
    await pool.query(
      'UPDATE Users SET resetToken = ?, resetTokenExpiry = ? WHERE userID = ?',
      [resetToken, resetTokenExpiry, email]
    );

    // Send reset email with SendGrid
    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;
    
    const msg = {
      to: email,
      from: process.env.EMAIL_USER || 'noreply@benchracers.com', // Use your verified SendGrid email
      subject: 'Reset your Bench Racers password',
      html: `
        <h1>Password Reset Request</h1>
        <p>Click the link below to reset your password:</p>
        <a href="${resetUrl}">Reset Password</a>
        <p>If you did not request this, please ignore this email.</p>
        <p>This link will expire in 1 hour.</p>
      `
    };

    await sgMail.send(msg);

    res.status(200).json({ message: 'If your email is registered, you will receive a password reset link' });
  } catch (error) {
    console.error('Password reset request error:', error);
    res.status(500).json({ message: 'Server error during password reset request' });
  }
});

// Reset password route
router.post('/reset-password', async (req: Request, res: Response) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({ message: 'Token and new password are required' });
    }

    // Find user with this reset token
    const [users]: any = await pool.query(
      'SELECT * FROM Users WHERE resetToken = ? AND resetTokenExpiry > NOW()',
      [token]
    );

    if (users.length === 0) {
      return res.status(400).json({ message: 'Invalid or expired token' });
    }

    // Hash new password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

    // Update user's password and clear reset token
    await pool.query(
      'UPDATE Users SET password = ?, resetToken = NULL, resetTokenExpiry = NULL WHERE userID = ?',
      [hashedPassword, users[0].userID]
    );

    res.status(200).json({ message: 'Password reset successful. You can now login with your new password.' });
  } catch (error) {
    console.error('Password reset error:', error);
    res.status(500).json({ message: 'Server error during password reset' });
  }
});

// Register router with app
app.use('/api/users', router);

// ===== SERVER STARTUP =====

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// For PM2 graceful shutdown
process.on('SIGINT', () => {
  console.log('Shutting down gracefully');
  pool.end(); // Close database connections
  process.exit(0);
});

export default app;