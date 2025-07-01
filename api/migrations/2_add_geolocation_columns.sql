-- Add geographic columns to searches table
ALTER TABLE searches ADD COLUMN IF NOT EXISTS search_country VARCHAR(100);
ALTER TABLE searches ADD COLUMN IF NOT EXISTS search_country_code VARCHAR(2);
ALTER TABLE searches ADD COLUMN IF NOT EXISTS search_region VARCHAR(100);
ALTER TABLE searches ADD COLUMN IF NOT EXISTS search_city VARCHAR(100);
ALTER TABLE searches ADD COLUMN IF NOT EXISTS search_latitude DECIMAL(10, 8);
ALTER TABLE searches ADD COLUMN IF NOT EXISTS search_longitude DECIMAL(11, 8);

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_searches_country ON searches(search_country);
CREATE INDEX IF NOT EXISTS idx_searches_city ON searches(search_city);
CREATE INDEX IF NOT EXISTS idx_searches_country_code ON searches(search_country_code);

-- Add geographic columns to have_votes table (optional for now)
ALTER TABLE have_votes ADD COLUMN IF NOT EXISTS vote_country VARCHAR(100);
ALTER TABLE have_votes ADD COLUMN IF NOT EXISTS vote_country_code VARCHAR(2);
ALTER TABLE have_votes ADD COLUMN IF NOT EXISTS vote_city VARCHAR(100);