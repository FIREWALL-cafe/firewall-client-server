-- Migration to fix IP addresses in search_country field
-- Replace IP addresses with proper country names based on existing mappings

-- First, let's see what we're working with
SELECT 'Current IP addresses in search_country field:' as analysis;
SELECT 
    search_country as ip_address,
    search_country_code as country_code,
    COUNT(*) as record_count
FROM searches 
WHERE search_country ~ '^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+$'
GROUP BY search_country, search_country_code
ORDER BY record_count DESC;

-- Create temporary mapping table for IP to country conversion
CREATE TEMP TABLE ip_to_country_mapping (
    ip_address VARCHAR(15),
    country_name VARCHAR(100),
    country_code VARCHAR(2)
);

-- Insert mappings based on the production data we observed
INSERT INTO ip_to_country_mapping VALUES
    ('74.125.0.1', 'United States', 'US'),      -- 6172 searches (70.2%)
    ('129.240.0.1', 'Norway', 'NO'),            -- 1059 searches (12.0%)  
    ('137.189.0.1', 'Hong Kong', 'HK'),         -- 340 searches (3.9%)
    ('131.130.0.1', 'Austria', 'AT'),           -- 304 searches (3.5%)
    ('141.211.0.1', 'United States', 'US'),     -- 160 searches (1.8%)
    -- Add more mappings as needed
    ('212.58.0.1', 'United Kingdom', 'GB'),
    ('193.51.0.1', 'France', 'FR'),
    ('133.11.0.1', 'Japan', 'JP'),
    ('203.2.0.1', 'Australia', 'AU'),
    ('130.133.0.1', 'Germany', 'DE'),
    ('213.4.0.1', 'Spain', 'ES'),
    ('193.205.0.1', 'Italy', 'IT'),
    ('145.97.0.1', 'Netherlands', 'NL'),
    ('130.237.0.1', 'Sweden', 'SE'),
    ('130.225.0.1', 'Denmark', 'DK'),
    ('134.226.0.1', 'Ireland', 'IE'),
    ('129.132.0.1', 'Switzerland', 'CH'),
    ('134.184.0.1', 'Belgium', 'BE'),
    ('193.136.0.1', 'Portugal', 'PT'),
    ('147.231.0.1', 'Czech Republic', 'CZ'),
    ('150.254.0.1', 'Poland', 'PL'),
    ('152.66.0.1', 'Hungary', 'HU'),
    ('147.102.0.1', 'Greece', 'GR'),
    ('93.180.0.1', 'Russia', 'RU'),
    ('166.111.0.1', 'China', 'CN'),
    ('202.120.0.1', 'China', 'CN'),
    ('137.132.0.1', 'Singapore', 'SG'),
    ('147.46.0.1', 'South Korea', 'KR'),
    ('14.139.0.1', 'India', 'IN'),
    ('164.100.0.1', 'India', 'IN'),
    ('106.51.0.1', 'India', 'IN'),
    ('213.42.0.1', 'United Arab Emirates', 'AE'),
    ('132.66.0.1', 'Israel', 'IL'),
    ('193.227.0.1', 'Egypt', 'EG'),
    ('146.141.0.1', 'South Africa', 'ZA'),
    ('143.107.0.1', 'Brazil', 'BR'),
    ('146.164.0.1', 'Brazil', 'BR'),
    ('168.96.0.1', 'Argentina', 'AR'),
    ('132.248.0.1', 'Mexico', 'MX'),
    ('142.1.0.1', 'Canada', 'CA'),
    ('142.103.0.1', 'Canada', 'CA'),
    ('132.205.0.1', 'Canada', 'CA');

-- Show the update plan
SELECT 'Update plan:' as analysis;
SELECT 
    s.search_country as current_ip,
    m.country_name as new_country_name,
    m.country_code as new_country_code,
    COUNT(*) as records_to_update
FROM searches s
JOIN ip_to_country_mapping m ON s.search_country = m.ip_address
WHERE s.search_country ~ '^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+$'
GROUP BY s.search_country, m.country_name, m.country_code
ORDER BY records_to_update DESC;

-- Perform the update
UPDATE searches 
SET 
    search_country = m.country_name,
    search_country_code = COALESCE(searches.search_country_code, m.country_code)
FROM ip_to_country_mapping m
WHERE searches.search_country = m.ip_address
AND searches.search_country ~ '^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+$';

-- Show results (PostgreSQL doesn't have ROW_COUNT(), so we'll show the count differently)
SELECT 'Update completed - check verification below for results' as result;

-- Verify the fix
SELECT 'After update - remaining IP addresses:' as verification;
SELECT 
    search_country as remaining_ip,
    COUNT(*) as count
FROM searches 
WHERE search_country ~ '^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+$'
GROUP BY search_country
ORDER BY count DESC;

-- Show final country distribution
SELECT 'Final country distribution:' as verification;
SELECT 
    search_country as country,
    search_country_code as code,
    COUNT(*) as search_count,
    ROUND((COUNT(*) * 100.0 / (SELECT COUNT(*) FROM searches WHERE search_country IS NOT NULL)), 1) as percentage
FROM searches 
WHERE search_country IS NOT NULL
GROUP BY search_country, search_country_code
ORDER BY search_count DESC
LIMIT 20;

-- Clean up
DROP TABLE ip_to_country_mapping;