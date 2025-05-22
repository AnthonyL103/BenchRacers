-- Project Step 2: DDL.sql
-- CarShare Database
-- Group 114: Anthony Li
-- Date: 4/28/2025

--Lots of changes were made, I made sure to include my insert statements to prove normalization, 
--and I also made sure to not hardcode foreign keys this time.
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
    carName VARCHAR(100) NOT NULL, 
    carMake VARCHAR(50) NOT NULL,  
    carModel VARCHAR(50) NOT NULL,
    carYear VARCHAR(4),          
    carColor VARCHAR(30),
    carTrim VARCHAR(50),     
    description TEXT,             
    totalMods INT NOT NULL DEFAULT 0,
    totalCost DECIMAL(10,2) NOT NULL DEFAULT 0, 
    category VARCHAR(30) NOT NULL,
    region VARCHAR(50) NOT NULL, 
    upvotes INT NOT NULL DEFAULT 0,
    engine VARCHAR(100),
    transmission VARCHAR(50),
    drivetrain VARCHAR(20),
    horsepower INT,
    torque INT,
    viewCount INT NOT NULL DEFAULT 0,
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

-- Created the Awards table
CREATE TABLE Awards (
    awardID INT AUTO_INCREMENT PRIMARY KEY,
    userEmail VARCHAR(60) NOT NULL,
    awardType VARCHAR(20) NOT NULL,
    awardDate DATETIME NOT NULL,
    FOREIGN KEY (userEmail) REFERENCES Users(userEmail) ON DELETE CASCADE
);

-- Create the EngineMods table
CREATE TABLE Mods (
    modID INT AUTO_INCREMENT PRIMARY KEY,
    brand VARCHAR(20) NOT NULL,
    category VARCHAR(20) NOT NULL,
    cost INT NOT NULL,
    description VARCHAR(100),
    link VARCHAR(30) NOT NULL
);


-- Create the EntryEngineMods intersection table
CREATE TABLE EntryMods (
    entryID INT NOT NULL,
    modID INT NOT NULL,
    PRIMARY KEY (entryID, modID),
    FOREIGN KEY (entryID) REFERENCES Entries(entryID) ON DELETE CASCADE,
    FOREIGN KEY (modID) REFERENCES Mods(modID)
);

/*
SET FOREIGN_KEY_CHECKS=0;
START TRANSACTION;

-- USERS
INSERT INTO Users (
  userEmail, name, password, accountCreated, userIndex, totalEntries, region, 
  isVerified, verificationtoken, resetToken, resetTokenExpiration, isEditor
) VALUES
('liant@carshare.com', 'Anthony', 'hashed_pw_1', '2024-01-15', 1, 2, 'PNW', TRUE, 'veriftoken123abc', 'resettoken1', '2025-12-01 12:00:00', FALSE),
('lidan@carshare.com', 'Dan', 'hashed_pw_2', '2015-12-19', 2, 1, 'PNW', FALSE, 'veriftoken456def', 'resettoken2', '2025-11-01 10:30:00', TRUE),
('carlover123@carshare.com', 'Alex', 'hashed_pw_3', '2022-10-05', 3, 3, 'Midwest', TRUE, 'veriftoken789ghi', 'resettoken3', '2025-10-20 09:45:00', FALSE),
('musclecarguy67@carshare.com', 'Calvin', 'hashed_pw_4', '2020-02-28', 4, 2, 'East Coast', TRUE, 'veriftoken999xyz', 'resettoken4', '2025-09-15 15:20:00', TRUE);

-- MODS
INSERT INTO Mods (brand, category, cost, description, link) VALUES
('K&N', 'engine', 80, 'Cold Air Intake', 'https://blah.com/kn'),
('Borla', 'engine', 1250, 'Cat-Back Exhaust', 'https://blah.com/borla'),
('Recaro', 'interior', 2000, 'Racing Seats', 'https://blah.com/recaro'),
('Volk', 'exterior', 3250, 'TE37 Wheels', 'https://blah.com/volk'),
('GReddy', 'engine', 7000, 'Turbo Kit', 'https://blah.com/greddy');

-- ENTRIES (using subquery for userEmail)
INSERT INTO Entries (
  userEmail, carName, carMake, carModel, carYear, carColor, description,
  totalMods, totalCost, category, region, upvotes,
  engine, transmission, drivetrain, horsepower, torque, viewCount, createdAt, updatedAt
) VALUES
((SELECT userEmail FROM Users WHERE name = 'Anthony'), 'Civic', 'Honda', 'Civic', '2015', 'Black', 'JDM Civic build.', 5, 8500.00, 'JDM', 'PNW', 45, 'K20 Turbo', 'Manual', 'FWD', 350, 280, 120, NOW(), NOW()),
((SELECT userEmail FROM Users WHERE name = 'Dan'), 'Mustang', 'Ford', 'Mustang', '2017', 'Blue', 'Custom Mustang GT.', 8, 22500.00, 'Muscle', 'PNW', 132, 'Coyote V8', 'Auto', 'RWD', 480, 420, 240, NOW(), NOW()),
((SELECT userEmail FROM Users WHERE name = 'Alex'), 'WRX STI', 'Subaru', 'WRX', '2019', 'Green', 'Built for rally.', 10, 18500.00, 'Rally', 'Midwest', 95, 'EJ25', 'Manual', 'AWD', 310, 290, 180, NOW(), NOW());

-- AWARDS (subquery for userEmail)
INSERT INTO Awards (userEmail, awardType, awardDate) VALUES
((SELECT userEmail FROM Users WHERE name = 'Anthony'), 'Best JDM', '2025-02-15'),
((SELECT userEmail FROM Users WHERE name = 'Alex'), 'Editor''s Choice', '2024-03-01'),
((SELECT userEmail FROM Users WHERE name = 'Dan'), 'Best American Muscle', '2022-03-05');

-- TAGS
INSERT INTO Tags (tagName) VALUES
('Turbo'), ('Widebody'), ('Show Car'), ('Track'), ('JDM');

-- ENTRYTAGS (subqueries for entryID and tagID)
INSERT INTO EntryTags (entryID, tagID) VALUES
((SELECT entryID FROM Entries WHERE carName = 'Civic'), (SELECT tagID FROM Tags WHERE tagName = 'Turbo')),
((SELECT entryID FROM Entries WHERE carName = 'Civic'), (SELECT tagID FROM Tags WHERE tagName = 'JDM')),
((SELECT entryID FROM Entries WHERE carName = 'Mustang'), (SELECT tagID FROM Tags WHERE tagName = 'Widebody')),
((SELECT entryID FROM Entries WHERE carName = 'Mustang'), (SELECT tagID FROM Tags WHERE tagName = 'Show Car')),
((SELECT entryID FROM Entries WHERE carName = 'WRX STI'), (SELECT tagID FROM Tags WHERE tagName = 'Turbo')),
((SELECT entryID FROM Entries WHERE carName = 'WRX STI'), (SELECT tagID FROM Tags WHERE tagName = 'Track'));

-- ENTRYPHOTOS (subquery for entryID)
INSERT INTO EntryPhotos (entryID, s3Key, isMainPhoto) VALUES
((SELECT entryID FROM Entries WHERE carName = 'Civic'), 's3/civic_main33.jpg', TRUE),
((SELECT entryID FROM Entries WHERE carName = 'Civic'), 's3/civic_side2232.jpg', FALSE),
((SELECT entryID FROM Entries WHERE carName = 'Mustang'), 's3/mustang_main676.jpg', TRUE),
((SELECT entryID FROM Entries WHERE carName = 'WRX STI'), 's3/wrx_main565.jpg', TRUE);

-- ENTRYMODS (subqueries for entryID and modID)
INSERT INTO EntryMods (entryID, modID) VALUES
((SELECT entryID FROM Entries WHERE carName = 'Civic'), (SELECT modID FROM Mods WHERE brand = 'K&N')),
((SELECT entryID FROM Entries WHERE carName = 'Civic'), (SELECT modID FROM Mods WHERE brand = 'Borla')),
((SELECT entryID FROM Entries WHERE carName = 'Civic'), (SELECT modID FROM Mods WHERE brand = 'Recaro')),
((SELECT entryID FROM Entries WHERE carName = 'Civic'), (SELECT modID FROM Mods WHERE brand = 'Volk')),
((SELECT entryID FROM Entries WHERE carName = 'Mustang'), (SELECT modID FROM Mods WHERE brand = 'Borla')),
((SELECT entryID FROM Entries WHERE carName = 'Mustang'), (SELECT modID FROM Mods WHERE brand = 'Volk')),
((SELECT entryID FROM Entries WHERE carName = 'Mustang'), (SELECT modID FROM Mods WHERE brand = 'GReddy')),
((SELECT entryID FROM Entries WHERE carName = 'WRX STI'), (SELECT modID FROM Mods WHERE brand = 'K&N')),
((SELECT entryID FROM Entries WHERE carName = 'WRX STI'), (SELECT modID FROM Mods WHERE brand = 'GReddy'));

COMMIT;
SET FOREIGN_KEY_CHECKS=1;

*/