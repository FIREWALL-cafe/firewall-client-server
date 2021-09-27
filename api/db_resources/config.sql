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
	search_term_initial_language_confidence     decimal,
	search_term_initial_language_alternate_code text,
	search_term_translation                     text,
	search_term_translation_language_code       text,
	search_term_status_banned                   boolean,
	search_term_status_sensitive                boolean,
	search_schema_initial                       integer,
	wordpress_search_term_popularity            integer,
	wordpress_copyright_takedown                boolean,
	wordpress_unflattened                       boolean,
	wordpress_regular_post_id                   integer,
	wordpress_search_result_post_id             integer,
	wordpress_search_result_post_slug           text,
	primary key(search_id)
);

-- Images --
CREATE TABLE images (
	image_id                                serial not null,
	search_id                               serial not null references searches(search_id),
	image_search_engine                     text,
	image_href                              text,
    image_href_original                     text,
	image_rank                              text,
	image_mime_type                         text,
	image_data                              bytea,
	wordpress_attachment_post_id            integer,
	wordpress_attachment_file_path          text,
	primary key(image_id)
);

-- Votes --
CREATE TABLE votes (
	vote_id             serial not null,
	vote_name           text,
	vote_description    text,
	primary key(vote_id)
);

-- Populate votes table with fixed data --
INSERT INTO votes VALUES
	(1, 'Censored', 'Content appears to be censored.'),
	(2, 'Uncensored', 'Content in both browsers appear to be the same.'),
	(3, 'Bad Translation', 'Search term was not translated correctly.'),
	(4, 'Good Translation', 'Search term appears to have been translated correctly.'),
	(5, 'Lost in Translation', 'Search term lost in translation'),
	(6, 'NSFW', 'Not Safe for Work content.'),
	(7, 'WTF', 'WTF');

-- Have Votes --
CREATE TABLE have_votes (
	vote_serial       serial not null,
	vote_id           serial not null references votes(vote_id),
	search_id         serial not null references searches(search_id),
	vote_timestamp    timestamp,
	vote_client_name  text,
	vote_ip_address   text,
	primary key(vote_serial)
);
