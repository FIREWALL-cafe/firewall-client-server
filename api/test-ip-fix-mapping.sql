-- Test query to validate IP to country mappings match production data
-- Run this first to confirm the mappings are correct

SELECT 'Production IP addresses that will be updated:' as info;

-- Create the same temp table
CREATE TEMP TABLE test_ip_mapping (
    ip_address VARCHAR(15),
    country_name VARCHAR(100),
    country_code VARCHAR(2)
);

INSERT INTO test_ip_mapping VALUES
    ('74.125.0.1', 'United States', 'US'),      -- Should be 6172 searches (70.2%)
    ('129.240.0.1', 'Norway', 'NO'),            -- Should be 1059 searches (12.0%)  
    ('137.189.0.1', 'Hong Kong', 'HK'),         -- Should be 340 searches (3.9%)
    ('131.130.0.1', 'Austria', 'AT'),           -- Should be 304 searches (3.5%)
    ('141.211.0.1', 'United States', 'US');     -- Should be 160 searches (1.8%)

-- Show what the mappings will be
SELECT 
    ip_address as "Current IP in DB",
    country_name as "Will become",
    country_code as "Country Code"
FROM test_ip_mapping
ORDER BY 
    CASE ip_address
        WHEN '74.125.0.1' THEN 1
        WHEN '129.240.0.1' THEN 2  
        WHEN '137.189.0.1' THEN 3
        WHEN '131.130.0.1' THEN 4
        WHEN '141.211.0.1' THEN 5
        ELSE 6
    END;

DROP TABLE test_ip_mapping;