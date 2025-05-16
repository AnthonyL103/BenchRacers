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


-- Authentication/Account

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

--Delete a user
DELETE FROM Users
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

-- search users by region
SELECT *
FROM Users
WHERE region LIKE CONCAT('%', :region, '%');

-- Search users by name
SELECT *
FROM Users
WHERE name LIKE CONCAT('%', :name, '%');

-- Manually add a new user
INSERT INTO Users (
    userEmail, name, password, accountCreated, region, isVerified, isEditor
)
VALUES (
    :userEmail, :name, :password, NOW(), :region, FALSE, :isEditor
);

-- Manually update user info (e.g., region, name, editor status)
UPDATE Users
SET region = :region,
    
    userEmail = :userEmail,
    name = :name,
    password = :password,
    isVerified = :isVerified,
    isEditor = :isEditor
    
WHERE userEmail = :userEmail;

--Delete a user
DELETE FROM Users
WHERE userEmail = :userEmail;


--ENTRIES

-- View all entries with associated users
SELECT e.entryID, e.carName, e.carMake, e.carModel,
       u.userEmail AS Email, e.category, e.createdAt
FROM Entries e
JOIN Users u ON e.userEmail = u.userEmail;

-- View all entries with no mods
SELECT e.entryID, e.carName, e.carMake, e.carModel,
       u.userEmail AS owner, e.category, e.createdAt
FROM Entries e
JOIN Users u ON e.userEmail = u.userEmail
WHERE e.totalMods = 0;

-- Search entries by region
SELECT e.entryID, e.carName, e.carMake, e.carModel,
       u.userEmail AS owner, e.category, e.createdAt
FROM Entries e
JOIN Users u ON e.userEmail = u.userEmail
WHERE e.region LIKE CONCAT('%', :region, '%');

-- Search entries by category
SELECT e.entryID, e.carName, e.carMake, e.carModel,
       u.userEmail AS owner, e.category, e.createdAt
FROM Entries e
JOIN Users u ON e.userEmail = u.userEmail
WHERE e.category LIKE CONCAT('%', :category, '%');

-- Manually add a new entry
INSERT INTO Entries (
    userEmail, carName, carMake, carModel,
    carYear, carColor, totalCost, upvotes,
    category, region, engine, transmission,
    drivetrain, horsepower, torque
)
VALUES (
    :userEmail, :carName, :carMake, :carModel,
    :carYear, :carColor, :totalCost, :upvotes,
    :category, :region, :engine, :transmission,
    :drivetrain, :horsepower, :torque
);


-- Manually update an entry
UPDATE Entries
SET carName = :carName,
    carMake = :carMake,
    carModel = :carModel,
    carYear = :carYear,
    carColor = :carColor,
    totalCost = :totalCost,
    upvotes = :upvotes,
    category = :category,
    region = :region,
    engine = :engine,
    transmission = :transmission,
    drivetrain = :drivetrain,
    horsepower = :horsepower,
    torque = :torque
WHERE entryID = :entryID;

-- Manually delete an entry
DELETE FROM Entries
WHERE entryID = :entryID;


-- MODS

-- View all mods
SELECT *
FROM Mods;

-- View all mods associated with an entry
SELECT m.ModID, m.brand, m.category, m.cost
FROM EntryMods em
JOIN Mods m ON em.ModID = m.ModID
WHERE em.entryID = :entryID;

-- search mods by category
SELECT *
FROM Mods
WHERE category LIKE CONCAT('%', :category, '%');

-- search mods by brand
SELECT *
FROM Mods
WHERE brand LIKE CONCAT('%', :brand, '%');


-- Manually add a new mod
INSERT INTO Mods (
    brand, category, cost, description, link
)
VALUES (
    :brand, :category, :cost, :description, :link
);

-- Manually update a mod
UPDATE Mods
SET brand = :brand,
    category = :category,
    cost = :cost,
    description = :description,
    link = :link
WHERE modID = :modID;


-- Delete a mod
DELETE FROM Mods
WHERE ModID = :ModID;


-- TAGS

-- View all tags
SELECT *
FROM Tags;

-- View all tags associated with an entry
SELECT t.tagID, t.tagName
FROM EntryTags et
JOIN Tags t ON et.tagID = t.tagID
WHERE et.entryID = :entryID;

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


-- PHOTOS

-- View all photos for an entry
SELECT *
FROM EntryPhotos
WHERE entryID = :entryID;

-- View photos by main status
SELECT *
FROM EntryPhotos
WHERE entryID = :entryID AND isMainPhoto = :isMainPhoto;

-- Search photo by S3 key
SELECT *
FROM EntryPhotos
WHERE s3Key LIKE CONCAT('%', :s3Key, '%');

-- Add a photo
INSERT INTO EntryPhotos (
    entryID, s3Key, isMainPhoto, uploadDate
)
VALUES (
    :entryID, :s3Key, :isMainPhoto, :uploadDate
);


-- Update main photo status
UPDATE EntryPhotos
SET entryID = :entryID,
    s3Key = :s3Key,
    isMainPhoto = :isMainPhoto,
    uploadDate = :uploadDate
WHERE photoID = :photoID;


-- Delete a photo
DELETE FROM EntryPhotos
WHERE photoID = :photoID;


-- AWARDS

-- View awards 
SELECT *
FROM Awards;

-- View awards ordered by date
SELECT *
FROM Awards
ORDER BY awardDate DESC;

-- search awards by type
SELECT *
FROM Awards
WHERE awardType LIKE CONCAT('%', :awardType, '%');

-- search awards by user
SELECT *
FROM Awards
WHERE userEmail LIKE CONCAT('%', :userEmail, '%');

-- Add an award
INSERT INTO Awards (
    userEmail, awardType, awardDate
)
VALUES (
    :userEmail, :awardType, NOW()
);

-- Update an award
UPDATE Awards
SET userEmail = :userEmail,
    awardType = :awardType,
    awardDate = :awardDate
WHERE awardID = :awardID;

-- Delete an award
DELETE FROM Awards
WHERE awardID = :awardID;
