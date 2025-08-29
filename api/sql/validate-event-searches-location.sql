-- Validation script to test event-based location updates before execution
-- This script identifies discrepancies and provides recommendations

-- Create the same temporary table as the update script
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

-- 1. VALIDATION: Check what searches exist during event periods
SELECT 
    '=== SEARCHES DURING EVENT PERIODS ===' as section,
    '' as event_name,
    '' as event_dates,
    '' as current_location,
    '' as proposed_location,
    0 as search_count,
    '' as status;

SELECT 
    el.event_name,
    el.event_start_date::text || ' to ' || el.event_end_date::text as event_dates,
    COALESCE(s.search_location, '[NULL]') as current_location,
    el.search_city as proposed_location,
    COUNT(s.search_id) as search_count,
    CASE 
        WHEN COUNT(s.search_id) = 0 THEN 'NO_SEARCHES'
        WHEN s.search_location IS NULL THEN 'NULL_LOCATION'
        WHEN s.search_location = el.search_city THEN 'MATCHES'
        WHEN s.search_location != el.search_city THEN 'DISCREPANCY'
        ELSE 'UNKNOWN'
    END as status
FROM event_locations el
LEFT JOIN searches s ON (
    TO_TIMESTAMP(s.search_timestamp / 1000)::date >= el.event_start_date 
    AND TO_TIMESTAMP(s.search_timestamp / 1000)::date <= el.event_end_date
    AND s.search_location != 'automated_scraper' 
    AND s.search_location != 'nyc3'
)
GROUP BY el.event_name, el.event_start_date, el.event_end_date, s.search_location, el.search_city
ORDER BY el.event_start_date, status DESC;

-- 2. DISCREPANCY ANALYSIS: Find searches that would change location
SELECT 
    '=== LOCATION DISCREPANCIES ===' as section,
    '' as event_name,
    '' as current_location,
    '' as proposed_location,
    '' as search_timestamp,
    '' as recommendation;

WITH potential_changes AS (
    SELECT 
        el.event_name,
        s.search_id,
        s.search_location as current_location,
        el.search_city as proposed_location,
        TO_TIMESTAMP(s.search_timestamp / 1000) as search_timestamp,
        s.search_term_initial
    FROM event_locations el
    JOIN searches s ON (
        TO_TIMESTAMP(s.search_timestamp / 1000)::date >= el.event_start_date 
        AND TO_TIMESTAMP(s.search_timestamp / 1000)::date <= el.event_end_date
        AND s.search_location != 'automated_scraper' 
        AND s.search_location != 'nyc3'
    )
    WHERE s.search_location IS NOT NULL 
    AND s.search_location != el.search_city
)
SELECT 
    event_name,
    current_location,
    proposed_location,
    search_timestamp::text,
    CASE 
        WHEN current_location ILIKE '%' || proposed_location || '%' THEN 'COMPATIBLE - Keep current'
        WHEN proposed_location ILIKE '%' || current_location || '%' THEN 'COMPATIBLE - Event location more specific'
        WHEN current_location = 'New York City' AND proposed_location IN ('New York City', 'Poughkeepsie') THEN 'GEOGRAPHIC - Same region'
        WHEN current_location = 'Oslo' AND proposed_location = 'Oslo' THEN 'MATCHES'
        ELSE 'CONFLICT - Manual review needed'
    END as recommendation
FROM potential_changes
ORDER BY recommendation, event_name;

-- 3. LOCATION CONSISTENCY CHECK: Analyze existing search_location patterns
SELECT 
    '=== CURRENT SEARCH_LOCATION PATTERNS ===' as section,
    '' as search_location,
    0 as count,
    '' as country_distribution;

SELECT 
    search_location,
    COUNT(*) as count,
    STRING_AGG(DISTINCT COALESCE(search_country, '[NULL]'), ', ') as country_distribution
FROM searches 
WHERE search_location IS NOT NULL 
AND search_location != 'automated_scraper' 
AND search_location != 'nyc3'
GROUP BY search_location
ORDER BY count DESC
LIMIT 20;

-- 4. GEOGRAPHIC VALIDATION: Check for location consistency within events
SELECT 
    '=== GEOGRAPHIC CONSISTENCY CHECK ===' as section,
    '' as event_name,
    '' as existing_locations,
    '' as proposed_location,
    '' as recommendation;

SELECT 
    el.event_name,
    STRING_AGG(DISTINCT s.search_location, ', ' ORDER BY s.search_location) as existing_locations,
    el.search_city as proposed_location,
    CASE 
        WHEN COUNT(DISTINCT s.search_location) <= 1 THEN 'CONSISTENT'
        WHEN COUNT(DISTINCT s.search_location) > 3 THEN 'HIGHLY_MIXED - Review event dates'
        ELSE 'MIXED - Some inconsistency'
    END as recommendation
FROM event_locations el
LEFT JOIN searches s ON (
    TO_TIMESTAMP(s.search_timestamp / 1000)::date >= el.event_start_date 
    AND TO_TIMESTAMP(s.search_timestamp / 1000)::date <= el.event_end_date
    AND s.search_location IS NOT NULL
    AND s.search_location != 'automated_scraper' 
    AND s.search_location != 'nyc3'
)
GROUP BY el.event_name, el.search_city
HAVING COUNT(s.search_id) > 0
ORDER BY COUNT(DISTINCT s.search_location) DESC;

-- 5. SAMPLE DATA REVIEW: Show specific examples for manual verification
SELECT 
    '=== SAMPLE DISCREPANCIES FOR MANUAL REVIEW ===' as section,
    '' as event_name,
    '' as search_term,
    '' as current_location,
    '' as proposed_location,
    '' as search_date;

SELECT 
    el.event_name,
    s.search_term_initial as search_term,
    s.search_location as current_location,
    el.search_city as proposed_location,
    TO_TIMESTAMP(s.search_timestamp / 1000)::date as search_date
FROM event_locations el
JOIN searches s ON (
    TO_TIMESTAMP(s.search_timestamp / 1000)::date >= el.event_start_date 
    AND TO_TIMESTAMP(s.search_timestamp / 1000)::date <= el.event_end_date
    AND s.search_location != 'automated_scraper' 
    AND s.search_location != 'nyc3'
)
WHERE s.search_location IS NOT NULL 
AND s.search_location != el.search_city
ORDER BY el.event_start_date, s.search_timestamp
LIMIT 10;

-- 6. IMPACT ASSESSMENT: How many searches would be affected
SELECT 
    '=== UPDATE IMPACT ASSESSMENT ===' as section,
    '' as category,
    0 as count,
    '' as description;

SELECT 
    'TOTAL_EVENT_SEARCHES' as category,
    COUNT(*) as count,
    'Searches that fall within event date ranges' as description
FROM event_locations el
JOIN searches s ON (
    TO_TIMESTAMP(s.search_timestamp / 1000)::date >= el.event_start_date 
    AND TO_TIMESTAMP(s.search_timestamp / 1000)::date <= el.event_end_date
    AND s.search_location != 'automated_scraper' 
    AND s.search_location != 'nyc3'
)

UNION ALL

SELECT 
    'MISSING_LOCATION_DATA' as category,
    COUNT(*) as count,
    'Searches that need location data populated' as description
FROM event_locations el
JOIN searches s ON (
    TO_TIMESTAMP(s.search_timestamp / 1000)::date >= el.event_start_date 
    AND TO_TIMESTAMP(s.search_timestamp / 1000)::date <= el.event_end_date
    AND s.search_location != 'automated_scraper' 
    AND s.search_location != 'nyc3'
)
WHERE s.search_country IS NULL OR s.search_region IS NULL OR s.search_city IS NULL

UNION ALL

SELECT 
    'LOCATION_CONFLICTS' as category,
    COUNT(*) as count,
    'Searches with conflicting location data' as description
FROM event_locations el
JOIN searches s ON (
    TO_TIMESTAMP(s.search_timestamp / 1000)::date >= el.event_start_date 
    AND TO_TIMESTAMP(s.search_timestamp / 1000)::date <= el.event_end_date
    AND s.search_location != 'automated_scraper' 
    AND s.search_location != 'nyc3'
)
WHERE s.search_location IS NOT NULL 
AND s.search_location != el.search_city;

-- Clean up
DROP TABLE event_locations;