-- Migration: Add trigram indexes for LIKE pattern matching
-- This provides better support for Chinese/CJK text search and improves LIKE query performance

-- Enable trigram support (required for trigram indexes)
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Drop existing indexes if they exist (safe to run multiple times)
DROP INDEX IF EXISTS searches_initial_trgm_idx;
DROP INDEX IF EXISTS searches_translation_trgm_idx;

-- Create GIN trigram indexes for pattern matching with LIKE
-- These work well with both English and Chinese text
CREATE INDEX searches_initial_trgm_idx ON searches 
USING GIN (search_term_initial gin_trgm_ops);

CREATE INDEX searches_translation_trgm_idx ON searches 
USING GIN (search_term_translation gin_trgm_ops);

-- Keep the existing text search indexes for English full-text search
-- (These were created in migration 3 and are still useful for English)

-- Update table statistics for query planner optimization
ANALYZE searches;

-- Verify indexes were created successfully
DO $$
BEGIN
    RAISE NOTICE 'Trigram indexes created successfully';
    RAISE NOTICE 'Indexes created:';
    RAISE NOTICE '  - searches_initial_trgm_idx (for LIKE queries on search_term_initial)';
    RAISE NOTICE '  - searches_translation_trgm_idx (for LIKE queries on search_term_translation)';
    RAISE NOTICE ' ';
    RAISE NOTICE 'These indexes accelerate pattern matching queries like:';
    RAISE NOTICE '  WHERE search_term_translation LIKE %', '''%天安门%''';
    RAISE NOTICE '  WHERE search_term_initial ILIKE %', '''%tiananmen%''';
END $$;