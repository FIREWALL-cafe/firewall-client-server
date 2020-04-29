--------------------------------------------------------------------------------
-- Firewall Cafe Database TEST Insert Statements v1.1
-- April 2020
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
  (1, 'Bananas', CURRENT_TIMESTAMP, '香蕉', '.96', 'testUser455', NULL, '74.56.52.35'),
  (2, 'Bananas', CURRENT_TIMESTAMP, '香蕉', '.96', 'testUser455', NULL, '74.56.52.35'),
	(3, 'Ice Cream', CURRENT_TIMESTAMP, '香蕉', '.96', 'testUser234', NULL, '106.255.52.111')
	(4, 'NYC', CURRENT_TIMESTAMP, '香蕉', '.96', 'testUser234', NULL, '106.255.52.111'),
	(5, 'Censorship', CURRENT_TIMESTAMP, '香蕉', '.96', 'testUser878', NULL, '78.242.52.42'),
	(6, 'Apples', CURRENT_TIMESTAMP, '香蕉', '.96', 'testUser878', NULL, '78.242.52.42'),
	(7, 'Marist College', CURRENT_TIMESTAMP, '香蕉', '.96', 'testUser', NULL, '134.242.52.35');

INSERT INTO votes VALUES
  (1, 'Censored', 'Content appears to be censored.'),
  (2, 'Uncensored', 'Content in both browsers appear to be the same.'),
  (3, 'Bad Translation', 'Search term was not translated correctly.'),
  (4, 'Good Translation', 'Search term appears to have been translated correctly.'),
  (5, 'Lost in Translation', 'Search term lost in translation'),
  (6, 'NSFW', 'Not Safe for Work content.'),
  (7, 'WTF', 'WTF');

INSERT INTO images VALUES
 	(1, true, '/filePath/fileOne.jpg', NULL),
 	(2, false, '/filePath/fileTwo.jpg', NULL),
 	(3, true, '/filePath/fileThree.jpg', NULL),
 	(4, false, '/filePath/fileFour.jpg', NULL),
  (5, true, '/filePath/fileFive.jpg', NULL),
  (6, false, '/filePath/fileSix.jpg', NULL),
  (7, true, '/filePath/fileSeven.jpg', NULL),
  (8, false, '/filePath/fileEight.jpg', NULL),
  (9, true, '/filePath/fileNine.jpg', NULL),
  (10, false, '/filePath/fileTen.jpg', NULL),
  (11, true, '/filePath/fileEleven.jpg', NULL),
  (13, false, '/filePath/fileThirteen.jpg', NULL),
  (14, true, '/filePath/fileFourteen.jpg', NULL),
  (12, false, '/filePath/fileTwelve.jpg', NULL);

INSERT INTO have_images VALUES
  (1,1),
  (2,1),
  (3,2),
  (4,2),
  (5,3),
  (6,3),
  (7,4),
  (8,4),
  (9,5),
  (10,5),
  (11,6),
  (12,6),
  (13,7),
  (14,7);

INSERT INTO have_votes VALUES
  (1, 2, CURRENT_TIMESTAMP, '74.56.52.35', 'testUser455'),
  (4, 2, CURRENT_TIMESTAMP, '74.56.52.35', 'testUser455'),
  (2, 7, CURRENT_TIMESTAMP, '134.242.52.35', 'testUser'),
  (1, 4, CURRENT_TIMESTAMP, '134.242.52.35', 'testUser'),
  (6, 6, CURRENT_TIMESTAMP, '78.242.52.42', 'testUser878'),
  (1, 2, CURRENT_TIMESTAMP, '78.242.52.42', 'testUser878');


INSERT INTO language_pairs VALUES
    (1, 'en', 'ch-zn');

INSERT INTO have_language_pairs VALUES
    (1, 1),
    (1, 2),
    (1, 3),
    (1, 4),
    (1, 5),
    (1, 6),
    (1, 7);
