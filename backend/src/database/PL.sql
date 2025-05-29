DELIMITER //

CREATE PROCEDURE ResetCarShareDB()
BEGIN
  SET FOREIGN_KEY_CHECKS = 0;
  START TRANSACTION;

  DROP TABLE IF EXISTS EntryMods;
  DROP TABLE IF EXISTS EntryPhotos;
  DROP TABLE IF EXISTS EntryTags;
  DROP TABLE IF EXISTS Tags;
  DROP TABLE IF EXISTS Awards;
  DROP TABLE IF EXISTS Entries;
  DROP TABLE IF EXISTS Mods;

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

  CREATE TABLE Mods (
    modID INT AUTO_INCREMENT PRIMARY KEY,
    brand VARCHAR(20) NOT NULL,
    category VARCHAR(20) NOT NULL,
    cost INT NOT NULL,
    description VARCHAR(100),
    link VARCHAR(30) NOT NULL
  );

  CREATE TABLE EntryMods (
    entryID INT NOT NULL,
    modID INT NOT NULL,
    PRIMARY KEY (entryID, modID),
    FOREIGN KEY (entryID) REFERENCES Entries(entryID) ON DELETE CASCADE,
    FOREIGN KEY (modID) REFERENCES Mods(modID)
  );

  CREATE TABLE EntryPhotos (
    photoID INT AUTO_INCREMENT PRIMARY KEY,
    entryID INT NOT NULL,
    s3Key VARCHAR(255) NOT NULL,
    isMainPhoto BOOLEAN NOT NULL DEFAULT FALSE,
    uploadDate DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (entryID) REFERENCES Entries(entryID) ON DELETE CASCADE
  );

  CREATE TABLE Tags (
    tagID INT AUTO_INCREMENT PRIMARY KEY,
    tagName VARCHAR(30) NOT NULL UNIQUE
  );

  CREATE TABLE EntryTags (
    entryID INT NOT NULL,
    tagID INT NOT NULL,
    PRIMARY KEY (entryID, tagID),
    FOREIGN KEY (entryID) REFERENCES Entries(entryID) ON DELETE CASCADE,
    FOREIGN KEY (tagID) REFERENCES Tags(tagID) ON DELETE CASCADE
  );

  CREATE TABLE Awards (
    awardID INT AUTO_INCREMENT PRIMARY KEY,
    userEmail VARCHAR(60) NOT NULL,
    awardType VARCHAR(20) NOT NULL,
    awardDate DATETIME NOT NULL,
    FOREIGN KEY (userEmail) REFERENCES Users(userEmail) ON DELETE CASCADE
  );

  ALTER TABLE Entries ADD INDEX idx_entries_userEmail (userEmail);
  ALTER TABLE EntryPhotos ADD INDEX idx_entryphotos_entryID (entryID);
  ALTER TABLE EntryMods ADD INDEX idx_entrymods_entryID (entryID), ADD INDEX idx_entrymods_modID (modID);
  ALTER TABLE EntryTags ADD INDEX idx_entrytags_entryID (entryID), ADD INDEX idx_entrytags_tagID (tagID);
  ALTER TABLE Awards ADD INDEX idx_awards_userEmail (userEmail);


  INSERT INTO Mods (brand, category, cost, description, link) VALUES
    ('K&N', 'engine', 80, 'Cold Air Intake', 'https://blah.com/kn'),
    ('Borla', 'engine', 1250, 'Cat-Back Exhaust', 'https://blah.com/borla'),
    ('Recaro', 'interior', 2000, 'Racing Seats', 'https://blah.com/recaro'),
    ('Volk', 'exterior', 3250, 'TE37 Wheels', 'https://blah.com/volk'),
    ('GReddy', 'engine', 7000, 'Turbo Kit', 'https://blah.com/greddy');

  INSERT INTO Entries (
    userEmail, carName, carMake, carModel, carYear, carColor, description,
    totalMods, totalCost, category, region, upvotes,
    engine, transmission, drivetrain, horsepower, torque, viewCount, createdAt, updatedAt
  ) VALUES
    ((SELECT userEmail FROM Users WHERE name = 'Anthony' LIMIT 1), 'Civic', 'Honda', 'Civic', '2015', 'Black', 'JDM Civic build.', 5, 8500.00, 'JDM', 'PNW', 45, 'K20 Turbo', 'Manual', 'FWD', 350, 280, 120, NOW(), NOW()),
    ((SELECT userEmail FROM Users WHERE name = 'Dan' LIMIT 1), 'Mustang', 'Ford', 'Mustang', '2017', 'Blue', 'Custom Mustang GT.', 8, 22500.00, 'Muscle', 'PNW', 132, 'Coyote V8', 'Auto', 'RWD', 480, 420, 240, NOW(), NOW()),
    ((SELECT userEmail FROM Users WHERE name = 'Alex' LIMIT 1), 'WRX STI', 'Subaru', 'WRX', '2019', 'Green', 'Built for rally.', 10, 18500.00, 'Rally', 'Midwest', 95, 'EJ25', 'Manual', 'AWD', 310, 290, 180, NOW(), NOW());

  INSERT INTO Awards (userEmail, awardType, awardDate) VALUES
    ((SELECT userEmail FROM Users WHERE name = 'Anthony' LIMIT 1), 'Best JDM', '2025-02-15'),
    ((SELECT userEmail FROM Users WHERE name = 'Alex' LIMIT 1), 'Editor''s Choice', '2024-03-01'),
    ((SELECT userEmail FROM Users WHERE name = 'Dan' LIMIT 1), 'Best American Muscle', '2022-03-05');

  INSERT INTO Tags (tagName) VALUES
    ('Turbo'), ('Widebody'), ('Show Car'), ('Track'), ('JDM');

  INSERT INTO EntryTags (entryID, tagID) VALUES
    ((SELECT entryID FROM Entries WHERE carName = 'Civic' LIMIT 1), (SELECT tagID FROM Tags WHERE tagName = 'Turbo' LIMIT 1)),
    ((SELECT entryID FROM Entries WHERE carName = 'Civic' LIMIT 1), (SELECT tagID FROM Tags WHERE tagName = 'JDM' LIMIT 1)),
    ((SELECT entryID FROM Entries WHERE carName = 'Mustang' LIMIT 1), (SELECT tagID FROM Tags WHERE tagName = 'Widebody' LIMIT 1)),
    ((SELECT entryID FROM Entries WHERE carName = 'Mustang' LIMIT 1), (SELECT tagID FROM Tags WHERE tagName = 'Show Car' LIMIT 1)),
    ((SELECT entryID FROM Entries WHERE carName = 'WRX STI' LIMIT 1), (SELECT tagID FROM Tags WHERE tagName = 'Turbo' LIMIT 1)),
    ((SELECT entryID FROM Entries WHERE carName = 'WRX STI' LIMIT 1), (SELECT tagID FROM Tags WHERE tagName = 'Track' LIMIT 1));

  INSERT INTO EntryPhotos (entryID, s3Key, isMainPhoto) VALUES
    ((SELECT entryID FROM Entries WHERE carName = 'Civic' LIMIT 1), 's3/civic_main33.jpg', TRUE),
    ((SELECT entryID FROM Entries WHERE carName = 'Civic' LIMIT 1), 's3/civic_side2232.jpg', FALSE),
    ((SELECT entryID FROM Entries WHERE carName = 'Mustang' LIMIT 1), 's3/mustang_main676.jpg', TRUE),
    ((SELECT entryID FROM Entries WHERE carName = 'WRX STI' LIMIT 1), 's3/wrx_main565.jpg', TRUE);

  INSERT INTO EntryMods (entryID, modID) VALUES
    ((SELECT entryID FROM Entries WHERE carName = 'Civic' LIMIT 1), (SELECT modID FROM Mods WHERE brand = 'K&N' LIMIT 1)),
    ((SELECT entryID FROM Entries WHERE carName = 'Civic' LIMIT 1), (SELECT modID FROM Mods WHERE brand = 'Borla' LIMIT 1)),
    ((SELECT entryID FROM Entries WHERE carName = 'Civic' LIMIT 1), (SELECT modID FROM Mods WHERE brand = 'Recaro' LIMIT 1)),
    ((SELECT entryID FROM Entries WHERE carName = 'Civic' LIMIT 1), (SELECT modID FROM Mods WHERE brand = 'Volk' LIMIT 1)),
    ((SELECT entryID FROM Entries WHERE carName = 'Mustang' LIMIT 1), (SELECT modID FROM Mods WHERE brand = 'Borla' LIMIT 1)),
    ((SELECT entryID FROM Entries WHERE carName = 'Mustang' LIMIT 1), (SELECT modID FROM Mods WHERE brand = 'Volk' LIMIT 1)),
    ((SELECT entryID FROM Entries WHERE carName = 'Mustang' LIMIT 1), (SELECT modID FROM Mods WHERE brand = 'GReddy' LIMIT 1)),
    ((SELECT entryID FROM Entries WHERE carName = 'WRX STI' LIMIT 1), (SELECT modID FROM Mods WHERE brand = 'K&N' LIMIT 1)),
    ((SELECT entryID FROM Entries WHERE carName = 'WRX STI' LIMIT 1), (SELECT modID FROM Mods WHERE brand = 'GReddy' LIMIT 1));

  COMMIT;
  SET FOREIGN_KEY_CHECKS = 1;
END //

CREATE PROCEDURE DeleteEntryAndUpdateUser(IN entryIDToDelete INT)
BEGIN
  DECLARE userEmailToUpdate VARCHAR(60);

  SELECT userEmail INTO userEmailToUpdate
  FROM Entries
  WHERE entryID = entryIDToDelete;

  IF userEmailToUpdate IS NOT NULL THEN
    DELETE FROM Entries WHERE entryID = entryIDToDelete;

    UPDATE Users
    SET totalEntries = GREATEST(totalEntries - 1, 0)
    WHERE userEmail = userEmailToUpdate;
  END IF;
END //

DELIMITER ;
