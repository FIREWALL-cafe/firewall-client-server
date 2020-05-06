--------------------------------------------------------------------------------
-- Firewall Cafe Database Queries and Views v1.1
-- May 2020
-- Collaboration By:
    -- Andrew Bauman (andrewbauman1)
--------------------------------------------------------------------------------
-- File Description
    -- Contains the views and stored procedures for the database to be used
    -- alongside Firewall Cafe (https://github.com/dphiffer/firewall-cafe).
--------------------------------------------------------------------------------
---------------------------------
-- Searches w/o Images & Votes --
---------------------------------

-- Individual search result without images/Votes BY ID
   SELECT *
   FROM Searches s
   WHERE s.search_id = [];

-- Individual search result without images/Votes BY exact search_term_initial (Case Sensitive)

   SELECT *
   FROM Searches s
   WHERE s.search_term_initial = [];

-- All search results of any kind sorted by date (ascending)
   SELECT *
   FROM Searches s
   ORDER BY s.search_timestamp ASC;

-- All search results of any kind sorted by date (descending)
   SELECT *
   FROM Searches s
   ORDER BY s.search_timestamp DESC;

-- All search results matching combined filter statement
    -- Matching a given location
         SELECT *
         FROM Searches s
         WHERE s.search_location = [];

    -- Matching a given year or time range
         SELECT *
         FROM Searches s
         WHERE s.search_timestamp = [];

    -- Matching a given vote category(ies)
         Select s.*, hv.*
         FROM Searches s INNER JOIN Have_Votes hv ON s.search_id = hv.search_id
         WHERE vote_id = [];

    -- Matching a given initial language(s) (BY search_term_initial_language_code)
         SELECT *
         FROM Searches s
         WHERE s.search_term_initial_language_code = [];


    -- Matching a given translation language(s)  (BY search_term_translation_language_code)
         SELECT *
         FROM Searches s
         WHERE s.search_term_translation_language_code = [];

    -- Matching a given initial search engine
         SELECT *
         FROM Searches s
         WHERE s.search_engine_initial = [];

    -- Matching a given initial search engine
         SELECT *
         FROM Searches s
         WHERE s.search_engine_translation = [];

------------
-- Images --
------------

-- All Image Info for All search results
  SELECT s.*, i.*
  FROM Searches s FULL JOIN Images i ON s.search_id = i.search_id

-- Image Info w/ search for individual search result (BY search_id)
  SELECT s.*, i.*
  FROM Searches s FULL JOIN Images i ON s.search_id = i.search_id
  WHERE s.search_id = [];

-- Image Info for individual search result (BY search_term_initial)
  SELECT s.*, i.*
  FROM Searches s FULL JOIN Images i ON s.search_id = i.search_id
  WHERE s.search_term_initial = [];

-- Image Info ONLY for individual search result (BY search_id)
  SELECT i.*
  FROM Searches s FULL JOIN Images i ON s.search_id = i.search_id
  WHERE s.search_id = [];


-----------
-- Votes --
-----------

-- All Votes with Search Info (Only contains searches with votes b/c Inner Join)
  SELECT s.*, hv.*
  FROM Searches s INNER JOIN Have_Votes hv ON s.search_id = hv.search_id;

-- Individual vote (BY vote_id)
  SELECT s.*, hv.*
  FROM Searches s INNER JOIN Have_Votes hv ON s.search_id = hv.search_id;
  WHERE hv.vote_id = []

-- Consolidated Counts for each type of vote_id (for ALL SEARCHES)
  SELECT s.*,
    COUNT(hv.*) total,
    COUNT(case when vote_id = '1' then 1 end) AS Censored,
    COUNT(case when vote_id = '2' then 1 end) AS Uncensored,
    COUNT(case when vote_id = '3' then 1 end) AS BadTranslation,
    COUNT(case when vote_id = '4' then 1 end) AS GoodTranslation,
    COUNT(case when vote_id = '5' then 1 end) AS LostInTranslation,
    COUNT(case when vote_id = '6' then 1 end) AS NSFW,
    COUNT(case when vote_id = '7' then 1 end) AS WTF
  FROM searches s FULL OUTER JOIN have_votes hv ON s.search_id = hv.search_id
  GROUP BY s.search_id;

-- Consolidated Counts for each type of vote_id (for only searches with votes)
  SELECT s.*,
    COUNT(hv.*) total,
    COUNT(case when vote_id = '1' then 1 end) AS Censored,
    COUNT(case when vote_id = '2' then 1 end) AS Uncensored,
    COUNT(case when vote_id = '3' then 1 end) AS BadTranslation,
    COUNT(case when vote_id = '4' then 1 end) AS GoodTranslation,
    COUNT(case when vote_id = '5' then 1 end) AS LostInTranslation,
    COUNT(case when vote_id = '6' then 1 end) AS NSFW,
    COUNT(case when vote_id = '7' then 1 end) AS WTF
  FROM searches s INNER JOIN have_votes hv ON s.search_id = hv.search_id
  GROUP BY s.search_id;

-- Returns all Censored Searches. --
  SELECT s.*, COUNT(*) as "censored_votes"
  FROM searches s INNER JOIN Have_Votes hv on s.search_id = hv.search_id
  WHERE hv.vote_id = 1
  GROUP BY s.search_id;

-- Returns all Uncensored Searches. --
  SELECT s.*, COUNT(*) as "uncensored_votes"
  FROM searches s INNER JOIN Have_Votes hv on s.search_id = hv.search_id
  WHERE hv.vote_id = 2
  GROUP BY s.search_id;

-- Returns all Bad Translation Searches. --
  SELECT s.*, COUNT(*) as "bad_translation_votes"
  FROM searches s INNER JOIN Have_Votes hv on s.search_id = hv.search_id
  WHERE hv.vote_id = 3
  GROUP BY s.search_id;

-- Returns all Good Translation Searches. --
  SELECT s.*, COUNT(*) as "good_translation_votes"
  FROM searches s INNER JOIN Have_Votes hv on s.search_id = hv.search_id
  WHERE hv.vote_id = 4
  GROUP BY s.search_id;

-- Returns all Lost In Translation Searches. --
  SELECT s.*, COUNT(*) as "lost_in_translation_votes"
  FROM searches s INNER JOIN Have_Votes hv on s.search_id = hv.search_id
  WHERE hv.vote_id = 5
  GROUP BY s.search_id;

-- Returns all NSFW Searches. --
  SELECT s.*, COUNT(*) as "nsfw_votes"
  FROM searches s INNER JOIN Have_Votes hv on s.search_id = hv.search_id
  WHERE hv.vote_id = 6
  GROUP BY s.search_id;

-- Returns all WTF Searches. --
  SELECT s.*, COUNT(*) as "wtf_votes"
  FROM searches s INNER JOIN Have_Votes hv on s.search_id = hv.search_id
  WHERE hv.vote_id = 7
  GROUP BY s.search_id;

---------------
--- Hybrids ---
---------------

-- All Search Results With Vote Counts & Image Info
  SELECT s.*, i.image_id, i.image_path, i.image_source, i.image_rank,
    COUNT(hv.*) total,
    COUNT(case when vote_id = '1' then 1 end) AS Censored,
    COUNT(case when vote_id = '2' then 1 end) AS Uncensored,
    COUNT(case when vote_id = '3' then 1 end) AS BadTranslation,
    COUNT(case when vote_id = '4' then 1 end) AS GoodTranslation,
    COUNT(case when vote_id = '5' then 1 end) AS LostInTranslation,
    COUNT(case when vote_id = '6' then 1 end) AS NSFW,
    COUNT(case when vote_id = '7' then 1 end) AS WTF
  FROM searches s FULL OUTER JOIN have_votes hv ON s.search_id = hv.search_id
  FULL OUTER JOIN Images i on s.search_id = i.search_id
  GROUP BY s.search_id, i.image_id, i.image_path, i.image_source, i.image_rank;


-- ISSUE: CARTESIAN PRODUCTS: Should retrieve votes and images separately.

  --SELECT s.*, i.*, hv.*
  --FROM Searches s FULL JOIN Images i ON s.search_id = i.search_id
  --FULL JOIN Have_Votes hv ON s.search_id = hv.search_id
  --WHERE s.search_term_initial = [];
