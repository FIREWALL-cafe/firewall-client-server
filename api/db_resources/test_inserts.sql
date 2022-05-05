---------------------------------------
--INSERT STATEMENTS FOR TEST Database--
---------------------------------------

INSERT INTO searches VALUES
  (1, 1651457147437, 'Location 1', '74.56.52.35', 'testUser111', 'Google', 'Baidu', 'Bananas', 'en', '.96', NULL, '香蕉', 'zh-CN', 'false', 'false', NULL, NULL, NULL, NULL ),
  (2, 1651457147437, 'Location 1', '74.56.53.36', 'testUser222', 'Google', 'Baidu', 'Ice Cream', 'en', '.96', NULL, '香蕉', 'zh-CN', 'true', 'false', NULL, NULL, NULL, NULL ),
  (3, 1651457147437, 'Location 1', '74.56.54.37', 'testUser333', 'Google', 'Baidu', 'Marist', 'en', '.96', NULL, '香蕉', 'zh-CN', 'false', 'true', NULL, NULL, NULL, NULL ),
  (4, 1651457147437, 'Location 2', '128.56.33.22', 'testUser444', 'Google', 'Baidu', 'Music', 'en', '.96', NULL, '香蕉', 'zh-CN', 'false', 'false', NULL, NULL, NULL, NULL ),
  (5, 1651457147437, 'Location 2', '128.56.33.22', 'testUser444', 'Google', 'Baidu', 'Coffee', 'en', '.96', NULL, '香蕉', 'zh-CN', 'false', 'false', NULL, NULL, NULL, NULL ),
  (6, 1651457147437, 'Location 2', '128.56.33.44', 'testUser555', 'Google', 'Baidu', 'Spongebob', 'en', '.96', NULL, '香蕉', 'zh-CN', 'true', 'false', NULL, NULL, NULL, NULL ),
  (7, NULL, NULL, '123.456.789.890', 'testUser777', 'Google', 'Baidu', 'Apples', 'en', '.96', NULL, '香蕉', 'zh-CN', 'false', 'true', NULL, NULL, NULL, NULL );

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
  (1, 2, 1651457147437, 1, '74.56.52.35'),
  (4, 2, 1651457147437, 1, '74.56.52.35'),
  (2, 7, 1651457147437, 2, '134.242.52.35'),
  (1, 4, 1651457147437, 2, '134.242.52.35'),
  (6, 6, 1651457147437, 3, '78.242.52.42');
