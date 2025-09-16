--
-- PostgreSQL database dump
--

-- Dumped from database version 15.13 (Postgres.app)
-- Dumped by pg_dump version 15.13 (Postgres.app)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: pg_trgm; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pg_trgm WITH SCHEMA public;


--
-- Name: EXTENSION pg_trgm; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION pg_trgm IS 'text similarity measurement and index searching based on trigrams';


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: have_votes; Type: TABLE; Schema: public; Owner: ummonai
--

CREATE TABLE public.have_votes (
    vote_serial integer NOT NULL,
    vote_id integer NOT NULL,
    search_id integer NOT NULL,
    vote_timestamp bigint,
    vote_client_name text,
    vote_ip_address text,
    vote_country character varying(100),
    vote_country_code character varying(2),
    vote_city character varying(100)
);


ALTER TABLE public.have_votes OWNER TO ummonai;

--
-- Name: have_votes_search_id_seq; Type: SEQUENCE; Schema: public; Owner: ummonai
--

CREATE SEQUENCE public.have_votes_search_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.have_votes_search_id_seq OWNER TO ummonai;

--
-- Name: have_votes_search_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: ummonai
--

ALTER SEQUENCE public.have_votes_search_id_seq OWNED BY public.have_votes.search_id;


--
-- Name: have_votes_vote_id_seq; Type: SEQUENCE; Schema: public; Owner: ummonai
--

CREATE SEQUENCE public.have_votes_vote_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.have_votes_vote_id_seq OWNER TO ummonai;

--
-- Name: have_votes_vote_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: ummonai
--

ALTER SEQUENCE public.have_votes_vote_id_seq OWNED BY public.have_votes.vote_id;


--
-- Name: have_votes_vote_serial_seq; Type: SEQUENCE; Schema: public; Owner: ummonai
--

CREATE SEQUENCE public.have_votes_vote_serial_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.have_votes_vote_serial_seq OWNER TO ummonai;

--
-- Name: have_votes_vote_serial_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: ummonai
--

ALTER SEQUENCE public.have_votes_vote_serial_seq OWNED BY public.have_votes.vote_serial;


--
-- Name: images; Type: TABLE; Schema: public; Owner: ummonai
--

CREATE TABLE public.images (
    image_id integer NOT NULL,
    search_id integer NOT NULL,
    image_search_engine text,
    image_href text,
    image_href_original text,
    image_rank text,
    image_mime_type text,
    image_data bytea,
    wordpress_attachment_post_id integer,
    wordpress_attachment_file_path text
);


ALTER TABLE public.images OWNER TO ummonai;

--
-- Name: images_image_id_seq; Type: SEQUENCE; Schema: public; Owner: ummonai
--

CREATE SEQUENCE public.images_image_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.images_image_id_seq OWNER TO ummonai;


--
-- Name: searches; Type: TABLE; Schema: public; Owner: ummonai
--

CREATE TABLE public.searches (
    search_id integer NOT NULL,
    search_timestamp bigint,
    search_location text,
    search_ip_address text,
    search_client_name text,
    search_engine_initial text,
    search_engine_translation text,
    search_term_initial text,
    search_term_initial_language_code text,
    search_term_initial_language_confidence numeric,
    search_term_initial_language_alternate_code text,
    search_term_translation text,
    search_term_translation_language_code text,
    search_term_status_banned boolean,
    search_term_status_sensitive boolean,
    search_schema_initial integer,
    wordpress_search_term_popularity integer,
    wordpress_copyright_takedown boolean,
    wordpress_unflattened boolean,
    wordpress_regular_post_id integer,
    wordpress_search_result_post_id integer,
    wordpress_search_result_post_slug text,
    search_country character varying(100),
    search_country_code character varying(2),
    search_region character varying(100),
    search_city character varying(100),
    search_latitude numeric(10,8),
    search_longitude numeric(11,8)
);


ALTER TABLE public.searches OWNER TO ummonai;

--
-- Name: searches_location_backup; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.searches_location_backup (
    search_id integer,
    search_location text,
    search_country character varying(100),
    search_region character varying(100),
    search_city character varying(100),
    backup_timestamp timestamp with time zone
);


ALTER TABLE public.searches_location_backup OWNER TO postgres;

--
-- Name: searches_search_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: ummonai
--

ALTER SEQUENCE public.searches_search_id_seq OWNED BY public.searches.search_id;


--
-- Name: votes; Type: TABLE; Schema: public; Owner: ummonai
--

CREATE TABLE public.votes (
    vote_id integer NOT NULL,
    vote_name text,
    vote_description text
);


ALTER TABLE public.votes OWNER TO ummonai;

--
-- PostgreSQL database dump complete
--

