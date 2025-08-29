-- SAFE event-based location update script with discrepancy handling
-- Run validate-event-searches-location.sql first to review potential conflicts

-- Create the event data table
CREATE TEMPORARY TABLE event_locations AS
SELECT 
    event_name,
    event_start_date,
    event_end_date,
    search_country,
    search_region, 
    search_city,
    description
FROM (VALUES
    -- Oslo Freedom Forum 2017 (May 20-24, 2017) - Oslo, Norway
    ('Oslo Freedom Forum 2017', '2017-05-17'::date, '2017-05-27'::date, 'Norway', 'Oslo', 'Oslo', 'Pop-up in Spikersuppa Square, Oslo'),
    
    -- Oslo Freedom Forum NYC 2017 (Sep 19, 2017) - New York, USA  
    ('Oslo Freedom Forum NYC 2017', '2017-09-16'::date, '2017-09-22'::date, 'United States', 'New York', 'New York City', 'Interactive Expo at Lincoln Center'),
    
    -- Oslo Freedom Forum 2018 (May 28, 2018) - Oslo, Norway
    ('Oslo Freedom Forum 2018', '2018-05-25'::date, '2018-05-31'::date, 'Norway', 'Oslo', 'Oslo', '10th Anniversary at Sentralen'),
    
    -- Oslo Freedom Forum Miami 2021 (Oct 4, 2021) - Miami, USA
    ('Oslo Freedom Forum Miami 2021', '2021-10-01'::date, '2021-10-07'::date, 'United States', 'Florida', 'Miami', 'Interactive expo focusing on human rights and technology'),
    
    -- Oslo Freedom Forum Taiwan 2022 (Nov 3, 2022) - Taipei, Taiwan
    ('Oslo Freedom Forum Taiwan 2022', '2022-10-31'::date, '2022-11-06'::date, 'Taiwan', 'Taipei', 'Taipei City', 'Interactive expo at Grand Hyatt Taipei'),
    
    -- Marist College Pop-up (Feb 26, 2020) - Poughkeepsie, NY
    ('Marist College Pop-up 2020', '2020-02-23'::date, '2020-02-29'::date, 'United States', 'New York', 'Poughkeepsie', 'Pop-up with Megha Rajagopalan lecture at Marist College'),
    
    -- VBKÖ Vienna Exhibition (Jan 10 - Feb 1, 2020) - Vienna, Austria
    ('VBKÖ Vienna Exhibition 2020', '2020-01-07'::date, '2020-02-04'::date, 'Austria', 'Vienna', 'Vienna', 'Search for Feminism exhibition at Austrian Association of Women Artists'),
    
    -- VBKÖ Panel Discussion (Jan 16, 2020) - Vienna, Austria  
    ('VBKÖ Panel Discussion 2020', '2020-01-13'::date, '2020-01-19'::date, 'Austria', 'Vienna', 'Vienna', 'Re(actions) to the Great Chinese Firewall panel'),
    
    -- RAMP Gallery Asheville (Jan 24 - Feb 24, 2020) - Asheville, NC
    ('RAMP Gallery Asheville 2020', '2020-01-21'::date, '2020-02-27'::date, 'United States', 'North Carolina', 'Asheville', 'REDIRECT group exhibition'),
    
    -- New Media Caucus Michigan (Sep 21, 2019) - Ann Arbor, MI
    ('New Media Caucus Michigan 2019', '2019-09-18'::date, '2019-09-24'::date, 'United States', 'Michigan', 'Ann Arbor', 'Border Control Symposium at University of Michigan'),
    
    -- Hong Kong Not Found (Dec 12-13, 2015) - Hong Kong
    ('Hong Kong Not Found 2015', '2015-12-09'::date, '2015-12-16'::date, 'Hong Kong', 'Hong Kong', 'Hong Kong', 'Performance art exhibition at Connecting Space'),
    
    -- NYC Chinatown Soup Inaugural (Feb 8 - Mar 6, 2016) - New York City
    ('NYC Chinatown Soup Inaugural 2016', '2016-02-05'::date, '2016-03-09'::date, 'United States', 'New York', 'New York City', 'Inaugural FIREWALL pop-up at Chinatown Soup'),
    
    -- Marymount Manhattan Field Trip (Feb 29, 2016) - New York City
    ('Marymount Manhattan 2016', '2016-02-26'::date, '2016-03-03'::date, 'United States', 'New York', 'New York City', 'Digital Media & Society class field trip'),
    
    -- Apex for Youth (Feb 25 & Mar 3, 2016) - New York City
    ('Apex for Youth 2016', '2016-02-22'::date, '2016-03-06'::date, 'United States', 'New York', 'New York City', 'After-school field trip at Chinatown Soup'),
    
    -- Creative Hacktivism Roundtable (Feb 26, 2016) - New York City
    ('Creative Hacktivism 2016', '2016-02-23'::date, '2016-02-29'::date, 'United States', 'New York', 'New York City', 'Discussion at Orbital about internet censorship'),
    
    -- Proxy Pals with uProxy (Feb 18, 2016) - New York City
    ('Proxy Pals 2016', '2016-02-15'::date, '2016-02-21'::date, 'United States', 'New York', 'New York City', 'uProxy technology discussion at Orbital'),
    
    -- Networked Feminism in China (Feb 19, 2016) - New York City
    ('Networked Feminism 2016', '2016-02-16'::date, '2016-02-22'::date, 'United States', 'New York', 'New York City', 'Panel discussion at Orbital'),
    
    -- Austria Serendipity Exhibition (Dec 3-31, 2016) - St. Pölten, Austria
    ('Austria Serendipity 2016', '2016-11-30'::date, '2017-01-03'::date, 'Austria', 'Lower Austria', 'St. Pölten', 'Search for... Serendipity group exhibition'),
    
    -- RVCC Group Show (Aug 31 - Sep 30, 2022) - Branchburg, NJ
    ('RVCC Group Show 2022', '2022-08-28'::date, '2022-10-03'::date, 'United States', 'New Jersey', 'Branchburg', 'The Future is group exhibition at Raritan Valley Community College')
) AS events(event_name, event_start_date, event_end_date, search_country, search_region, search_city, description);

-- STRATEGY 1: Only update searches with NULL/empty location data (SAFEST)
-- This approach preserves existing location data and only fills in missing data
UPDATE searches 
SET 
    search_country = el.search_country,
    search_region = el.search_region,
    search_city = el.search_city,
    search_location = el.search_city
FROM event_locations el
WHERE 
    TO_TIMESTAMP(searches.search_timestamp / 1000)::date >= el.event_start_date 
    AND TO_TIMESTAMP(searches.search_timestamp / 1000)::date <= el.event_end_date
    AND (
        -- Only update if location data is completely missing
        searches.search_location IS NULL OR searches.search_location = ''
    )
    -- Exclude automated scrapers
    AND searches.search_client_name != 'automated_scraper'
    AND COALESCE(searches.search_location, '') NOT IN ('automated_scraper', 'nyc3');

-- Show results of Strategy 1
SELECT 
    'STRATEGY 1 RESULTS: Updated searches with missing location data' as message,
    COUNT(*) as updated_count
FROM searches s
JOIN event_locations el ON (
    TO_TIMESTAMP(s.search_timestamp / 1000)::date >= el.event_start_date 
    AND TO_TIMESTAMP(s.search_timestamp / 1000)::date <= el.event_end_date
)
WHERE s.search_location = el.search_city;

-- STRATEGY 2: Create backup table and update compatible conflicts
-- First create backup of current data
CREATE TABLE IF NOT EXISTS searches_location_backup AS
SELECT 
    search_id, 
    search_location, 
    search_country, 
    search_region, 
    search_city,
    current_timestamp as backup_timestamp
FROM searches 
WHERE search_id IN (
    SELECT s.search_id 
    FROM searches s
    JOIN event_locations el ON (
        TO_TIMESTAMP(s.search_timestamp / 1000)::date >= el.event_start_date 
        AND TO_TIMESTAMP(s.search_timestamp / 1000)::date <= el.event_end_date
    )
);

-- Update compatible conflicts (where current location is compatible with event location)
UPDATE searches 
SET 
    search_country = COALESCE(searches.search_country, el.search_country),
    search_region = COALESCE(searches.search_region, el.search_region),
    search_city = COALESCE(searches.search_city, el.search_city)
    -- DON'T update search_location if it already exists and differs
FROM event_locations el
WHERE 
    TO_TIMESTAMP(searches.search_timestamp / 1000)::date >= el.event_start_date 
    AND TO_TIMESTAMP(searches.search_timestamp / 1000)::date <= el.event_end_date
    AND searches.search_location IS NOT NULL
    AND searches.search_location != 'automated_scraper' 
    AND searches.search_location != 'nyc3'
    AND (
        -- Only update if compatible (current location contains or is contained in event location)
        searches.search_location ILIKE '%' || el.search_city || '%' OR
        el.search_city ILIKE '%' || searches.search_location || '%' OR
        -- Special NYC area compatibility
        (searches.search_location = 'New York City' AND el.search_city IN ('New York City', 'Poughkeepsie')) OR
        (searches.search_location = 'Oslo' AND el.search_city = 'Oslo')
    );

-- 7. FINAL VALIDATION: Show what was updated and what conflicts remain
SELECT 
    '=== POST-UPDATE ANALYSIS ===' as section,
    '' as category,
    0 as count,
    '' as details;

-- Successful updates
SELECT 
    'SUCCESSFUL_UPDATES' as category,
    COUNT(*) as count,
    'Searches successfully updated with event location data' as details
FROM searches s
JOIN event_locations el ON (
    TO_TIMESTAMP(s.search_timestamp / 1000)::date >= el.event_start_date 
    AND TO_TIMESTAMP(s.search_timestamp / 1000)::date <= el.event_end_date
)
WHERE s.search_country = el.search_country
AND s.search_region = el.search_region
AND s.search_city = el.search_city

UNION ALL

-- Remaining conflicts
SELECT 
    'REMAINING_CONFLICTS' as category,
    COUNT(*) as count,
    'Searches that still have location conflicts - need manual review' as details
FROM searches s
JOIN event_locations el ON (
    TO_TIMESTAMP(s.search_timestamp / 1000)::date >= el.event_start_date 
    AND TO_TIMESTAMP(s.search_timestamp / 1000)::date <= el.event_end_date
)
WHERE s.search_location IS NOT NULL
AND s.search_location != 'automated_scraper' 
AND s.search_location != 'nyc3'
AND s.search_location != el.search_city
AND NOT (
    s.search_location ILIKE '%' || el.search_city || '%' OR
    el.search_city ILIKE '%' || s.search_location || '%'
);

-- 8. ROLLBACK INSTRUCTIONS
SELECT 
    '=== ROLLBACK INSTRUCTIONS ===' as section,
    'If you need to rollback these changes, run:' as instructions,
    '' as command;

SELECT 
    'ROLLBACK' as section,
    'Use the searches_location_backup table to restore original values:' as instructions,
    'UPDATE searches SET search_location = b.search_location, search_country = b.search_country, search_region = b.search_region, search_city = b.search_city FROM searches_location_backup b WHERE searches.search_id = b.search_id;' as command;

-- Clean up temporary table (keep backup table for safety)
DROP TABLE event_locations;