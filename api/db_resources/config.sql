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
DROP TABLE IF EXISTS Language_Pairs;
DROP TABLE IF EXISTS Searches;

--------------
-- Creation --
--------------
-- Queries --
CREATE TABLE Searches (
  search_id       serial not null,
  search_text     text,
  search_time     timestamp,
  translation     text,
  confidence      float,
  client_name     text,
  search_location text,
  ip_address      text,
  primary key(search_id)
);

-- Types --
CREATE TABLE Language_Pairs (
  pair_id     serial not null,
  langOne     text,
  langTwo     text,
  primary key(pair_id)
);

-- Images --
CREATE TABLE Images (
  image_id         serial,
  image_source     boolean,
  image_path       text,
  image_metadata   text,
  primary key(image_id)
);

-- Ratings --
CREATE TABLE Votes (
  vote_id    serial,
  vote_name  text,
  vote_desc  text,
  primary key(vote_id)
);

-- Have_Type --
CREATE TABLE Have_Language_Pairs (
  pair_id      serial not null references Language_Pairs(pair_id),
  search_id    serial not null references Searches(search_id),
  primary key(pair_id, search_id)
);

-- Have_Images --
CREATE TABLE Have_Images (
  image_id     serial not null references Images(image_id),
  search_id    serial not null references Searches(search_id),
  primary key(image_id, search_id)
);

-- Have_Ratings --
CREATE TABLE Have_Votes (
  vote_id      serial not null references Votes(vote_id),
  search_id    serial not null references Searches(search_id),
  vote_time    timestamp,
  ip_address   text,
  client_name  text,
  primary key(vote_id, search_id, vote_time)
);
