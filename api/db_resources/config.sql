--------------
-- Deletion --
--------------
DROP TABLE IF EXISTS Have_Votes;
DROP TABLE IF EXISTS Votes;
DROP TABLE IF EXISTS Images;
DROP TABLE IF EXISTS Searches;

--------------
-- Creation --
--------------
-- Queries --
CREATE TABLE Searches (
  search_id                                   serial not null,
  search_timestamp                            timestamp,
  search_location                             text,
  search_ip_address                           text,
  search_client_name                          text,
  search_engine_initial                       text,
  search_engine_translation                   text,
  search_term_initial                         text,
  search_term_initial_language_code           text,
  search_term_initial_lanuage_confidence      float,
  search_term_initial_language_alternate_code text,
  search_term_translation                     text,
  search_term_translation_language_code       text,
  search_term_status_banned                   boolean,
  search_term_status_sensitive                boolean,
  data_schema_initial                         integer,
  legacy_search_term_popularity               integer,
  legacy_data_migration_unflattened           boolean,
  legacy_data_migration_initial_post_id       integer,
  primary key(search_id)
);

-- Images --
CREATE TABLE Images (
  image_id         serial,
  search_id        serial not null references Searches(search_id),
  image_source     text,
  image_path       text,
  image_rank       text,
  primary key(image_id, search_id)
);

-- Ratings --
CREATE TABLE Votes (
  vote_id    serial,
  vote_name  text,
  vote_desc  text,
  primary key(vote_id)
);

-- Have_Ratings --
CREATE TABLE Have_Votes (
  vote_id           serial not null references Votes(vote_id),
  search_id         serial not null references Searches(search_id),
  vote_timestamp    timestamp,
  vote_client_name  text,
  vote_ip_address   text,
  primary key(vote_id, search_id, vote_timestamp)
);
