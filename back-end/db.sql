CREATE DATABASE IF NOT EXISTS tolls_2025;

USE tolls_2025;


DROP TABLE IF EXISTS passes;
DROP TABLE IF EXISTS toll_stations;

CREATE TABLE passes (
    `ID` INT AUTO_INCREMENT PRIMARY KEY,
    `timestamp` VARCHAR(255),
    `tollID` VARCHAR(15),
    `tollOpID` VARCHAR(5),
    `tagRef` VARCHAR(100),
    `tagHomeID` VARCHAR(10),
    `charge` DECIMAL(5,5),
    `passType` VARCHAR(10)
);

CREATE TABLE toll_stations (
    `ID` INT AUTO_INCREMENT PRIMARY KEY,
    `OpID` VARCHAR(255),
    `Operator` VARCHAR(100),
    `tollID` VARCHAR(100),
    `Name` VARCHAR(100),
    `PM` VARCHAR(10),
    `Locality` VARCHAR(255),
    `Road` VARCHAR(255),
    `Lat` DECIMAL(10,6),
    `Long` DECIMAL(10,6),
    `Email` VARCHAR(255),
    `Price1` DECIMAL(5,5),
    `Price2` DECIMAL(5,5),
    `Price3` DECIMAL(5,5)
);

DELIMITER $$

CREATE TRIGGER extract_category_letters
BEFORE INSERT ON passes
FOR EACH ROW
BEGIN
    DECLARE v_letter_part VARCHAR(3);

    -- Extract the letter part (2 or 3 letters) from tollID
    SET v_letter_part = REGEXP_SUBSTR(NEW.tollID, '^[A-Z]{2,3}');

    -- Validate the format
    IF v_letter_part IS NULL THEN
        SIGNAL SQLSTATE '45000' 
            SET MESSAGE_TEXT = 'Invalid tollID format. Must start with 2 or 3 letters.';
    END IF;

    -- Set the extracted letters as tollOpID
    SET NEW.tollOpID = v_letter_part;

    -- Compare tollOpID with tagHomeID and set passType accordingly
    IF NEW.tollOpID = NEW.tagHomeID THEN
        SET NEW.passType = 'Home';
    ELSE
        SET NEW.passType = 'Visitor';
    END IF;
END$$

DELIMITER ;

