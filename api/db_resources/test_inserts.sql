--------------------------------------------------------------------------------
-- Firewall Cafe Database TEST Insert Statements v1.1
-- May 2020
-- Collaboration By:
    -- Andrew Bauman (andrewbauman1)
--------------------------------------------------------------------------------
-- File Description
    -- Contains the INSERT statements for the test database to be used
    -- alongside Firewall Cafe (https://github.com/dphiffer/firewall-cafe).
--------------------------------------------------------------------------------

---------------------------------------
--INSERT STATEMENTS FOR TEST Database--
---------------------------------------

INSERT INTO searches VALUES
  (1, CURRENT_TIMESTAMP, 'Location 1', '74.56.52.35', 'testUser111', 'Google', 'Baidu', 'Bananas', 'en', '.96', NULL, '香蕉', 'ch-zn', 'false', 'false', NULL, NULL, NULL, NULL ),
  (2, CURRENT_TIMESTAMP, 'Location 1', '74.56.53.36', 'testUser222', 'Google', 'Baidu', 'Ice Cream', 'en', '.96', NULL, '香蕉', 'ch-zn', 'true', 'false', NULL, NULL, NULL, NULL ),
  (3, CURRENT_TIMESTAMP, 'Location 1', '74.56.54.37', 'testUser333', 'Google', 'Baidu', 'Marist', 'en', '.96', NULL, '香蕉', 'ch-zn', 'false', 'true', NULL, NULL, NULL, NULL ),
  (4, CURRENT_TIMESTAMP, 'Location 2', '128.56.33.22', 'testUser444', 'Google', 'Baidu', 'Music', 'en', '.96', NULL, '香蕉', 'ch-zn', 'false', 'false', NULL, NULL, NULL, NULL ),
  (5, CURRENT_TIMESTAMP, 'Location 2', '128.56.33.22', 'testUser444', 'Google', 'Baidu', 'Coffee', 'en', '.96', NULL, '香蕉', 'ch-zn', 'false', 'false', NULL, NULL, NULL, NULL ),
  (6, CURRENT_TIMESTAMP, 'Location 2', '128.56.33.44', 'testUser555', 'Google', 'Baidu', 'Spongebob', 'en', '.96', NULL, '香蕉', 'ch-zn', 'true', 'false', NULL, NULL, NULL, NULL ),
  (7, CURRENT_TIMESTAMP, NULL, '123.456.789.890', 'testUser777', 'Google', 'Baidu', 'Apples', 'en', '.96', NULL, '香蕉', 'ch-zn', 'false', 'true', NULL, NULL, NULL, NULL );

INSERT INTO votes VALUES
  (1, 'Censored', 'Content appears to be censored.'),
  (2, 'Uncensored', 'Content in both browsers appear to be the same.'),
  (3, 'Bad Translation', 'Search term was not translated correctly.'),
  (4, 'Good Translation', 'Search term appears to have been translated correctly.'),
  (5, 'Lost in Translation', 'Search term lost in translation'),
  (6, 'NSFW', 'Not Safe for Work content.'),
  (7, 'WTF', 'WTF');

INSERT INTO images VALUES
 	(1, 1, 'Google', '/filePath/fileOne.jpg', NULL),
 	(2, 1, 'Baidu', '/filePath/fileTwo.jpg', NULL),
 	(3, 2, 'Google', '/filePath/fileThree.jpg', NULL),
 	(4, 2, 'Baidu', '/filePath/fileFour.jpg', NULL),
  (5, 3, 'Google', '/filePath/fileFive.jpg', NULL),
  (6, 3, 'Baidu', '/filePath/fileSix.jpg', NULL),
  (7, 4, 'Google', '/filePath/fileSeven.jpg', NULL),
  (8, 4, 'Baidu', '/filePath/fileEight.jpg', NULL),
  (9, 5, 'Google', '/filePath/fileNine.jpg', NULL),
  (10, 5, 'Baidu', '/filePath/fileTen.jpg', NULL),
  (11, 6, 'Google', '/filePath/fileEleven.jpg', NULL),
  (13, 6, 'Baidu', '/filePath/fileThirteen.jpg', NULL),
  (14, 7, 'Google', '/filePath/fileFourteen.jpg', NULL),
  (12, 7, 'Baidu', '/filePath/fileTwelve.jpg', NULL);

INSERT INTO have_votes VALUES
  (1, 2, CURRENT_TIMESTAMP, 'testUser455', '74.56.52.35'),
  (4, 2, CURRENT_TIMESTAMP, 'testUser455', '74.56.52.35'),
  (2, 7, CURRENT_TIMESTAMP, 'testUser', '134.242.52.35'),
  (1, 4, CURRENT_TIMESTAMP, 'testUser', '134.242.52.35'),
  (6, 6, CURRENT_TIMESTAMP, 'testUser878', '78.242.52.42');
