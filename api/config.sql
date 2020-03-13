--------------------------------------------------------------------------------
-- Firewall Cafe Database Configuration v1.0
-- March 2020
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
DROP TABLE IF EXISTS Have_Ratings;
DROP TABLE IF EXISTS Have_Images;
DROP TABLE IF EXISTS Have_Type;
DROP TABLE IF EXISTS Ratings;
DROP TABLE IF EXISTS Images;
DROP TABLE IF EXISTS Languages;
DROP TABLE IF EXISTS Queries;

--------------
-- Creation --
--------------
-- Queries --
CREATE TABLE Queries (
  query_id    serial not null,
  queryText   text not null,
  queryTime   timestamp not null,
  translation text not null,
  confidence  float not null,
  user        text not null,
  expo        text,
  primary key(query_id)
);

-- Types --
CREATE TABLE Types (
  type_id     serial not null,
  langOne     text not null,
  langTwo     text not null,
  primary key(lang_id)
);

-- Images --
CREATE TABLE Images (
  image_id    serial not null,
  imageSource boolean not null,
  imagePath   text not null,
  primary key(image_id)
);

-- Ratings --
CREATE TABLE Ratings (
  rating_id   serial not null,
  ratingName  text not null,
  ratingDesc  text,
  primary key(rating_id)
);

-- Have_Type --
CREATE TABLE Have_Type (
  type_id     serial not null references Types(type_id),
  query_id    serial not null references Queries(query_id),
  primary key(type_id, query_id)
);

-- Have_Images --
CREATE TABLE Have_Images (
  image_id    serial not null references Images(image_id),
  query_id    serial not null references Queries(queries_id),
  primary key(image_id, query_id)
);

-- Have_Ratings --
CREATE TABLE Have_Ratings (
  rating_id   serial not null references Ratings(rating_id),
  query_id    serial not null references Queries(query_id),
  ratingTime  timestamp not null,
  ipAddress   text not null,
  user        text,
  primary key(rating_id, query_id)
);
