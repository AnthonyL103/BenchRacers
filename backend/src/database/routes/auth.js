"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const dotenv_1 = require("dotenv");
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const uuid_1 = require("uuid");
const mail_1 = __importDefault(require("@sendgrid/mail"));
const dbconfig_1 = require("../dbconfig"); // Adjust if needed
(0, dotenv_1.config)(); // Load .env
mail_1.default.setApiKey(process.env.MAILERKEY || '');
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const router = (0, express_1.Router)();
// ===== AUTH ROUTES =====
// Signup route
router.post('/signup', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { email, name, password, region } = req.body;
        if (!email || !name || !password || !region) {
            return res.status(400).json({ message: 'All fields are required' });
        }
        const [existingUsers] = yield dbconfig_1.pool.query('SELECT * FROM Users WHERE userID = ?', [email]);
        if (existingUsers.length > 0) {
            return res.status(409).json({ message: 'User already exists' });
        }
        const hashedPassword = yield bcrypt_1.default.hash(password, 10);
        const verificationToken = (0, uuid_1.v4)();
        const accountCreated = new Date();
        yield dbconfig_1.pool.query(`INSERT INTO Users 
       (userID, name, password, accountCreated, totalEntries, region, isEditor, isVerified, verificationToken) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`, [email, name, hashedPassword, accountCreated, 0, region, false, false, verificationToken]);
        const verificationUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/verify?token=${verificationToken}`;
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
        yield mail_1.default.send(msg);
        const token = jsonwebtoken_1.default.sign({ userID: email, name, accountCreated, totalEntries: 0, region, isEditor: false, isVerified: false }, JWT_SECRET, { expiresIn: '24h' });
        res.status(201).json({
            message: 'User created successfully. Please verify your email.',
            token,
            user: { userID: email, name, accountCreated, totalEntries: 0, region, isEditor: false, isVerified: false }
        });
    }
    catch (error) {
        console.error('Signup error:', error);
        res.status(500).json({ message: 'Server error during signup' });
    }
}));
// Login route
router.post('/login', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ message: 'Email and password are required' });
        }
        const [users] = yield dbconfig_1.pool.query('SELECT * FROM Users WHERE userID = ?', [email]);
        if (users.length === 0 || !(yield bcrypt_1.default.compare(password, users[0].password))) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }
        const user = users[0];
        if (!user.isVerified) {
            return res.status(403).json({ message: 'Please verify your email before logging in' });
        }
        const token = jsonwebtoken_1.default.sign({
            userID: user.userID,
            name: user.name,
            accountCreated: user.accountCreated,
            userIndex: user.userIndex,
            totalEntries: user.totalEntries,
            region: user.region,
            isEditor: user.isEditor,
            isVerified: user.isVerified
        }, JWT_SECRET, { expiresIn: '7d' });
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
    }
    catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Server error during login' });
    }
}));
// Email verification route
router.get('/verify', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { token } = req.query;
        if (!token || typeof token !== 'string') {
            return res.status(400).json({ message: 'Invalid verification token' });
        }
        const [users] = yield dbconfig_1.pool.query('SELECT * FROM Users WHERE verificationToken = ?', [token]);
        if (users.length === 0) {
            return res.status(400).json({ message: 'Invalid token' });
        }
        yield dbconfig_1.pool.query('UPDATE Users SET isVerified = TRUE, verificationToken = NULL WHERE userID = ?', [users[0].userID]);
        res.status(200).json({ message: 'Email verified. You can now login.' });
    }
    catch (error) {
        console.error('Verification error:', error);
        res.status(500).json({ message: 'Server error during verification' });
    }
}));
// Forgot password
router.post('/forgot-password', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { email } = req.body;
        if (!email) {
            return res.status(400).json({ message: 'Email is required' });
        }
        const [users] = yield dbconfig_1.pool.query('SELECT * FROM Users WHERE userID = ?', [email]);
        if (users.length === 0) {
            return res.status(200).json({ message: 'If registered, a reset link will be sent.' });
        }
        const resetToken = (0, uuid_1.v4)();
        const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour
        yield dbconfig_1.pool.query('UPDATE Users SET resetToken = ?, resetTokenExpiry = ? WHERE userID = ?', [resetToken, resetTokenExpiry, email]);
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
        yield mail_1.default.send(msg);
        res.status(200).json({ message: 'If registered, a reset link will be sent.' });
    }
    catch (error) {
        console.error('Forgot password error:', error);
        res.status(500).json({ message: 'Server error during reset request' });
    }
}));
// Reset password
router.post('/reset-password', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { token, newPassword } = req.body;
        if (!token || !newPassword) {
            return res.status(400).json({ message: 'Token and password required' });
        }
        const [users] = yield dbconfig_1.pool.query('SELECT * FROM Users WHERE resetToken = ? AND resetTokenExpiry > NOW()', [token]);
        if (users.length === 0) {
            return res.status(400).json({ message: 'Invalid or expired token' });
        }
        const hashedPassword = yield bcrypt_1.default.hash(newPassword, 10);
        yield dbconfig_1.pool.query('UPDATE Users SET password = ?, resetToken = NULL, resetTokenExpiry = NULL WHERE userID = ?', [hashedPassword, users[0].userID]);
        res.status(200).json({ message: 'Password has been reset. You can now login.' });
    }
    catch (error) {
        console.error('Reset password error:', error);
        res.status(500).json({ message: 'Server error during password reset' });
    }
}));
exports.default = router;
