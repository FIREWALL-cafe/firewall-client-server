--------------------------------------------------------------------------------
-- Firewall Cafe Database Configuration v1.1
-- April 2020
-- Collaboration By:
    -- Andrew Bauman (andrewbauman1)
    -- Peter Behr (peterbehr)
--------------------------------------------------------------------------------
-- File Description
    -- Contains the deletion and creation statements for the database to be used
    -- alongside Firewall Cafe (https://github.com/dphiffer/firewall-cafe).
--------------------------------------------------------------------------------

--------------
-- Deletion --
--------------
DROP TABLE IF EXISTS Have_Votes;
DROP TABLE IF EXISTS Have_Images;
DROP TABLE IF EXISTS Have_Language_Pairs;
DROP TABLE IF EXISTS Votes;
DROP TABLE IF EXISTS Images;
DROP TABLE IF EXISTS Searches;

--------------
-- Creation --
--------------
CREATE TABLE Searches (
  search_id SERIAL PRIMARY KEY,
  search_timestamp TIMESTAMP,
  search_location TEXT,
  search_ip_address TEXT,
  search_client_name TEXT,
  search_engine_initial TEXT,
  search_engine_translation TEXT,
  search_term_initial TEXT,
  search_term_initial_language_code TEXT,
  search_term_initial_language_confidence FLOAT,
  search_term_initial_language_alternate_code TEXT,
  search_term_translation TEXT,
  search_term_translation_language_code TEXT,
  search_term_status_banned BOOLEAN,
  search_term_status_sensitive BOOLEAN,
  copyright_takedown BOOLEAN,
  data_schema_initial INTEGER,
  legacy_search_term_popularity INTEGER,
  legacy_data_migration_unflattened BOOLEAN,
  legacy_data_migration_initial_post_id INTEGER
);

CREATE TABLE Images (
  image_id SERIAL PRIMARY KEY,
  image_source TEXT, -- Source search engine --
  image_rank INTEGER, -- Position of image in source search engine results --
  image_url TEXT, -- Original internet URL --
  image_path TEXT, -- Local path to stored image file --
  search_id SERIAL NOT NULL REFERENCES Searches(search_id)
);

CREATE TABLE Votes (
  vote_id SERIAL PRIMARY KEY,
  vote_value TEXT,
  vote_timestamp TIMESTAMP,
  vote_ip_address TEXT,
  vote_client_name TEXT,
  search_id SERIAL NOT NULL REFERENCES Searches(search_id)
);

CREATE TABLE Have_Votes (
  vote_id      serial not null references Votes(vote_id),
  search_id    serial not null references Searches(search_id),
  vote_time    timestamp,
  ip_address   text,
  client_name  text,
  primary key(vote_id, search_id, vote_time)
);
