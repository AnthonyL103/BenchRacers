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
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const dbconfig_1 = require("../dbconfig");
(0, dotenv_1.config)();
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const router = (0, express_1.Router)();
const authenticateAdmin = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'Authentication required' });
    }
    const token = authHeader.split(' ')[1];
    try {
        const decoded = jsonwebtoken_1.default.verify(token, JWT_SECRET);
        req.user = decoded;
        const [users] = yield dbconfig_1.pool.query('SELECT isEditor FROM Users WHERE userEmail = ?', [decoded.userEmail]);
        if (users.length === 0 || !users[0].isEditor) {
            return res.status(403).json({ message: 'Access denied: Admin privileges required' });
        }
        next();
    }
    catch (error) {
        return res.status(401).json({ message: 'Invalid or expired token' });
    }
});
router.get('/reset', authenticateAdmin, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield dbconfig_1.pool.query('CALL ResetCarShareDB();');
        res.status(200).json({
            success: true,
            message: 'Database reset successfully'
        });
    }
    catch (error) {
        console.error('Error resetting database:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to reset database',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
}));
router.get('/users', authenticateAdmin, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { search, region, orderByDate, orderByName } = req.query;
        let query = `
      SELECT userEmail, name, region, accountCreated, totalEntries, isVerified, isEditor
      FROM Users
      WHERE 1=1
    `;
        const queryParams = [];
        if (search) {
            query += ` AND (userEmail LIKE ? OR name LIKE ?)`;
            queryParams.push(`%${search}%`, `%${search}%`);
        }
        if (region && region !== 'false') {
            query += ` AND region = ?`;
            queryParams.push(region);
        }
        if (orderByDate && orderByDate !== 'false') {
            query += ` ORDER BY accountCreated DESC`;
        }
        else if (orderByName && orderByName !== 'false') {
            query += ` ORDER BY name ASC`;
        }
        else {
            query += ` ORDER BY accountCreated DESC`;
        }
        const [users] = yield dbconfig_1.pool.query(query, queryParams);
        res.status(200).json({
            success: true,
            users
        });
    }
    catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch users',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
}));
router.get('/users/:email', authenticateAdmin, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { email } = req.params;
        const [users] = yield dbconfig_1.pool.query(`SELECT userEmail, name, region, accountCreated, totalEntries, isVerified, isEditor
       FROM Users
       WHERE userEmail = ?`, [email]);
        if (users.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }
        res.status(200).json({
            success: true,
            user: users[0]
        });
    }
    catch (error) {
        console.error('Error fetching user:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch user',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
}));
router.post('/addusers', authenticateAdmin, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const connection = yield dbconfig_1.pool.getConnection();
    try {
        yield connection.beginTransaction();
        const { email, name, password, region, isVerified, isEditor } = req.body;
        if (!email || !name || !password || !region) {
            connection.release();
            return res.status(400).json({
                success: false,
                message: 'Missing required fields: email, name, password, and region are required'
            });
        }
        const [existingUsers] = yield connection.query('SELECT userEmail FROM Users WHERE userEmail = ?', [email]);
        if (existingUsers.length > 0) {
            connection.release();
            return res.status(409).json({
                success: false,
                message: 'User with this email already exists'
            });
        }
        yield connection.query(`INSERT INTO Users 
       (userEmail, name, password, region, accountCreated, totalEntries, isVerified, isEditor)
       VALUES (?, ?, ?, ?, NOW(), 0, ?, ?)`, [email, name, password, region, isVerified || false, isEditor || false]);
        yield connection.commit();
        res.status(201).json({
            success: true,
            message: 'User created successfully'
        });
    }
    catch (error) {
        yield connection.rollback();
        console.error('Error creating user:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create user',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
    finally {
        connection.release();
    }
}));
router.put('/updateusers/:email', authenticateAdmin, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const connection = yield dbconfig_1.pool.getConnection();
    try {
        yield connection.beginTransaction();
        const { email } = req.params;
        const { name, password, region, isVerified, isEditor } = req.body;
        const [existingUsers] = yield connection.query('SELECT userEmail FROM Users WHERE userEmail = ?', [email]);
        if (existingUsers.length === 0) {
            connection.release();
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }
        let query = 'UPDATE Users SET ';
        const queryParams = [];
        const updateFields = [];
        if (name) {
            updateFields.push('name = ?');
            queryParams.push(name);
        }
        if (password) {
            updateFields.push('password = ?');
            queryParams.push(password);
        }
        if (region) {
            updateFields.push('region = ?');
            queryParams.push(region);
        }
        if (isVerified !== undefined) {
            updateFields.push('isVerified = ?');
            queryParams.push(isVerified);
        }
        if (isEditor !== undefined) {
            updateFields.push('isEditor = ?');
            queryParams.push(isEditor);
        }
        if (updateFields.length === 0) {
            connection.release();
            return res.status(400).json({
                success: false,
                message: 'No fields to update'
            });
        }
        query += updateFields.join(', ');
        query += ' WHERE userEmail = ?';
        queryParams.push(email);
        yield connection.query(query, queryParams);
        yield connection.commit();
        res.status(200).json({
            success: true,
            message: 'User updated successfully'
        });
    }
    catch (error) {
        yield connection.rollback();
        console.error('Error updating user:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update user',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
    finally {
        connection.release();
    }
}));
router.delete('/delusers/:email', authenticateAdmin, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const connection = yield dbconfig_1.pool.getConnection();
    try {
        yield connection.beginTransaction();
        const { email } = req.params;
        const [existingUsers] = yield connection.query('SELECT userEmail FROM Users WHERE userEmail = ?', [email]);
        if (existingUsers.length === 0) {
            connection.release();
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }
        yield connection.query('DELETE FROM Users WHERE userEmail = ?', [email]);
        yield connection.commit();
        res.status(200).json({
            success: true,
            message: 'User deleted successfully'
        });
    }
    catch (error) {
        yield connection.rollback();
        console.error('Error deleting user:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete user',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
    finally {
        connection.release();
    }
}));
router.get('/entries', authenticateAdmin, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { search, region, category, noMods } = req.query;
        let query = `
      SELECT e.entryID, e.userEmail, e.carName, e.carColor, e.carMake, e.carModel, 
             e.carYear, e.totalCost, e.upvotes, e.category, e.region
      FROM Entries e
      WHERE 1=1
    `;
        const queryParams = [];
        if (search) {
            query += ` AND (e.userEmail LIKE ? OR e.carName LIKE ? OR e.carMake LIKE ? OR e.carModel LIKE ?)`;
            queryParams.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
        }
        if (region && region !== 'false') {
            query += ` AND e.region = ?`;
            queryParams.push(region);
        }
        if (category && category !== 'false') {
            query += ` AND e.category = ?`;
            queryParams.push(category);
        }
        if (noMods && noMods !== 'false') {
            query += ` AND e.totalMods = 0`;
        }
        query += ` ORDER BY e.createdAt DESC`;
        const [entries] = yield dbconfig_1.pool.query(query, queryParams);
        res.status(200).json({
            success: true,
            entries
        });
    }
    catch (error) {
        console.error('Error fetching entries:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch entries',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
}));
router.get('/entries/:id', authenticateAdmin, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const [results] = yield dbconfig_1.pool.query(`
      SELECT 
        e.entryID, e.userEmail, e.carName, e.carMake, e.carModel, e.carYear, 
        e.carColor, e.description, e.totalMods, e.totalCost, e.category,
        e.region, e.upvotes, e.engine, e.transmission, e.drivetrain,
        e.horsepower, e.torque, e.viewCount, e.createdAt, e.updatedAt,
        p.s3Key as mainPhotoKey,
        GROUP_CONCAT(DISTINCT ap.photoID) as photoIDs,
        GROUP_CONCAT(DISTINCT ap.s3Key) as allPhotoKeys,
        GROUP_CONCAT(DISTINCT ap.isMainPhoto) as photoMainFlags,
        GROUP_CONCAT(DISTINCT t.tagName) as tags
      FROM Entries e
      LEFT JOIN EntryPhotos p ON e.entryID = p.entryID AND p.isMainPhoto = TRUE
      LEFT JOIN EntryPhotos ap ON e.entryID = ap.entryID
      LEFT JOIN EntryTags et ON e.entryID = et.entryID
      LEFT JOIN Tags t ON et.tagID = t.tagID
      WHERE e.entryID = ?
      GROUP BY e.entryID
    `, [id]);
        if (results.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Entry not found'
            });
        }
        const entry = results[0];
        if (entry.photoIDs && entry.allPhotoKeys) {
            const photoIDs = entry.photoIDs.split(',');
            const photoKeys = entry.allPhotoKeys.split(',');
            const photoMainFlags = entry.photoMainFlags.split(',').map((flag) => flag === '1');
            entry.photos = photoIDs.map((id, index) => ({
                photoID: parseInt(id),
                s3Key: photoKeys[index],
                isMainPhoto: photoMainFlags[index]
            }));
            entry.allPhotoKeys = photoKeys;
        }
        else {
            entry.photos = [];
            entry.allPhotoKeys = [];
        }
        entry.tags = entry.tags ? entry.tags.split(',') : [];
        const [mods] = yield dbconfig_1.pool.query(`
      SELECT m.modID, m.brand, m.category, m.cost, m.description, m.link
      FROM EntryMods em
      JOIN Mods m ON em.modID = m.modID
      WHERE em.entryID = ?
    `, [id]);
        entry.mods = mods || [];
        res.status(200).json({
            success: true,
            entry
        });
    }
    catch (error) {
        console.error('Error fetching entry details:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch entry details',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
}));
router.post('/addentries', authenticateAdmin, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const connection = yield dbconfig_1.pool.getConnection();
    try {
        yield connection.beginTransaction();
        const { email, carName, carMake, carModel, carYear, carColor, description, totalCost, category, region, engine, transmission, drivetrain, horsepower, torque, photos, tags, mods } = req.body;
        if (!email || !carName || !carMake || !carModel || !category || !region) {
            connection.release();
            return res.status(400).json({
                success: false,
                message: 'Missing required fields'
            });
        }
        const [users] = yield connection.query('SELECT userEmail FROM Users WHERE userEmail = ?', [email]);
        if (users.length === 0) {
            connection.release();
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }
        const totalMods = mods && Array.isArray(mods) ? mods.length : 0;
        const [result] = yield connection.query(`INSERT INTO Entries 
       (userEmail, carName, carMake, carModel, carYear, carColor, description,
        totalMods, totalCost, category, region, engine, transmission, drivetrain,
        horsepower, torque)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [
            email, carName, carMake, carModel, carYear || null, carColor || null,
            description || null, totalMods, totalCost || 0, category, region,
            engine || null, transmission || null, drivetrain || null,
            horsepower || null, torque || null
        ]);
        const entryID = result.insertId;
        if (photos && Array.isArray(photos) && photos.length > 0) {
            const photoValues = photos.map((photo) => [
                entryID,
                photo.s3Key,
                photo.isMainPhoto || false
            ]);
            yield connection.query(`INSERT INTO EntryPhotos (entryID, s3Key, isMainPhoto)
         VALUES ?`, [photoValues]);
        }
        if (mods && Array.isArray(mods) && mods.length > 0) {
            const modValues = mods.map((modId) => [entryID, modId]);
            yield connection.query('INSERT INTO EntryMods (entryID, modID) VALUES ?', [modValues]);
        }
        if (tags && Array.isArray(tags) && tags.length > 0) {
            for (const tagName of tags) {
                const [existingTags] = yield connection.query('SELECT tagID FROM Tags WHERE tagName = ?', [tagName]);
                let tagID;
                if (existingTags.length > 0) {
                    tagID = existingTags[0].tagID;
                }
                else {
                    const [tagResult] = yield connection.query('INSERT INTO Tags (tagName) VALUES (?)', [tagName]);
                    tagID = tagResult.insertId;
                }
                yield connection.query('INSERT INTO EntryTags (entryID, tagID) VALUES (?, ?)', [entryID, tagID]);
            }
        }
        yield connection.query('UPDATE Users SET totalEntries = totalEntries + 1 WHERE userEmail = ?', [email]);
        yield connection.commit();
        res.status(201).json({
            success: true,
            message: 'Entry created successfully',
            entryID
        });
    }
    catch (error) {
        yield connection.rollback();
        console.error('Error creating entry:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create entry',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
    finally {
        connection.release();
    }
}));
router.put('/updateentries/:id', authenticateAdmin, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const connection = yield dbconfig_1.pool.getConnection();
    try {
        yield connection.beginTransaction();
        const { id } = req.params;
        const { email, carName, carMake, carModel, carYear, carColor, description, totalCost, category, region, engine, transmission, drivetrain, horsepower, torque, photos, tags, mods } = req.body;
        const [existingEntries] = yield connection.query('SELECT entryID, userEmail FROM Entries WHERE entryID = ?', [id]);
        if (existingEntries.length === 0) {
            connection.release();
            return res.status(404).json({
                success: false,
                message: 'Entry not found'
            });
        }
        const originalEmail = existingEntries[0].userEmail;
        const emailChanged = email && email !== originalEmail;
        if (emailChanged) {
            const [users] = yield connection.query('SELECT userEmail FROM Users WHERE userEmail = ?', [email]);
            if (users.length === 0) {
                connection.release();
                return res.status(404).json({
                    success: false,
                    message: 'New user not found'
                });
            }
        }
        const totalMods = mods && Array.isArray(mods) ? mods.length : 0;
        yield connection.query(`UPDATE Entries 
       SET userEmail = ?, carName = ?, carMake = ?, carModel = ?, carYear = ?, 
           carColor = ?, description = ?, totalMods = ?, totalCost = ?, 
           category = ?, region = ?, engine = ?, transmission = ?, 
           drivetrain = ?, horsepower = ?, torque = ?
       WHERE entryID = ?`, [
            email || originalEmail, carName, carMake, carModel, carYear || null,
            carColor || null, description || null, totalMods, totalCost || 0,
            category, region, engine || null, transmission || null,
            drivetrain || null, horsepower || null, torque || null, id
        ]);
        if (photos && Array.isArray(photos)) {
            yield connection.query('DELETE FROM EntryPhotos WHERE entryID = ?', [id]);
            if (photos.length > 0) {
                const photoValues = photos.map((photo) => [
                    id,
                    photo.s3Key,
                    photo.isMainPhoto || false
                ]);
                yield connection.query(`INSERT INTO EntryPhotos (entryID, s3Key, isMainPhoto)
           VALUES ?`, [photoValues]);
            }
        }
        if (mods && Array.isArray(mods)) {
            yield connection.query('DELETE FROM EntryMods WHERE entryID = ?', [id]);
            if (mods.length > 0) {
                const modValues = mods.map((modId) => [id, modId]);
                yield connection.query('INSERT INTO EntryMods (entryID, modID) VALUES ?', [modValues]);
            }
        }
        if (tags && Array.isArray(tags)) {
            yield connection.query('DELETE FROM EntryTags WHERE entryID = ?', [id]);
            if (tags.length > 0) {
                for (const tagName of tags) {
                    const [existingTags] = yield connection.query('SELECT tagID FROM Tags WHERE tagName = ?', [tagName]);
                    let tagID;
                    if (existingTags.length > 0) {
                        tagID = existingTags[0].tagID;
                    }
                    else {
                        const [tagResult] = yield connection.query('INSERT INTO Tags (tagName) VALUES (?)', [tagName]);
                        tagID = tagResult.insertId;
                    }
                    yield connection.query('INSERT INTO EntryTags (entryID, tagID) VALUES (?, ?)', [id, tagID]);
                }
            }
        }
        if (emailChanged) {
            yield connection.query('UPDATE Users SET totalEntries = totalEntries - 1 WHERE userEmail = ?', [originalEmail]);
            yield connection.query('UPDATE Users SET totalEntries = totalEntries + 1 WHERE userEmail = ?', [email]);
        }
        yield connection.commit();
        res.status(200).json({
            success: true,
            message: 'Entry updated successfully'
        });
    }
    catch (error) {
        yield connection.rollback();
        console.error('Error updating entry:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update entry',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
    finally {
        connection.release();
    }
}));
router.delete('/delentries/:id', authenticateAdmin, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const connection = yield dbconfig_1.pool.getConnection();
    try {
        yield connection.beginTransaction();
        const { id } = req.params;
        const [existingEntries] = yield connection.query('SELECT entryID, userEmail FROM Entries WHERE entryID = ?', [id]);
        if (existingEntries.length === 0) {
            connection.release();
            return res.status(404).json({
                success: false,
                message: 'Entry not found'
            });
        }
        const userEmail = existingEntries[0].userEmail;
        yield connection.query('DELETE FROM Entries WHERE entryID = ?', [id]);
        yield connection.query('UPDATE Users SET totalEntries = GREATEST(totalEntries - 1, 0) WHERE userEmail = ?', [userEmail]);
        yield connection.commit();
        res.status(200).json({
            success: true,
            message: 'Entry deleted successfully'
        });
    }
    catch (error) {
        yield connection.rollback();
        console.error('Error deleting entry:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete entry',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
    finally {
        connection.release();
    }
}));
router.get('/mods', authenticateAdmin, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { search, category, brand, usedByEntry } = req.query;
        let query = `
      SELECT m.modID, m.brand, m.category, m.cost, m.description, m.link
      FROM Mods m
    `;
        const queryParams = [];
        if (usedByEntry && usedByEntry !== 'false') {
            query = `
        SELECT m.modID, m.brand, m.category, m.cost, m.description, m.link, e.entryID
        FROM Mods m
        JOIN EntryMods em ON m.modID = em.modID
        JOIN Entries e ON em.entryID = e.entryID
      `;
        }
        query += ` WHERE 1=1`;
        if (search) {
            query += ` AND (m.brand LIKE ? OR m.description LIKE ?)`;
            queryParams.push(`%${search}%`, `%${search}%`);
        }
        if (category && category !== 'false') {
            query += ` AND m.category = ?`;
            queryParams.push(category);
        }
        if (brand && brand !== 'false') {
            query += ` AND m.brand = ?`;
            queryParams.push(brand);
        }
        query += ` ORDER BY m.brand, m.category`;
        const [mods] = yield dbconfig_1.pool.query(query, queryParams);
        res.status(200).json({
            success: true,
            mods
        });
    }
    catch (error) {
        console.error('Error fetching mods:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch mods',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
}));
router.get('/mods/:id', authenticateAdmin, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const [mods] = yield dbconfig_1.pool.query(`SELECT modID, brand, category, cost, description, link
       FROM Mods
       WHERE modID = ?`, [id]);
        if (mods.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Mod not found'
            });
        }
        const [entries] = yield dbconfig_1.pool.query(`
      SELECT e.entryID, e.carName, e.carMake, e.carModel
      FROM Entries e
      JOIN EntryMods em ON e.entryID = em.entryID
      WHERE em.modID = ?
    `, [id]);
        const mod = Object.assign(Object.assign({}, mods[0]), { entries: entries || [] });
        res.status(200).json({
            success: true,
            mod
        });
    }
    catch (error) {
        console.error('Error fetching mod details:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch mod details',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
}));
router.post('/addmods', authenticateAdmin, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        console.log('Creating mod:', req.body);
        const { brand, category, cost, description, link } = req.body;
        if (!brand || !category || cost === undefined || !link) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields: brand, category, cost, and link are required'
            });
        }
        yield dbconfig_1.pool.query(`INSERT INTO Mods (brand, category, cost, description, link)
       VALUES (?, ?, ?, ?, ?)`, [brand, category, cost, description || '', link]);
        res.status(201).json({
            success: true,
            message: 'Mod created successfully'
        });
    }
    catch (error) {
        console.error('Error creating mod:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create mod',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
}));
router.put('/updatemods/:id', authenticateAdmin, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const { brand, category, cost, description, link } = req.body;
        if (!brand || !category || cost === undefined || !link) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields: brand, category, cost, and link are required'
            });
        }
        const [existingMods] = yield dbconfig_1.pool.query('SELECT modID FROM Mods WHERE modID = ?', [id]);
        if (existingMods.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Mod not found'
            });
        }
        yield dbconfig_1.pool.query(`UPDATE Mods 
       SET brand = ?, category = ?, cost = ?, description = ?, link = ?
       WHERE modID = ?`, [brand, category, cost, description || '', link, id]);
        res.status(200).json({
            success: true,
            message: 'Mod updated successfully'
        });
    }
    catch (error) {
        console.error('Error updating mod:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update mod',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
}));
router.delete('/delmods/:id', authenticateAdmin, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const connection = yield dbconfig_1.pool.getConnection();
    try {
        yield connection.beginTransaction();
        const { id } = req.params;
        const [existingMods] = yield connection.query('SELECT modID FROM Mods WHERE modID = ?', [id]);
        if (existingMods.length === 0) {
            connection.release();
            return res.status(404).json({
                success: false,
                message: 'Mod not found'
            });
        }
        yield connection.query('DELETE FROM EntryMods WHERE modID = ?', [id]);
        yield connection.query('DELETE FROM Mods WHERE modID = ?', [id]);
        yield connection.commit();
        res.status(200).json({
            success: true,
            message: 'Mod deleted successfully'
        });
    }
    catch (error) {
        yield connection.rollback();
        console.error('Error deleting mod:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete mod',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
    finally {
        connection.release();
    }
}));
router.get('/photos', authenticateAdmin, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { search, mainOnly } = req.query;
        let query = `
      SELECT photoID, entryID, s3Key, isMainPhoto, uploadDate
      FROM EntryPhotos
      WHERE 1=1
    `;
        const params = [];
        if (search) {
            query += ` AND s3Key LIKE ?`;
            params.push(`%${search}%`);
        }
        if (mainOnly && mainOnly !== 'false') {
            query += ` AND isMainPhoto = TRUE`;
        }
        query += ` ORDER BY uploadDate DESC`;
        const [photos] = yield dbconfig_1.pool.query(query, params);
        res.status(200).json({ success: true, photos });
    }
    catch (error) {
        console.error("Error fetching photos:", error);
        res.status(500).json({ success: false, message: "Failed to fetch photos" });
    }
}));
router.post('/addphotos', authenticateAdmin, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { entryID, s3Key, isMainPhoto = false } = req.body;
        if (!entryID || !s3Key) {
            return res.status(400).json({ success: false, message: 'Missing required fields: entryID and s3Key are required' });
        }
        yield dbconfig_1.pool.query(`INSERT INTO EntryPhotos (entryID, s3Key, isMainPhoto, uploadDate)
       VALUES (?, ?, ?, NOW())`, [entryID, s3Key, isMainPhoto]);
        res.status(201).json({ success: true, message: 'Photo added successfully' });
    }
    catch (error) {
        console.error('Error adding photo:', error);
        res.status(500).json({ success: false, message: 'Failed to add photo' });
    }
}));
router.put('/updatephotos/:id', authenticateAdmin, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const { s3Key, isMainPhoto, uploadDate } = req.body;
        yield dbconfig_1.pool.query(`UPDATE EntryPhotos
       SET s3Key = ?, isMainPhoto = ?, uploadDate = ?
       WHERE photoID = ?`, [s3Key, !!isMainPhoto, uploadDate, id]);
        res.status(200).json({ success: true, message: 'Photo updated successfully' });
    }
    catch (error) {
        console.error('Error updating photo:', error);
        res.status(500).json({ success: false, message: 'Failed to update photo' });
    }
}));
router.delete('/delphotos/:id', authenticateAdmin, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        yield dbconfig_1.pool.query('DELETE FROM EntryPhotos WHERE photoID = ?', [id]);
        res.status(200).json({ success: true, message: 'Photo deleted successfully' });
    }
    catch (error) {
        console.error('Error deleting photo:', error);
        res.status(500).json({ success: false, message: 'Failed to delete photo' });
    }
}));
router.get('/tags', authenticateAdmin, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const [tags] = yield dbconfig_1.pool.query(`
      SELECT t.tagID, t.tagName, COUNT(et.entryID) AS entryCount
      FROM Tags t
      LEFT JOIN EntryTags et ON t.tagID = et.tagID
      GROUP BY t.tagID
      ORDER BY t.tagName ASC
    `);
        res.status(200).json({ success: true, tags });
    }
    catch (error) {
        console.error("Error fetching tags:", error);
        res.status(500).json({ success: false, message: "Failed to fetch tags" });
    }
}));
router.post('/addtags', authenticateAdmin, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { tagName } = req.body;
        if (!tagName) {
            return res.status(400).json({ success: false, message: 'Tag name is required' });
        }
        yield dbconfig_1.pool.query('INSERT INTO Tags (tagName) VALUES (?)', [tagName]);
        res.status(201).json({ success: true, message: 'Tag added successfully' });
    }
    catch (error) {
        console.error('Error adding tag:', error);
        res.status(500).json({ success: false, message: 'Failed to add tag' });
    }
}));
router.put('/updatetags/:id', authenticateAdmin, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const { tagName } = req.body;
        yield dbconfig_1.pool.query(`UPDATE Tags SET tagName = ? WHERE tagID = ?`, [tagName, id]);
        res.status(200).json({ success: true, message: 'Tag updated successfully' });
    }
    catch (error) {
        console.error('Error updating tag:', error);
        res.status(500).json({ success: false, message: 'Failed to update tag' });
    }
}));
router.delete('/deltags/:id', authenticateAdmin, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        yield dbconfig_1.pool.query('DELETE FROM Tags WHERE tagID = ?', [id]);
        res.status(200).json({ success: true, message: 'Tag deleted successfully' });
    }
    catch (error) {
        console.error('Error deleting tag:', error);
        res.status(500).json({ success: false, message: 'Failed to delete tag' });
    }
}));
router.get('/awards', authenticateAdmin, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { search, type, user } = req.query;
        let query = `
      SELECT awardID, userEmail, awardType, awardDate
      FROM Awards
      WHERE 1=1
    `;
        const params = [];
        if (search) {
            query += ` AND (userEmail LIKE ? OR awardType LIKE ?)`;
            params.push(`%${search}%`, `%${search}%`);
        }
        if (type && type !== 'false') {
            query += ` AND awardType = ?`;
            params.push(type);
        }
        if (user && user !== 'false') {
            query += ` AND userEmail = ?`;
            params.push(user);
        }
        query += ` ORDER BY awardDate DESC`;
        const [awards] = yield dbconfig_1.pool.query(query, params);
        res.status(200).json({ success: true, awards });
    }
    catch (error) {
        console.error("Error fetching awards:", error);
        res.status(500).json({ success: false, message: "Failed to fetch awards" });
    }
}));
router.post('/addawards', authenticateAdmin, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { userEmail, awardType, awardDate } = req.body;
        if (!userEmail || !awardType || !awardDate) {
            return res.status(400).json({ success: false, message: 'Missing required fields: userEmail, awardType, and awardDate are required' });
        }
        yield dbconfig_1.pool.query(`INSERT INTO Awards (userEmail, awardType, awardDate)
       VALUES (?, ?, ?)`, [userEmail, awardType, awardDate]);
        res.status(201).json({ success: true, message: 'Award added successfully' });
    }
    catch (error) {
        console.error('Error adding award:', error);
        res.status(500).json({ success: false, message: 'Failed to add award' });
    }
}));
router.put('/updateawards/:id', authenticateAdmin, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const { userEmail, awardType, awardDate } = req.body;
        yield dbconfig_1.pool.query(`UPDATE Awards
       SET userEmail = ?, awardType = ?, awardDate = ?
       WHERE awardID = ?`, [userEmail, awardType, awardDate, id]);
        res.status(200).json({ success: true, message: 'Award updated successfully' });
    }
    catch (error) {
        console.error('Error updating award:', error);
        res.status(500).json({ success: false, message: 'Failed to update award' });
    }
}));
router.delete('/delawards/:id', authenticateAdmin, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        yield dbconfig_1.pool.query('DELETE FROM Awards WHERE awardID = ?', [id]);
        res.status(200).json({ success: true, message: 'Award deleted successfully' });
    }
    catch (error) {
        console.error('Error deleting award:', error);
        res.status(500).json({ success: false, message: 'Failed to delete award' });
    }
}));
exports.default = router;
