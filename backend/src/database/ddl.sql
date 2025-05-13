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

-- Create the Entries table
CREATE TABLE Entries (
    entryID INT AUTO_INCREMENT PRIMARY KEY,
    userEmail VARCHAR(60) NOT NULL,
    carName VARCHAR(20) NOT NULL,
    carMake VARCHAR(20) NOT NULL,
    carColor VARCHAR(20),
    description VARCHAR(500),
    s3ContentID VARCHAR(20) NOT NULL,
    totalMods INT NOT NULL DEFAULT 0,
    totalCost INT NOT NULL DEFAULT 0,
    category VARCHAR(20) NOT NULL,
    region VARCHAR(20) NOT NULL,
    upvotes INT NOT NULL DEFAULT 0,
    FOREIGN KEY (userEmail) REFERENCES Users(userEmail) ON DELETE CASCADE
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