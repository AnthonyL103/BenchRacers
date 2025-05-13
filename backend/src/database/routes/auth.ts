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

/* OTHER QUERIES 
NOTE THE BOTTOM ROUTES ARE FOR THE AUTH PAGE (LOGIN/SIGNUP) I HAVNEN't configured the rest explicility as routes but here they are (Most basic features Im for sure doing, others like following are up in the air)

Get top 3 Cars for Exotic/Sport/ Off-Road Categories
SELECT * FROM Entries 
WHERE category IN ('Exotic', 'Sport', 'Off-Road') 
ORDER BY upvotes DESC 
LIMIT 3;


Get top 10 leaderboard (by votes)
SELECT entryID, carName, carMake, upvotes 
FROM Entries 
ORDER BY upvotes DESC 
LIMIT 10;


Get explore cars by category (should be different indexes than the input indexes(represents viewed cars))
SELECT * FROM Entries 
WHERE category = 'Sport' 
  AND entryID NOT IN (1, 5, 9)
  AND region = 'East'
ORDER BY RAND()
LIMIT 10;


Get Awards

SELECT * FROM Awards 
WHERE userEmail = 'some_user_id'
ORDER BY awardDate DESC;


Add Car Entry to the Database

INSERT INTO Entries (
    userEmail, carName, carMake, carColor, description, 
    s3ContentID, totalMods, totalCost, category, region
) VALUES (
    'some_user_id', 'blah', 'blah', 'blah', 
    'blah', 'blah', 5, 12000, 'blah', 'blah'
);

Update Entry Like/Dislike Count

UPDATE Entries 
SET upvotes = upvotes + 1 
WHERE entryID = 42;

UPDATE Entries 
SET upvotes = GREATEST(upvotes - 1, 0) 
WHERE entryID = 42;

Routes/queries for signup/login:
*/


// Login route with improved error handling
router.post('/login', async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body;
      
      // Check if email and password are provided
      if (!email || !password) {
        return res.status(400).json({ 
          success: false,
          message: 'Email and password are required',
          errorCode: 'MISSING_FIELDS'
        });
      }
  
      // Check if user exists
      const [users]: any = await pool.query('SELECT * FROM Users WHERE userEmail = ?', [email]);
      if (users.length === 0) {
        return res.status(401).json({ 
          success: false,
          message: 'Invalid email or password',
          errorCode: 'INVALID_CREDENTIALS'
        });
      }
  
      // Check if password is correct
      const user = users[0];
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        return res.status(401).json({ 
          success: false,
          message: 'Invalid email or password',
          errorCode: 'INVALID_CREDENTIALS'
        });
      }
  
      // Check if email is verified
      if (!user.isVerified) {
        // Generate a new verification token for convenience
        const verificationToken = uuidv4();
        await pool.query(
          'UPDATE Users SET verificationToken = ? WHERE userEmail = ?',
          [verificationToken, email]
        );
  
        // Send a new verification email
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
          // Continue with response even if email fails
        }
        
        return res.status(403).json({ 
          success: false,
          message: 'Please verify your email before logging in. A new verification email has been sent.',
          errorCode: 'EMAIL_NOT_VERIFIED'
        });
      }
  
      // Generate token for authenticated user
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
  
      // Return successful login response
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
  
  // Signup route with improved error handling
  router.post('/signup', async (req: Request, res: Response) => {
    console.log('[SIGNUP] Received signup request');
  
    try {
      const { email, name, password, region } = req.body;
      console.log('[SIGNUP] Request body:', { email, name, password: !!password, region });
  
      // Validate input fields
      if (!email || !name || !password || !region) {
        console.warn('[SIGNUP] Missing required fields');
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
  
      // Password strength validation (optional)
      if (password.length < 8) {
        return res.status(400).json({
          success: false,
          message: 'Password must be at least 8 characters long',
          errorCode: 'WEAK_PASSWORD'
        });
      }
  
      // Check if user already exists
      const [existingUsers]: any = await pool.query('SELECT * FROM Users WHERE userEmail = ?', [email]);
      console.log('[SIGNUP] Checked for existing user:', existingUsers.length);
  
      if (existingUsers.length > 0) {
        const existingUser = existingUsers[0];
        
        // If user exists but isn't verified, we can offer to resend verification email
        if (!existingUser.isVerified) {
          // Generate a new verification token
          const verificationToken = uuidv4();
          await pool.query(
            'UPDATE Users SET verificationToken = ? WHERE userEmail = ?',
            [verificationToken, email]
          );
  
          // Send verification email
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
  
          return res.status(409).json({ 
            success: false,
            message: 'An account with this email already exists but is not verified. A new verification email has been sent.',
            errorCode: 'USER_EXISTS_NOT_VERIFIED'
          });
        }
        
        // User exists and is verified
        console.warn('[SIGNUP] User already exists:', email);
        return res.status(409).json({ 
          success: false,
          message: 'An account with this email already exists',
          errorCode: 'USER_EXISTS'
        });
      }
  
      // Create new user
      const hashedPassword = await bcrypt.hash(password, 10);
      const verificationToken = uuidv4();
      const accountCreated = new Date();
  
      console.log('[SIGNUP] Inserting new user');
      await pool.query(
        `INSERT INTO Users 
         (userEmail, name, password, accountCreated, totalEntries, region, isEditor, isVerified, verificationToken) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [email, name, hashedPassword, accountCreated, 0, region, false, false, verificationToken]
      );
      console.log('[SIGNUP] Inserted user successfully');
  
      // Send verification email
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
  
      // Generate JWT token for the new user
      const token = jwt.sign(
        { userEmail: email, name, accountCreated, totalEntries: 0, region, isEditor: false, isVerified: false },
        JWT_SECRET,
        { expiresIn: '24h' }
      );
  
      console.log('[SIGNUP] JWT generated, returning success');
      res.status(201).json({
        success: true,
        message: 'User created successfully. Please verify your email.',
        token,
        user: { userEmail: email, name, accountCreated, totalEntries: 0, region, isEditor: false, isVerified: false }
      });
    } catch (error) {
      console.error('[SIGNUP] Error occurred:', error);
      res.status(500).json({ 
        success: false,
        message: 'Server error during signup',
        errorCode: 'SERVER_ERROR'
      });
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
      'UPDATE Users SET isVerified = TRUE, verificationToken = NULL WHERE userEmail = ?',
      [users[0].userEmail]
    );

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

    const [users]: any = await pool.query('SELECT * FROM Users WHERE userEmail = ?', [email]);
    if (users.length === 0) {
      return res.status(200).json({ message: 'If registered, a reset link will be sent.' });
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

    res.status(200).json({ message: 'If registered, a reset link will be sent.' });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ message: 'Server error during reset request' });
  }
});

router.post('/reset-password', async (req: Request, res: Response) => {
  try {
    const { token, newPassword } = req.body;
    if (!token || !newPassword) {
      return res.status(400).json({ message: 'Token and password required' });
    }

    const [users]: any = await pool.query(
      'SELECT * FROM Users WHERE resetToken = ? AND resetTokenExpiration > NOW()',
      [token]
    );
    if (users.length === 0) {
      return res.status(400).json({ message: 'Invalid or expired token' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await pool.query(
      'UPDATE Users SET password = ?, resetToken = NULL, resetTokenExpiration = NULL WHERE userEmail = ?',
      [hashedPassword, users[0].userEmail]
    );

    res.status(200).json({ message: 'Password has been reset. You can now login.' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ message: 'Server error during password reset' });
  }
});

export default router;
