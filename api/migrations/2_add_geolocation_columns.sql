-- Add geographic columns to searches table
-- Using DO blocks to safely add columns only if they don't exist

DO $$
BEGIN
    -- Add search_country column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='searches' AND column_name='search_country') THEN
        ALTER TABLE searches ADD COLUMN search_country VARCHAR(100);
    END IF;
    
    -- Add search_country_code column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='searches' AND column_name='search_country_code') THEN
        ALTER TABLE searches ADD COLUMN search_country_code VARCHAR(2);
    END IF;
    
    -- Add search_region column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='searches' AND column_name='search_region') THEN
        ALTER TABLE searches ADD COLUMN search_region VARCHAR(100);
    END IF;
    
    -- Add search_city column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='searches' AND column_name='search_city') THEN
        ALTER TABLE searches ADD COLUMN search_city VARCHAR(100);
    END IF;
    
    -- Add search_latitude column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='searches' AND column_name='search_latitude') THEN
        ALTER TABLE searches ADD COLUMN search_latitude DECIMAL(10, 8);
    END IF;
    
    -- Add search_longitude column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='searches' AND column_name='search_longitude') THEN
        ALTER TABLE searches ADD COLUMN search_longitude DECIMAL(11, 8);
    END IF;
END $$;

-- Add indexes for better query performance (these support IF NOT EXISTS in older versions)
CREATE INDEX IF NOT EXISTS idx_searches_country ON searches(search_country);
CREATE INDEX IF NOT EXISTS idx_searches_city ON searches(search_city);
CREATE INDEX IF NOT EXISTS idx_searches_country_code ON searches(search_country_code);

-- Add geographic columns to have_votes table
DO $$
BEGIN
    -- Add vote_country column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='have_votes' AND column_name='vote_country') THEN
        ALTER TABLE have_votes ADD COLUMN vote_country VARCHAR(100);
    END IF;
    
    -- Add vote_country_code column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='have_votes' AND column_name='vote_country_code') THEN
        ALTER TABLE have_votes ADD COLUMN vote_country_code VARCHAR(2);
    END IF;
    
    -- Add vote_city column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='have_votes' AND column_name='vote_city') THEN
        ALTER TABLE have_votes ADD COLUMN vote_city VARCHAR(100);
    END IF;
END $$;