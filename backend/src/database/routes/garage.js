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
// Optimized Garage Routes - Query Optimization Only
const express_1 = require("express");
const dotenv_1 = require("dotenv");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const dbconfig_1 = require("../dbconfig");
const aws_sdk_1 = __importDefault(require("aws-sdk"));
(0, dotenv_1.config)();
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const s3 = new aws_sdk_1.default.S3({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION || 'us-east-1'
});
const BUCKET_NAME = process.env.S3_BUCKET_NAME || 'your-bucket-name';
const router = (0, express_1.Router)();
const authenticateUser = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'Authentication required' });
    }
    const token = authHeader.split(' ')[1];
    try {
        const decoded = jsonwebtoken_1.default.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    }
    catch (error) {
        return res.status(401).json({ message: 'Invalid or expired token' });
    }
};
router.get('/s3/presigned-url', authenticateUser, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { fileName, fileType } = req.query;
        if (!fileName || !fileType || typeof fileName !== 'string' || typeof fileType !== 'string') {
            return res.status(400).json({
                success: false,
                message: 'fileName and fileType are required as query parameters'
            });
        }
        const user = req.user;
        const key = `users/${user.userEmail}/${Date.now()}-${fileName.replace(/\s+/g, '_')}`;
        const presignedUrl = s3.getSignedUrl('putObject', {
            Bucket: BUCKET_NAME,
            Key: key,
            ContentType: fileType,
            Expires: 300
        });
        res.status(200).json({
            success: true,
            url: presignedUrl,
            key: key
        });
    }
    catch (error) {
        console.error('Error generating presigned URL:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to generate presigned URL',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
}));
router.put('/update/:entryID', authenticateUser, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const connection = yield dbconfig_1.pool.getConnection();
    try {
        yield connection.beginTransaction();
        const user = req.user;
        const entryID = parseInt(req.params.entryID);
        if (!entryID || isNaN(entryID)) {
            connection.release();
            return res.status(400).json({
                success: false,
                message: 'Invalid entry ID'
            });
        }
        const { carName, carMake, carModel, carYear, carColor, carTrim, description, totalMods, totalCost, category, region, engine, transmission, drivetrain, horsepower, torque, photos, tags, mods, } = req.body;
        if (!carName || !carMake || !carModel || !carTrim || !category || !region) {
            connection.release();
            return res.status(400).json({
                success: false,
                message: 'Missing required fields'
            });
        }
        if (!photos || !Array.isArray(photos) || photos.length === 0) {
            connection.release();
            return res.status(400).json({
                success: false,
                message: 'At least one photo is required'
            });
        }
        const [existingEntry] = yield connection.query('SELECT entryID FROM Entries WHERE entryID = ? AND userEmail = ?', [entryID, user.userEmail]);
        if (!existingEntry || existingEntry.length === 0) {
            connection.release();
            return res.status(404).json({
                success: false,
                message: 'Car entry not found or you do not have permission to update it'
            });
        }
        yield connection.query(`UPDATE Entries SET 
        carName = ?, carMake = ?, carModel = ?, carYear = ?, carColor = ?, carTrim = ?,
        description = ?, totalMods = ?, totalCost = ?, category = ?, 
        region = ?, engine = ?, transmission = ?, drivetrain = ?,
        horsepower = ?, torque = ?, updatedAt = NOW()
       WHERE entryID = ? AND userEmail = ?`, [
            carName, carMake, carModel, carYear || null, carColor || null, carTrim || null,
            description || null, totalMods || 0, totalCost || 0, category, region,
            engine || null, transmission || null, drivetrain || null,
            horsepower || null, torque || null, entryID, user.userEmail
        ]);
        yield connection.query('DELETE FROM EntryPhotos WHERE entryID = ?', [entryID]);
        if (photos.length > 0) {
            const photoValues = photos.map((photo) => [
                entryID,
                photo.s3Key,
                photo.isMainPhoto || false
            ]);
            yield connection.query(`INSERT INTO EntryPhotos (entryID, s3Key, isMainPhoto)
         VALUES ?`, [photoValues]);
        }
        yield connection.query('DELETE FROM EntryMods WHERE entryID = ?', [entryID]);
        if (mods && Array.isArray(mods) && mods.length > 0) {
            const modValues = mods.map((modId) => [entryID, modId]);
            yield connection.query('INSERT INTO EntryMods (entryID, modID) VALUES ?', [modValues]);
        }
        yield connection.query('DELETE FROM EntryTags WHERE entryID = ?', [entryID]);
        if (tags && Array.isArray(tags) && tags.length > 0) {
            const [existingTags] = yield connection.query('SELECT tagID, tagName FROM Tags WHERE tagName IN (?)', [tags]);
            const existingTagsMap = new Map();
            existingTags.forEach((tag) => {
                existingTagsMap.set(tag.tagName, tag.tagID);
            });
            const tagsToCreate = tags.filter((tag) => !existingTagsMap.has(tag));
            if (tagsToCreate.length > 0) {
                const tagInsertValues = tagsToCreate.map((tag) => [tag]);
                const [tagResult] = yield connection.query('INSERT INTO Tags (tagName) VALUES ?', [tagInsertValues]);
                let newTagId = tagResult.insertId;
                tagsToCreate.forEach((tag) => {
                    existingTagsMap.set(tag, newTagId++);
                });
            }
            const tagAssociationValues = [];
            for (const tag of tags) {
                const tagID = existingTagsMap.get(tag);
                if (tagID) {
                    tagAssociationValues.push([entryID, tagID]);
                }
            }
            if (tagAssociationValues.length > 0) {
                yield connection.query('INSERT INTO EntryTags (entryID, tagID) VALUES ?', [tagAssociationValues]);
            }
        }
        yield connection.commit();
        const [results] = yield dbconfig_1.pool.query(`
      SELECT 
        e.entryID, e.userEmail, e.carName, e.carMake, e.carModel, e.carYear, 
        e.carColor, e.carTrim, e.description, e.totalMods, e.totalCost, e.category,
        e.region, e.upvotes, e.engine, e.transmission, e.drivetrain,
        e.horsepower, e.torque, e.viewCount, e.createdAt, e.updatedAt,
        p.s3Key as mainPhotoKey,
        GROUP_CONCAT(DISTINCT ap.s3Key) as allPhotoKeys,
        GROUP_CONCAT(DISTINCT t.tagName) as tags
      FROM Entries e
      LEFT JOIN EntryPhotos p ON e.entryID = p.entryID AND p.isMainPhoto = TRUE
      LEFT JOIN EntryPhotos ap ON e.entryID = ap.entryID
      LEFT JOIN EntryTags et ON e.entryID = et.entryID
      LEFT JOIN Tags t ON et.tagID = t.tagID
      WHERE e.entryID = ?
      GROUP BY e.entryID
    `, [entryID]);
        const car = results[0];
        car.allPhotoKeys = car.allPhotoKeys ? car.allPhotoKeys.split(',') : [];
        car.tags = car.tags ? car.tags.split(',') : [];
        const [modResults] = yield dbconfig_1.pool.query(`
      SELECT m.modID, m.brand, m.cost, m.description, m.category, m.link
      FROM EntryMods em
      JOIN Mods m ON em.modID = m.modID
      WHERE em.entryID = ?
    `, [entryID]);
        car.mods = modResults || [];
        res.status(200).json({
            success: true,
            message: 'Car updated successfully',
            car
        });
    }
    catch (error) {
        yield connection.rollback();
        console.error('Error updating car:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update car',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
    finally {
        connection.release();
    }
}));
router.get('/mods', authenticateUser, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        console.log('Fetching all mods');
        const [mods] = yield dbconfig_1.pool.query(`SELECT modID as id, brand, category, cost, description, link 
       FROM Mods
       ORDER BY category, brand`);
        res.status(200).json({
            success: true,
            mods: mods
        });
    }
    catch (error) {
        console.error('Error fetching all mods:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch modifications',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
}));
router.get('/user', authenticateUser, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const user = req.user;
        const [carsResults] = yield dbconfig_1.pool.query(`
      SELECT 
        e.entryID, e.userEmail, e.carName, e.carMake, e.carModel, e.carYear, 
        e.carColor, e.carTrim, e.description, e.totalMods, e.totalCost, e.category,
        e.region, e.upvotes, e.engine, e.transmission, e.drivetrain,
        e.horsepower, e.torque, e.viewCount, e.createdAt, e.updatedAt,
        p.s3Key as mainPhotoKey,
        GROUP_CONCAT(DISTINCT ap.s3Key) as allPhotoKeys,
        GROUP_CONCAT(DISTINCT t.tagName) as tagNames
      FROM Entries e
      LEFT JOIN EntryPhotos p ON e.entryID = p.entryID AND p.isMainPhoto = TRUE
      LEFT JOIN EntryPhotos ap ON e.entryID = ap.entryID
      LEFT JOIN EntryTags et ON e.entryID = et.entryID
      LEFT JOIN Tags t ON et.tagID = t.tagID
      WHERE e.userEmail = ?
      GROUP BY e.entryID
      ORDER BY e.createdAt DESC
    `, [user.userEmail]);
        const carIds = carsResults.map((car) => car.entryID);
        let modsMap = new Map();
        if (carIds.length > 0) {
            const [modsResults] = yield dbconfig_1.pool.query(`
        SELECT 
          em.entryID, 
          m.modID, m.brand, m.category, m.cost, m.description, m.link
        FROM EntryMods em
        JOIN Mods m ON em.modID = m.modID
        WHERE em.entryID IN (?)
      `, [carIds]);
            modsResults.forEach((mod) => {
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
        const cars = carsResults.map((car) => (Object.assign(Object.assign({}, car), { allPhotoKeys: car.allPhotoKeys ? car.allPhotoKeys.split(',') : [], tags: car.tagNames ? car.tagNames.split(',') : [], mods: modsMap.get(car.entryID) || [] })));
        res.status(200).json({
            success: true,
            cars
        });
    }
    catch (error) {
        console.error('Error fetching user cars:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch cars',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
}));
router.get('/:entryID', authenticateUser, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { entryID } = req.params;
        const user = req.user;
        const [results] = yield dbconfig_1.pool.query(`
      SELECT 
        e.entryID, e.userEmail, e.carName, e.carMake, e.carModel, e.carYear, 
        e.carColor, e.carTrim, e.description, e.totalMods, e.totalCost, e.category,
        e.region, e.upvotes, e.engine, e.transmission, e.drivetrain,
        e.horsepower, e.torque, e.viewCount, e.createdAt, e.updatedAt,
        p.s3Key as mainPhotoKey,
        GROUP_CONCAT(DISTINCT ap.photoID) as photoIDs,
        GROUP_CONCAT(DISTINCT ap.s3Key) as allPhotoKeys,
        GROUP_CONCAT(DISTINCT ap.isMainPhoto) as photoMainFlags,
        GROUP_CONCAT(DISTINCT ap.uploadDate) as photoUploadDates,
        GROUP_CONCAT(DISTINCT t.tagID) as tagIDs,
        GROUP_CONCAT(DISTINCT t.tagName) as tagNames
      FROM Entries e
      LEFT JOIN EntryPhotos p ON e.entryID = p.entryID AND p.isMainPhoto = TRUE
      LEFT JOIN EntryPhotos ap ON e.entryID = ap.entryID
      LEFT JOIN EntryTags et ON e.entryID = et.entryID
      LEFT JOIN Tags t ON et.tagID = t.tagID
      WHERE e.entryID = ? AND e.userEmail = ?
      GROUP BY e.entryID
    `, [entryID, user.userEmail]);
        if (results.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Car not found or you do not have permission to view this car'
            });
        }
        const car = results[0];
        if (car.photoIDs && car.allPhotoKeys) {
            const photoIDs = car.photoIDs.split(',');
            const photoKeys = car.allPhotoKeys.split(',');
            const photoMainFlags = car.photoMainFlags.split(',').map((flag) => flag === '1');
            const photoUploadDates = car.photoUploadDates.split(',');
            car.photos = photoIDs.map((id, index) => ({
                photoID: parseInt(id),
                s3Key: photoKeys[index],
                isMainPhoto: photoMainFlags[index],
                uploadDate: photoUploadDates[index]
            }));
            car.allPhotoKeys = photoKeys;
        }
        else {
            car.photos = [];
            car.allPhotoKeys = [];
        }
        if (car.tagIDs && car.tagNames) {
            const tagIDs = car.tagIDs.split(',');
            const tagNames = car.tagNames.split(',');
            car.tags = tagIDs.map((id, index) => ({
                tagID: parseInt(id),
                tagName: tagNames[index]
            }));
        }
        else {
            car.tags = [];
        }
        const [mods] = yield dbconfig_1.pool.query(`
      SELECT m.modID, m.brand, m.category, m.cost, m.description, m.link
      FROM EntryMods em
      JOIN Mods m ON em.modID = m.modID
      WHERE em.entryID = ?
    `, [entryID]);
        car.mods = mods || [];
        delete car.photoIDs;
        delete car.photoMainFlags;
        delete car.photoUploadDates;
        delete car.tagIDs;
        delete car.tagNames;
        res.status(200).json({
            success: true,
            car
        });
    }
    catch (error) {
        console.error('Error fetching car details:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch car details',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
}));
router.post('/', authenticateUser, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const connection = yield dbconfig_1.pool.getConnection();
    try {
        yield connection.beginTransaction();
        const user = req.user;
        const { carName, carMake, carModel, carYear, carColor, description, totalMods, carTrim, totalCost, category, region, engine, transmission, drivetrain, horsepower, torque, photos, tags, mods, } = req.body;
        if (!carName || !carMake || !carModel || !carTrim || !category || !region) {
            connection.release();
            return res.status(400).json({
                success: false,
                message: 'Missing required fields'
            });
        }
        if (!photos || !Array.isArray(photos) || photos.length === 0) {
            connection.release();
            return res.status(400).json({
                success: false,
                message: 'At least one photo is required'
            });
        }
        const [result] = yield connection.query(`INSERT INTO Entries 
       (userEmail, carName, carMake, carModel, carYear, carColor, carTrim, description,
        totalMods, totalCost, category, region, engine, transmission, drivetrain,
        horsepower, torque)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [
            user.userEmail, carName, carMake, carModel, carYear || null, carColor || null, carTrim || null,
            description || null, totalMods || 0, totalCost || 0, category, region,
            engine || null, transmission || null, drivetrain || null,
            horsepower || null, torque || null
        ]);
        const entryID = result.insertId;
        if (photos.length > 0) {
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
            const [existingTags] = yield connection.query('SELECT tagID, tagName FROM Tags WHERE tagName IN (?)', [tags]);
            const existingTagsMap = new Map();
            existingTags.forEach((tag) => {
                existingTagsMap.set(tag.tagName, tag.tagID);
            });
            const tagsToCreate = tags.filter((tag) => !existingTagsMap.has(tag));
            if (tagsToCreate.length > 0) {
                const tagInsertValues = tagsToCreate.map((tag) => [tag]);
                const [tagResult] = yield connection.query('INSERT INTO Tags (tagName) VALUES ?', [tagInsertValues]);
                let newTagId = tagResult.insertId;
                tagsToCreate.forEach((tag) => {
                    existingTagsMap.set(tag, newTagId++);
                });
            }
            const tagAssociationValues = [];
            for (const tag of tags) {
                const tagID = existingTagsMap.get(tag);
                if (tagID) {
                    tagAssociationValues.push([entryID, tagID]);
                }
            }
            if (tagAssociationValues.length > 0) {
                yield connection.query('INSERT INTO EntryTags (entryID, tagID) VALUES ?', [tagAssociationValues]);
            }
        }
        yield connection.query('UPDATE Users SET totalEntries = totalEntries + 1 WHERE userEmail = ?', [user.userEmail]);
        yield connection.commit();
        const [results] = yield dbconfig_1.pool.query(`
      SELECT 
        e.entryID, e.userEmail, e.carName, e.carMake, e.carModel, e.carYear, 
        e.carColor, e.description, e.totalMods, e.totalCost, e.category,
        e.region, e.upvotes, e.engine, e.transmission, e.drivetrain,
        e.horsepower, e.torque, e.viewCount, e.createdAt, e.updatedAt,
        p.s3Key as mainPhotoKey,
        GROUP_CONCAT(DISTINCT ap.s3Key) as allPhotoKeys
      FROM Entries e
      LEFT JOIN EntryPhotos p ON e.entryID = p.entryID AND p.isMainPhoto = TRUE
      LEFT JOIN EntryPhotos ap ON e.entryID = ap.entryID
      WHERE e.entryID = ?
      GROUP BY e.entryID
    `, [entryID]);
        const car = results[0];
        car.allPhotoKeys = car.allPhotoKeys ? car.allPhotoKeys.split(',') : [];
        res.status(201).json({
            success: true,
            message: 'Car added successfully',
            car
        });
    }
    catch (error) {
        yield connection.rollback();
        console.error('Error adding car:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to add car',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
    finally {
        connection.release();
    }
}));
router.delete('/delete', authenticateUser, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const connection = yield dbconfig_1.pool.getConnection();
    try {
        const { entryID } = req.body;
        const user = req.user;
        yield connection.beginTransaction();
        const [existingCars] = yield connection.query('SELECT entryID FROM Entries WHERE entryID = ? AND userEmail = ?', [entryID, user.userEmail]);
        if (existingCars.length === 0) {
            yield connection.rollback();
            connection.release();
            return res.status(404).json({
                success: false,
                message: 'Car not found or you do not have permission to delete this car'
            });
        }
        const [photos] = yield connection.query('SELECT s3Key FROM EntryPhotos WHERE entryID = ?', [entryID]);
        yield connection.query('DELETE FROM Entries WHERE entryID = ? AND userEmail = ?', [entryID, user.userEmail]);
        yield connection.query('UPDATE Users SET totalEntries = GREATEST(totalEntries - 1, 0) WHERE userEmail = ?', [user.userEmail]);
        yield connection.commit();
        if (photos.length > 0) {
            setTimeout(() => __awaiter(void 0, void 0, void 0, function* () {
                try {
                    yield Promise.all(photos.map((photo) => s3.deleteObject({
                        Bucket: BUCKET_NAME,
                        Key: photo.s3Key
                    }).promise()));
                }
                catch (s3Error) {
                    console.error('Error deleting photos from S3:', s3Error);
                }
            }), 0);
        }
        res.status(200).json({
            success: true,
            message: 'Car deleted successfully'
        });
    }
    catch (error) {
        yield connection.rollback();
        console.error('Error deleting car:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete car',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
    finally {
        connection.release();
    }
}));
router.put('/:entryID', authenticateUser, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const connection = yield dbconfig_1.pool.getConnection();
    try {
        yield connection.beginTransaction();
        const { entryID } = req.params;
        const user = req.user;
        const { carName, carMake, carModel, carYear, carColor, description, totalMods, totalCost, category, region, engine, transmission, drivetrain, horsepower, torque, photos, tags, mods, } = req.body;
        const [existingCars] = yield connection.query('SELECT entryID FROM Entries WHERE entryID = ? AND userEmail = ?', [entryID, user.userEmail]);
        if (existingCars.length === 0) {
            yield connection.rollback();
            connection.release();
            return res.status(404).json({
                success: false,
                message: 'Car not found or you do not have permission to update this car'
            });
        }
        yield connection.query(`UPDATE Entries 
       SET carName = ?, carMake = ?, carModel = ?, carYear = ?, carColor = ?, 
           description = ?, totalMods = ?, totalCost = ?, category = ?, region = ?,
           engine = ?, transmission = ?, drivetrain = ?, horsepower = ?, torque = ?
       WHERE entryID = ? AND userEmail = ?`, [
            carName, carMake, carModel, carYear || null, carColor || null,
            description || null, totalMods || 0, totalCost || 0, category, region,
            engine || null, transmission || null, drivetrain || null,
            horsepower || null, torque || null,
            entryID, user.userEmail
        ]);
        if (photos && Array.isArray(photos) && photos.length > 0) {
            yield connection.query('DELETE FROM EntryPhotos WHERE entryID = ?', [entryID]);
            const photoValues = photos.map((photo) => [
                entryID,
                photo.s3Key,
                photo.isMainPhoto || false
            ]);
            yield connection.query(`INSERT INTO EntryPhotos (entryID, s3Key, isMainPhoto)
         VALUES ?`, [photoValues]);
        }
        if (mods && Array.isArray(mods)) {
            yield connection.query('DELETE FROM EntryMods WHERE entryID = ?', [entryID]);
            if (mods.length > 0) {
                const modValues = mods.map((modId) => [entryID, modId]);
                yield connection.query('INSERT INTO EntryMods (entryID, modID) VALUES ?', [modValues]);
            }
        }
        if (tags && Array.isArray(tags)) {
            yield connection.query('DELETE FROM EntryTags WHERE entryID = ?', [entryID]);
            if (tags.length > 0) {
                const [existingTags] = yield connection.query('SELECT tagID, tagName FROM Tags WHERE tagName IN (?)', [tags]);
                const existingTagsMap = new Map();
                existingTags.forEach((tag) => {
                    existingTagsMap.set(tag.tagName, tag.tagID);
                });
                const tagsToCreate = tags.filter((tag) => !existingTagsMap.has(tag));
                if (tagsToCreate.length > 0) {
                    const tagInsertValues = tagsToCreate.map((tag) => [tag]);
                    const [tagResult] = yield connection.query('INSERT INTO Tags (tagName) VALUES ?', [tagInsertValues]);
                    let newTagId = tagResult.insertId;
                    tagsToCreate.forEach((tag) => {
                        existingTagsMap.set(tag, newTagId++);
                    });
                }
                const tagAssociationValues = [];
                for (const tag of tags) {
                    const tagID = existingTagsMap.get(tag);
                    if (tagID) {
                        tagAssociationValues.push([entryID, tagID]);
                    }
                }
                if (tagAssociationValues.length > 0) {
                    yield connection.query('INSERT INTO EntryTags (entryID, tagID) VALUES ?', [tagAssociationValues]);
                }
            }
        }
        yield connection.commit();
        const [results] = yield dbconfig_1.pool.query(`
      SELECT 
        e.entryID, e.userEmail, e.carName, e.carMake, e.carModel, e.carYear, 
        e.carColor, e.description, e.totalMods, e.totalCost, e.category,
        e.region, e.upvotes, e.engine, e.transmission, e.drivetrain,
        e.horsepower, e.torque, e.viewCount, e.createdAt, e.updatedAt,
        p.s3Key as mainPhotoKey,
        GROUP_CONCAT(DISTINCT ap.s3Key) as allPhotoKeys
      FROM Entries e
      LEFT JOIN EntryPhotos p ON e.entryID = p.entryID AND p.isMainPhoto = TRUE
      LEFT JOIN EntryPhotos ap ON e.entryID = ap.entryID
      WHERE e.entryID = ?
      GROUP BY e.entryID
    `, [entryID]);
        const car = results[0];
        car.allPhotoKeys = car.allPhotoKeys ? car.allPhotoKeys.split(',') : [];
        res.status(200).json({
            success: true,
            message: 'Car updated successfully',
            car
        });
    }
    catch (error) {
        yield connection.rollback();
        console.error('Error updating car:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update car',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
    finally {
        connection.release();
    }
}));
router.delete('/:entryID', authenticateUser, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const connection = yield dbconfig_1.pool.getConnection();
    try {
        yield connection.beginTransaction();
        const { entryID } = req.params;
        const user = req.user;
        const [existingCars] = yield connection.query('SELECT entryID FROM Entries WHERE entryID = ? AND userEmail = ?', [entryID, user.userEmail]);
        if (existingCars.length === 0) {
            yield connection.rollback();
            connection.release();
            return res.status(404).json({
                success: false,
                message: 'Car not found or you do not have permission to delete this car'
            });
        }
        const [photos] = yield connection.query('SELECT s3Key FROM EntryPhotos WHERE entryID = ?', [entryID]);
        yield connection.query('DELETE FROM Entries WHERE entryID = ? AND userEmail = ?', [entryID, user.userEmail]);
        yield connection.query('UPDATE Users SET totalEntries = GREATEST(totalEntries - 1, 0) WHERE userEmail = ?', [user.userEmail]);
        yield connection.commit();
        if (photos.length > 0) {
            setTimeout(() => __awaiter(void 0, void 0, void 0, function* () {
                try {
                    yield Promise.all(photos.map((photo) => s3.deleteObject({
                        Bucket: BUCKET_NAME,
                        Key: photo.s3Key
                    }).promise()));
                }
                catch (error) {
                    console.error('Error deleting photos from S3:', error);
                }
            }), 0);
        }
        res.status(200).json({
            success: true,
            message: 'Car deleted successfully'
        });
    }
    catch (error) {
        yield connection.rollback();
        console.error('Error deleting car:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete car',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
    finally {
        connection.release();
    }
}));
exports.default = router;
