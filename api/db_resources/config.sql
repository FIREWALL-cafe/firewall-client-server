--------------
-- Deletion --
--------------
DROP TABLE IF EXISTS have_votes;
DROP TABLE IF EXISTS votes;
DROP TABLE IF EXISTS images;
DROP TABLE IF EXISTS searches;

--------------
-- Creation --
--------------

-- Queries --
CREATE TABLE searches (
	search_id                                   serial not null,
	search_timestamp                            timestamp,
	search_location                             text,
	search_ip_address                           text,
	search_client_name                          text,
	search_engine_initial                       text,
	search_engine_translation                   text,
	search_term_initial                         text,
	search_term_initial_language_code           text,
	search_term_initial_language_confidence     float,
	search_term_initial_language_alternate_code text,
	search_term_translation                     text,
	search_term_translation_language_code       text,
	search_term_status_banned                   boolean,
	search_term_status_sensitive                boolean,
	search_schema_initial                       integer,
	legacy_search_term_popularity               integer,
	legacy_migration_unflattened           			boolean,
	legacy_migration_wordpress_id      				 	integer,
	legacy_migration_wordpress_timestamp 				INTEGER,
	primary key(search_id)
);

-- images --
CREATE TABLE images (
	image_id         serial,
	search_id        serial not null references searches(search_id),
	image_source     text,
	image_path       text,
	image_rank       text,
	primary key(image_id, search_id)
);

-- votes --
CREATE TABLE votes (
	vote_id    serial,
	vote_name  text,
	vote_desc  text,
	primary key(vote_id)
);

-- have_votes --
CREATE TABLE have_votes (
	vote_id           serial not null references votes(vote_id),
	search_id         serial not null references searches(search_id),
	vote_timestamp    timestamp,
	vote_client_name  text,
	vote_ip_address   text,
	primary key(vote_id, search_id, vote_timestamp)
);
