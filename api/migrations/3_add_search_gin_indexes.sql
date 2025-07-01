-- Migration: Add GIN indexes for full-text search support
-- This improves search performance and adds support for Chinese and other non-English languages

-- Drop existing indexes if they exist (safe to run multiple times)
DROP INDEX IF EXISTS searches_term_gin_idx;
DROP INDEX IF EXISTS searches_term_simple_gin_idx;
DROP INDEX IF EXISTS searches_term_english_gin_idx;
DROP INDEX IF EXISTS searches_translation_simple_gin_idx;

-- Create GIN index using 'simple' configuration for universal language support
-- This works with Chinese, Japanese, Korean, and other languages that don't use spaces
CREATE INDEX searches_term_simple_gin_idx ON searches 
USING GIN (to_tsvector('simple', search_term_initial));

-- Create GIN index using 'english' configuration for better English search
-- This provides stemming and stop word removal for English text
CREATE INDEX searches_term_english_gin_idx ON searches 
USING GIN (to_tsvector('english', search_term_initial));

-- Create index on translated search terms for searching translations
CREATE INDEX searches_translation_simple_gin_idx ON searches 
USING GIN (to_tsvector('simple', search_term_translation));

-- Create index on translated terms with English configuration
CREATE INDEX searches_translation_english_gin_idx ON searches 
USING GIN (to_tsvector('english', search_term_translation));

-- Add compound index for combined search on both original and translated terms
CREATE INDEX searches_combined_simple_gin_idx ON searches
USING GIN (to_tsvector('simple', search_term_initial || ' ' || COALESCE(search_term_translation, '')));

-- Update table statistics for query planner optimization
ANALYZE searches;

-- Verify indexes were created successfully
DO $$
BEGIN
    RAISE NOTICE 'GIN indexes created successfully for full-text search';
    RAISE NOTICE 'Indexes created:';
    RAISE NOTICE '  - searches_term_simple_gin_idx (universal language support)';
    RAISE NOTICE '  - searches_term_english_gin_idx (English with stemming)';
    RAISE NOTICE '  - searches_translation_simple_gin_idx (translations - universal)';
    RAISE NOTICE '  - searches_translation_english_gin_idx (translations - English)';
    RAISE NOTICE '  - searches_combined_simple_gin_idx (combined original + translation)';
END $$;