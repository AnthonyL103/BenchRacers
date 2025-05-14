-- Project Step 2: DDL.sql
-- CarShare Database
-- Group 114: Anthony Li
-- Date: 4/28/2025

-- Disable the fk checks and auto-commit to decrease import errors
SET FOREIGN_KEY_CHECKS=0;
SET AUTOCOMMIT = 0;
START TRANSACTION;

-- Drop the existing tables if they exist, so there are no duplicates
DROP TABLE IF EXISTS EntryExteriorMods;
DROP TABLE IF EXISTS EntryInteriorMods;
DROP TABLE IF EXISTS EntryEngineMods;
DROP TABLE IF EXISTS ExteriorMods;
DROP TABLE IF EXISTS InteriorMods;
DROP TABLE IF EXISTS EngineMods;
DROP TABLE IF EXISTS Awards;
DROP TABLE IF EXISTS Entries;
DROP TABLE IF EXISTS Users;

-- Create the Users table
-- I increased the password size to fit bcypt hashing
CREATE TABLE Users (
    userEmail VARCHAR(60) PRIMARY KEY,
    name VARCHAR(60) NOT NULL,
    password VARCHAR(60) NOT NULL, 
    accountCreated DATETIME NOT NULL,
    userIndex INT AUTO_INCREMENT UNIQUE,
    totalEntries INT NOT NULL DEFAULT 0,
    region VARCHAR(20) NOT NULL,
    isVerified BOOLEAN NOT NULL DEFAULT FALSE,
    verificationtoken VARCHAR(64),
    resetToken VARCHAR(64),
    resetTokenExpiration DATETIME,
    isEditor BOOLEAN NOT NULL DEFAULT FALSE
);

-- Add a new table for car photos
CREATE TABLE EntryPhotos (
    photoID INT AUTO_INCREMENT PRIMARY KEY,
    entryID INT NOT NULL,
    s3Key VARCHAR(255) NOT NULL,
    isMainPhoto BOOLEAN NOT NULL DEFAULT FALSE,
    uploadDate DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (entryID) REFERENCES Entries(entryID) ON DELETE CASCADE
);

-- Create the Entries table
CREATE TABLE Entries (
    entryID INT AUTO_INCREMENT PRIMARY KEY,
    userEmail VARCHAR(60) NOT NULL,
    carName VARCHAR(100) NOT NULL, -- Increased size for longer car names
    carMake VARCHAR(50) NOT NULL,  -- Increased for longer manufacturer names
    carModel VARCHAR(50) NOT NULL, -- Added separate model field
    carYear VARCHAR(4),           -- Added year field
    carColor VARCHAR(30),         -- Slightly increased
    description TEXT,             -- Changed to TEXT for longer descriptions
    totalMods INT NOT NULL DEFAULT 0,
    totalCost DECIMAL(10,2) NOT NULL DEFAULT 0, -- Changed to DECIMAL for currency
    category VARCHAR(30) NOT NULL,
    region VARCHAR(50) NOT NULL,  -- Increased for longer region names
    upvotes INT NOT NULL DEFAULT 0,
    engine VARCHAR(100),
    transmission VARCHAR(50),
    drivetrain VARCHAR(20),
    horsepower INT,
    torque INT,
    viewCount INT NOT NULL DEFAULT 0, -- Added view count tracking
    createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (userEmail) REFERENCES Users(userEmail) ON DELETE CASCADE
);

CREATE TABLE Tags (
    tagID INT AUTO_INCREMENT PRIMARY KEY,
    tagName VARCHAR(30) NOT NULL UNIQUE
);

-- Create a table for associating tags with entries
CREATE TABLE EntryTags (
    entryID INT NOT NULL,
    tagID INT NOT NULL,
    PRIMARY KEY (entryID, tagID),
    FOREIGN KEY (entryID) REFERENCES Entries(entryID) ON DELETE CASCADE,
    FOREIGN KEY (tagID) REFERENCES Tags(tagID) ON DELETE CASCADE
);

-- Create the Awards table
CREATE TABLE Awards (
    awardID INT AUTO_INCREMENT PRIMARY KEY,
    userEmail VARCHAR(60) NOT NULL,
    awardType VARCHAR(20) NOT NULL,
    awardDate DATETIME NOT NULL,
    FOREIGN KEY (userEmail) REFERENCES Users(userEmail) ON DELETE CASCADE
);

-- Create the EngineMods table
CREATE TABLE EngineMods (
    engineModID INT AUTO_INCREMENT PRIMARY KEY,
    brand VARCHAR(20) NOT NULL,
    cost INT NOT NULL,
    description VARCHAR(100),
    link VARCHAR(30) NOT NULL
);

-- Create the InteriorMods table
CREATE TABLE InteriorMods (
    interiorModID INT AUTO_INCREMENT PRIMARY KEY,
    brand VARCHAR(20) NOT NULL,
    cost INT NOT NULL,
    description VARCHAR(100),
    link VARCHAR(30) NOT NULL
);

-- Create the ExteriorMods table
CREATE TABLE ExteriorMods (
    exteriorModID INT AUTO_INCREMENT PRIMARY KEY,
    brand VARCHAR(20) NOT NULL,
    cost INT NOT NULL,
    description VARCHAR(100),
    link VARCHAR(30) NOT NULL
);

-- Create the EntryEngineMods intersection table
CREATE TABLE EntryEngineMods (
    entryID INT NOT NULL,
    engineModID INT NOT NULL,
    PRIMARY KEY (entryID, engineModID),
    FOREIGN KEY (entryID) REFERENCES Entries(entryID) ON DELETE CASCADE,
    FOREIGN KEY (engineModID) REFERENCES EngineMods(engineModID)
);

-- Create the EntryInteriorMods intersection table
CREATE TABLE EntryInteriorMods (
    entryID INT NOT NULL,
    interiorModID INT NOT NULL,
    PRIMARY KEY (entryID, interiorModID),
    FOREIGN KEY (entryID) REFERENCES Entries(entryID) ON DELETE CASCADE,
    FOREIGN KEY (interiorModID) REFERENCES InteriorMods(interiorModID)
);

-- Create the EntryExteriorMods intersection table
CREATE TABLE EntryExteriorMods (
    entryID INT NOT NULL,
    exteriorModID INT NOT NULL,
    PRIMARY KEY (entryID, exteriorModID),
    FOREIGN KEY (entryID) REFERENCES Entries(entryID) ON DELETE CASCADE,
    FOREIGN KEY (exteriorModID) REFERENCES ExteriorMods(exteriorModID)
);


SET FOREIGN_KEY_CHECKS=1;
COMMIT;