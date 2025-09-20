-- Migration: Add image_timestamp field to images table
-- Date: 2025-01-19
-- Description: Adds a timestamp field to the images table to track when each image was saved,
--              similar to search_timestamp in the searches table

-- Check if column exists, add if it doesn't (compatible with older PostgreSQL versions)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'images'
        AND column_name = 'image_timestamp'
    ) THEN
        ALTER TABLE images ADD COLUMN image_timestamp bigint;
    END IF;
END
$$;

-- Create index if it doesn't exist (compatible with older PostgreSQL versions)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes
        WHERE tablename = 'images'
        AND indexname = 'idx_images_timestamp'
    ) THEN
        CREATE INDEX idx_images_timestamp ON images(image_timestamp);
    END IF;
END
$$;

-- Add a comment to describe the column
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'images'
        AND column_name = 'image_timestamp'
    ) THEN
        EXECUTE 'COMMENT ON COLUMN images.image_timestamp IS ''Unix timestamp (milliseconds) when the image was saved''';
    END IF;
END
$$;