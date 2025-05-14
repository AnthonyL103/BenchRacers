-- Rankings Page

-- Top 3 entries by category
SELECT *
FROM Entries
WHERE category IN ('Exotic', 'Sport', 'Off-Road')
ORDER BY upvotes DESC
LIMIT 3;

-- Top 10 leaderboard
SELECT entryID, carName, carMake, upvotes
FROM Entries
ORDER BY upvotes DESC
LIMIT 10;


-- Explore Page

-- Get cars in same region that aren't previously viewed
SELECT *
FROM Entries
WHERE category = 'Sport'
  AND entryID NOT IN (1, 5, 9)
  AND region = 'East'
ORDER BY RAND()
LIMIT 10;


-- Like/Dislike Actions

-- Like a car
UPDATE Entries
SET upvotes = upvotes + 1
WHERE entryID = :entryID;

-- Dislike a car
UPDATE Entries
SET upvotes = GREATEST(upvotes - 1, 0)
WHERE entryID = :entryID;


-- My Garage Page

-- Count user awards
SELECT COUNT(*)
FROM Awards
WHERE userEmail = :userEmail;

-- Add a Car Entry
INSERT INTO Entries (
    userEmail, carName, carMake, carColor, description,
    s3ContentID, totalMods, totalCost, category, region
)
VALUES (
    :userEmail, :carName, :carMake, :carColor, :description,
    :s3ContentID, :totalMods, :totalCost, :category, :region
);

-- Get all entries and main photo for that entry
SELECT e.*,
       (SELECT s3Key
        FROM EntryPhotos
        WHERE entryID = e.entryID AND isMainPhoto = TRUE
        LIMIT 1) AS mainPhotoKey
FROM Entries e
WHERE e.userEmail = :userEmail
ORDER BY e.createdAt DESC;

-- Delete a car entry
DELETE FROM Entries
WHERE entryID = :entryID
  AND userEmail = :userEmail;

-- Update a car entry
UPDATE Entries
SET carName = :carName,
    carMake = :carMake,
    carModel = :carModel,
    carYear = :carYear,
    carColor = :carColor,
    description = :description,
    totalMods = :totalMods,
    totalCost = :totalCost,
    category = :category,
    region = :region,
    engine = :engine,
    transmission = :transmission,
    drivetrain = :drivetrain,
    horsepower = :horsepower,
    torque = :torque
WHERE entryID = :entryID
  AND userEmail = :userEmail;


-- Authentication

-- Sign up
INSERT INTO Users (
    userEmail, name, password, accountCreated,
    totalEntries, region, isEditor, isVerified, verificationToken
)
VALUES (
    :userEmail, :name, :hashedPassword, NOW(),
    0, :region, FALSE, FALSE, :verificationToken
);

-- Verify email
UPDATE Users
SET isVerified = TRUE,
    verificationToken = NULL
WHERE userEmail = :userEmail;

-- Forgot password
UPDATE Users
SET resetToken = :resetToken,
    resetTokenExpiration = :expiration
WHERE userEmail = :userEmail;

-- Reset password
UPDATE Users
SET password = :newHashedPassword,
    resetToken = NULL,
    resetTokenExpiration = NULL
WHERE userEmail = :userEmail;


--ADMIN PAGE QUERIES

-- Queries for the Admin to execute in the database 

-- For Selects, my plan is to have drop downs for the admind to filter everything, for example if they want to 
-- query entries, they can add options like region category, users, and the SQL query will be modofied to fit
-- their needs.

-- USERS

-- View all users
SELECT *
FROM Users;

-- View users by region
SELECT *
FROM Users
WHERE region = :region;

-- View users by account created date
SELECT *
FROM Users
WHERE accountCreated BETWEEN :startDate AND :endDate;

-- Manually add a new user
INSERT INTO Users (
    userEmail, name, password, accountCreated, region
)
VALUES (
    :userEmail, :name, :password, NOW(), :region
);

-- Manually update user info (e.g., region, name, editor status)
UPDATE Users
SET region = :region,
    name = :name,
    userEmail = :userEmail,
    isEditor = :isEditor
WHERE userEmail = :userEmail;

--ENTRIES

-- View all entries with associated users
SELECT e.entryID, e.carName, e.carMake, e.carModel,
       u.name AS owner, e.category, e.createdAt
FROM Entries e
JOIN Users u ON e.userEmail = u.userEmail;

-- View all entries with no mods
SELECT e.entryID, e.carName, e.carMake, e.carModel,
       u.name AS owner, e.category, e.createdAt
FROM Entries e
JOIN Users u ON e.userEmail = u.userEmail
WHERE e.totalMods = 0;

-- View entries by region
SELECT e.entryID, e.carName, e.carMake, e.carModel,
       u.name AS owner, e.category, e.createdAt
FROM Entries e
JOIN Users u ON e.userEmail = u.userEmail
WHERE e.region = :region;

-- View entries by region and category
SELECT e.entryID, e.carName, e.carMake, e.carModel,
       u.name AS owner, e.category, e.createdAt
FROM Entries e
JOIN Users u ON e.userEmail = u.userEmail
WHERE e.region = :region AND e.category = :category;

-- View entries by category
SELECT e.entryID, e.carName, e.carMake, e.carModel,
       u.name AS owner, e.category, e.createdAt
FROM Entries e
JOIN Users u ON e.userEmail = u.userEmail
WHERE e.category = :category;

-- Manually add a new entry
INSERT INTO Entries (
    userEmail, carName, carMake, carModel,
    carYear, carColor, description, category, region
)
VALUES (
    :userEmail, :carName, :carMake, :carModel,
    :carYear, :carColor, :description, :category, :region
);

-- Manually update an entry
UPDATE Entries
SET description = :description,
    carColor = :carColor
WHERE entryID = :entryID;

-- Manually delete an entry
DELETE FROM Entries
WHERE entryID = :entryID;


-- MODS

-- View all mods grouped by category
SELECT *
FROM Mods
ORDER BY category;

-- Manually add a new mod
INSERT INTO Mods (
    brand, category, cost, description, link
)
VALUES (
    :brand, :category, :cost, :description, :link
);

-- Manually update a mod
UPDATE Mods
SET cost = :cost,
    description = :description
WHERE ModID = :ModID;

-- Delete a mod
DELETE FROM Mods
WHERE ModID = :ModID;

-- View all mods associated with an entry
SELECT m.ModID, m.brand, m.category, m.cost
FROM EntryMods em
JOIN Mods m ON em.ModID = m.ModID
WHERE em.entryID = :entryID;

-- View entry mods by category
SELECT m.ModID, m.brand, m.category, m.cost
FROM EntryMods em
JOIN Mods m ON em.ModID = m.ModID
WHERE em.entryID = :entryID AND m.category = :category;

-- View entry mods by brand
SELECT m.ModID, m.brand, m.category, m.cost
FROM EntryMods em
JOIN Mods m ON em.ModID = m.ModID
WHERE em.entryID = :entryID AND m.brand = :brand;

-- Link a mod to an entry
INSERT INTO EntryMods (
    entryID, ModID
)
VALUES (
    :entryID, :ModID
);

-- Unlink a mod from an entry
DELETE FROM EntryMods
WHERE entryID = :entryID AND ModID = :ModID;


-- TAGS

-- View all tags
SELECT *
FROM Tags;

-- Add a tag
INSERT INTO Tags (
    tagName
)
VALUES (
    :tagName
);

-- Update a tag
UPDATE Tags
SET tagName = :newTagName
WHERE tagID = :tagID;

-- Delete a tag
DELETE FROM Tags
WHERE tagID = :tagID;

-- View tags for an entry
SELECT t.tagName
FROM EntryTags et
JOIN Tags t ON et.tagID = t.tagID
WHERE et.entryID = :entryID;

-- Add tag to entry
INSERT INTO EntryTags (
    entryID, tagID
)
VALUES (
    :entryID, :tagID
);

-- Remove tag from entry
DELETE FROM EntryTags
WHERE entryID = :entryID AND tagID = :tagID;


-- PHOTOS

-- View all photos for an entry
SELECT *
FROM EntryPhotos
WHERE entryID = :entryID;

-- View photos by main status
SELECT *
FROM EntryPhotos
WHERE entryID = :entryID AND isMainPhoto = :isMainPhoto;

-- View photo by S3 key
SELECT *
FROM EntryPhotos
WHERE entryID = :entryID AND s3Key = :s3Key;

-- Add a photo
INSERT INTO EntryPhotos (
    entryID, s3Key, isMainPhoto
)
VALUES (
    :entryID, :s3Key, :isMainPhoto
);

-- Update main photo status
UPDATE EntryPhotos
SET isMainPhoto = :isMainPhoto
WHERE photoID = :photoID;

-- Delete a photo
DELETE FROM EntryPhotos
WHERE photoID = :photoID;


-- AWARDS

-- View awards by user
SELECT *
FROM Awards
WHERE userEmail = :userEmail;

-- View awards by type
SELECT *
FROM Awards
WHERE awardType = :awardType;

-- View awards by date
SELECT *
FROM Awards
WHERE awardDate BETWEEN :startDate AND :endDate;

-- View awards by user and type
SELECT *
FROM Awards
WHERE userEmail = :userEmail AND awardType = :awardType;

-- Add an award
INSERT INTO Awards (
    userEmail, awardType, awardDate
)
VALUES (
    :userEmail, :awardType, NOW()
);

-- Delete an award
DELETE FROM Awards
WHERE awardID = :awardID;
