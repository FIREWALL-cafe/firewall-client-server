--------------------------------------------------------------------------------
-- Firewall Cafe Database Queries and Views v1.1
-- April 2020
-- Collaboration By:
    -- Andrew Bauman (andrewbauman1)
--------------------------------------------------------------------------------
-- File Description
    -- Contains the views and stored procedures for the database to be used
    -- alongside Firewall Cafe (https://github.com/dphiffer/firewall-cafe).
--------------------------------------------------------------------------------
--------------------------------
          -- Views --
--------------------------------

-- Returns all searches with their cooresponding image paths. --
CREATE VIEW v_SearchInfo AS
   SELECT s.search_id, s.search_text, s.translation, s.confidence, s.client_name,
          s.search_location, s.search_time, s.ip_address AS 'Search IP', i.image_id, 
          i.image_source, i.image_path, v.vote_time as
   FROM searches s INNER JOIN have_images h ON s.search_id = h.search_id
        INNER JOIN images i ON h.image_id = i.image_id
   GROUP BY s.search_id, i.image_id
   ORDER BY s.search_id ASC;


-- v_votes: Calls all individual vote records for searches that have votes associated with them. --
CREATE VIEW v_Votes AS
  SELECT searches.search_id, search_text, translation, votes.vote_name,
         have_votes.vote_time as 'vote timestamp', have_votes.client_name as 'Voter'
  FROM searches, have_votes, votes
  WHERE searches.search_id = have_votes.search_id
  AND have_votes.vote_id = votes.vote_id;

  -- Returns all searches with their cooresponding image paths. --
  CREATE VIEW v_Images AS
     SELECT s.search_id, s.search_text, s.translation, s.confidence, s.client_name,
            s.search_location, s.search_time, i.image_id, i.image_source, i.image_path
     FROM searches s INNER JOIN have_images h ON s.search_id = h.search_id
          INNER JOIN images i ON h.image_id = i.image_id
     GROUP BY s.search_id, i.image_id
     ORDER BY s.search_id ASC;

-- Returns Only Vote Counts for Searches With Votes Associated with them. --
CREATE VIEW v_VoteCounts AS
SELECT s.search_id, s.search_text, s.translation, s.confidence,
     COUNT(have_votes.*) total,
     COUNT(case when vote_id = '1' then 1 end) AS Censored,
     COUNT(case when vote_id = '2' then 1 end) AS Uncensored,
     COUNT(case when vote_id = '3' then 1 end) AS BadTranslation,
     COUNT(case when vote_id = '4' then 1 end) AS GoodTranslation,
     COUNT(case when vote_id = '5' then 1 end) AS LostInTranslation,
     COUNT(case when vote_id = '6' then 1 end) AS NSFW,
     COUNT(case when vote_id = '7' then 1 end) AS WTF
  FROM searches s RIGHT OUTER JOIN have_votes ON s.search_id = have_votes.search_id
  GROUP BY s.search_id;

-- Returns All Searches With Vote Counts, Whether they have votes or not. --
  CREATE VIEW v_VoteCountsAllSearches AS
  SELECT s.search_id, s.search_text, s.translation, s.confidence,
       COUNT(have_votes.*) total,
       COUNT(case when vote_id = '1' then 1 end) AS Censored,
       COUNT(case when vote_id = '2' then 1 end) AS Uncensored,
       COUNT(case when vote_id = '3' then 1 end) AS BadTranslation,
       COUNT(case when vote_id = '4' then 1 end) AS GoodTranslation,
       COUNT(case when vote_id = '5' then 1 end) AS LostInTranslation,
       COUNT(case when vote_id = '6' then 1 end) AS NSFW,
       COUNT(case when vote_id = '7' then 1 end) AS WTF
    FROM searches s FULL OUTER JOIN have_votes ON s.search_id = have_votes.search_id
    GROUP BY s.search_id;

-- Returns all Censored Searches. --
CREATE VIEW v_CensoredCount AS
  SELECT search_id, COUNT(*) as "Censored"
  FROM have_votes
  WHERE vote_id = 1
  GROUP BY search_id;

-- Returns all Uncensored Searches. --
CREATE VIEW v_UncensoredCount AS
    SELECT search_id, COUNT(*) as "Uncensored"
    FROM have_votes
    WHERE vote_id = 2
    GROUP BY search_id;

-- Returns all Bad Translation searches. --
CREATE VIEW v_BadTranslationCount AS
    SELECT search_id, COUNT(*) as "Bad Translation"
    FROM have_votes
    WHERE vote_id = 3
    GROUP BY search_id;

-- Returns all Good Translation searches. --
CREATE VIEW v_GoodTranslationCount AS
    SELECT search_id, COUNT(*) as "Good Translation"
    FROM have_votes
    WHERE vote_id = 4
    GROUP BY search_id;

-- Returns all Lost In Translation searches. --
CREATE VIEW v_LostInTranslationCount AS
    SELECT search_id, COUNT(*) as "Lost In Translation"
    FROM have_votes
    WHERE vote_id = 5
    GROUP BY search_id;

-- Returns all NSFW searches. --
CREATE VIEW v_NSFWCount AS
    SELECT search_id, COUNT(*) as "NSFW"
    FROM have_votes
    WHERE vote_id = 6
    GROUP BY search_id;

-- Returns all WTF searches. --
CREATE VIEW v_WTFCount AS
   SELECT search_id, COUNT(*) as "WTF"
   FROM have_votes
   WHERE vote_id = 7
   GROUP BY search_id;

--------------------------------
   -- Stored Procedures --
--------------------------------

------------------------------------------------------------------------
-- Get votes, given a search_id (Uses v_AllCounts NOT v_SearchCounts) --
-- Usage:
--  SELECT getVotes('2', 'results');
--  FETCH ALL FROM results;
------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION getVotes(int, REFCURSOR) RETURNS REFCURSOR AS
$$
DECLARE
    inputNumber   int       := $1;
    resultSet     REFCURSOR := $2;
BEGIN
    OPEN resultSet FOR
         SELECT *
         FROM v_VoteCountsAllSearches
         WHERE search_id = inputNumber;
    RETURN resultSet;
END;
$$
LANGUAGE plpgsql;

------------------------------------------------------------------------
-- Get images, given a search_id --
-- Usage:
--  SELECT getVotes('2', 'results');
--  FETCH ALL FROM results;
------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION getImages(int, REFCURSOR) RETURNS REFCURSOR AS
$$
DECLARE
    inputNumber   int       := $1;
    resultSet     REFCURSOR := $2;
BEGIN
    OPEN resultSet FOR
         SELECT *
         FROM v_Images
         WHERE search_id = inputNumber;
    RETURN resultSet;
END;
$$
LANGUAGE plpgsql;
