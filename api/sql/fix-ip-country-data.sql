-- Migration to fix IP addresses in search_country field
-- Production issue: search_country contains IP addresses instead of country names
-- This affects 70%+ of searches in production database

-- First, analyze the current state
SELECT 'Current IP addresses in search_country field:' as analysis;
SELECT 
    search_country as ip_address,
    search_country_code,
    COUNT(*) as record_count,
    ROUND((COUNT(*) * 100.0 / (SELECT COUNT(*) FROM searches)), 1) as percentage
FROM searches 
WHERE search_country ~ '^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+$'
GROUP BY search_country, search_country_code
ORDER BY record_count DESC;

-- Show total records affected
SELECT 'Total records with IP addresses in country field:' as summary;
SELECT COUNT(*) as total_affected_records
FROM searches 
WHERE search_country ~ '^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+$';

-- Begin transaction for safety
BEGIN;

-- Update IP addresses to proper country names based on production data analysis
UPDATE searches 
SET search_country = CASE 
    WHEN search_country = '74.125.0.1' THEN 'United States'
    WHEN search_country = '129.240.0.1' THEN 'Norway' 
    WHEN search_country = '137.189.0.1' THEN 'Hong Kong'
    WHEN search_country = '131.130.0.1' THEN 'Austria'
    WHEN search_country = '141.211.0.1' THEN 'United States'
    ELSE search_country
END
WHERE search_country IN (
    '74.125.0.1',  -- United States (6,172 records - 70.2%)
    '129.240.0.1', -- Norway (1,059 records - 12.0%)
    '137.189.0.1', -- Hong Kong (340 records - 3.9%)
    '131.130.0.1', -- Austria (304 records - 3.5%)
    '141.211.0.1'  -- United States (160 records - 1.8%)
);

-- Show what was updated
SELECT 'Records updated:' as result;
SELECT 
    search_country,
    search_country_code,
    COUNT(*) as updated_count
FROM searches 
WHERE search_country IN ('United States', 'Norway', 'Hong Kong', 'Austria')
AND search_country_code IN ('US', 'NO', 'HK', 'AT')
GROUP BY search_country, search_country_code
ORDER BY updated_count DESC;

-- Verify no IP addresses remain
SELECT 'Remaining IP addresses after migration:' as verification;
SELECT 
    search_country,
    COUNT(*) as remaining_count
FROM searches 
WHERE search_country ~ '^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+$'
GROUP BY search_country
ORDER BY remaining_count DESC;

-- Final geographic distribution
SELECT 'Final geographic distribution:' as final_result;
SELECT 
    search_country,
    search_country_code,
    COUNT(*) as search_count,
    ROUND((COUNT(*) * 100.0 / (SELECT COUNT(*) FROM searches WHERE search_country IS NOT NULL)), 1) as percentage
FROM searches 
WHERE search_country IS NOT NULL
GROUP BY search_country, search_country_code
ORDER BY search_count DESC
LIMIT 10;

-- Commit the transaction if everything looks good
-- COMMIT;

-- If there are issues, uncomment the line below instead:
-- ROLLBACK;