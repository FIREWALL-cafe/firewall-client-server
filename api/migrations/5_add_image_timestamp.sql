-- Migration: Add image_timestamp field to images table
-- Date: 2025-01-19
-- Description: Adds a timestamp field to the images table to track when each image was saved,
--              similar to search_timestamp in the searches table

-- Add image_timestamp column to images table
ALTER TABLE images
ADD COLUMN IF NOT EXISTS image_timestamp bigint;

-- Optional: Create an index on image_timestamp for better query performance
CREATE INDEX IF NOT EXISTS idx_images_timestamp ON images(image_timestamp);

-- Optional: Add a comment to describe the column
COMMENT ON COLUMN images.image_timestamp IS 'Unix timestamp (milliseconds) when the image was saved';