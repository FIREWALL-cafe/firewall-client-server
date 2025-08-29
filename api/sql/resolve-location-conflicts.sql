-- Resolution script for location conflicts
-- Run this AFTER reviewing conflicts with validate-event-searches-location.sql

-- Strategy 1: Auto-resolve NYC area variations
-- These are compatible and should be standardized to event location
UPDATE searches 
SET 
    search_country = 'United States',
    search_region = 'New York', 
    search_city = 'New York City'
WHERE search_timestamp >= EXTRACT(EPOCH FROM '2016-02-01'::timestamp) * 1000
  AND search_timestamp <= EXTRACT(EPOCH FROM '2016-03-31'::timestamp) * 1000
  AND search_location IN ('Manhattan', 'NYC')
  AND search_city IS NULL;

-- Show what was updated
SELECT 'NYC variations standardized:' as action, COUNT(*) as records_updated
FROM searches 
WHERE search_location IN ('Manhattan', 'NYC')
  AND search_city = 'New York City';

-- Strategy 2: Preserve legitimate remote searches
-- These appear to be users searching from different locations during events
-- DO NOT UPDATE these - they represent actual user locations

SELECT 'Preserved remote searches:' as category, COUNT(*) as count
FROM searches s
WHERE (
    -- Oslo search during Miami event
    (s.search_location = 'Oslo' 
     AND s.search_timestamp >= EXTRACT(EPOCH FROM '2021-10-01'::timestamp) * 1000
     AND s.search_timestamp <= EXTRACT(EPOCH FROM '2021-10-07'::timestamp) * 1000)
    OR
    -- NYC/Vienna cross-searches
    (s.search_location IN ('New York City', 'vienna', 'asheville')
     AND s.search_timestamp >= EXTRACT(EPOCH FROM '2020-01-01'::timestamp) * 1000
     AND s.search_timestamp <= EXTRACT(EPOCH FROM '2020-02-28'::timestamp) * 1000
     AND s.search_location != 'automated_scraper')
);

-- Strategy 3: Fill missing geographic data only
-- Only update NULL fields, preserve existing location data
UPDATE searches s
SET 
    search_country = COALESCE(s.search_country, el.search_country),
    search_region = COALESCE(s.search_region, el.search_region),
    search_city = COALESCE(s.search_city, el.search_city)
FROM (VALUES
    ('Oslo Freedom Forum 2017', '2017-05-17'::date, '2017-05-27'::date, 'Norway', 'Oslo', 'Oslo'),
    ('Oslo Freedom Forum NYC 2017', '2017-09-16'::date, '2017-09-22'::date, 'United States', 'New York', 'New York City'),
    ('Oslo Freedom Forum 2018', '2018-05-25'::date, '2018-05-31'::date, 'Norway', 'Oslo', 'Oslo'),
    ('Oslo Freedom Forum Miami 2021', '2021-10-01'::date, '2021-10-07'::date, 'United States', 'Florida', 'Miami'),
    ('Oslo Freedom Forum Taiwan 2022', '2022-10-31'::date, '2022-11-06'::date, 'Taiwan', 'Taipei', 'Taipei City'),
    ('Marist College Pop-up 2020', '2020-02-23'::date, '2020-02-29'::date, 'United States', 'New York', 'Poughkeepsie'),
    ('VBKÖ Vienna Exhibition 2020', '2020-01-07'::date, '2020-02-04'::date, 'Austria', 'Vienna', 'Vienna'),
    ('RAMP Gallery Asheville 2020', '2020-01-21'::date, '2020-02-27'::date, 'United States', 'North Carolina', 'Asheville'),
    ('NYC Events 2016', '2016-02-01'::date, '2016-03-31'::date, 'United States', 'New York', 'New York City')
) AS el(event_name, event_start_date, event_end_date, search_country, search_region, search_city)
WHERE TO_TIMESTAMP(s.search_timestamp / 1000)::date >= el.event_start_date 
  AND TO_TIMESTAMP(s.search_timestamp / 1000)::date <= el.event_end_date
  AND s.search_client_name != 'automated_scraper'
  -- Only update if geographic fields are NULL
  AND (s.search_country IS NULL OR s.search_region IS NULL OR s.search_city IS NULL);

-- Final summary
SELECT 'Final conflict resolution summary:' as report;

WITH conflict_analysis AS (
    SELECT 
        CASE 
            WHEN search_location IN ('Manhattan', 'NYC') AND search_city = 'New York City' THEN 'NYC_STANDARDIZED'
            WHEN search_location IS NOT NULL AND search_city IS NULL THEN 'NEEDS_GEOGRAPHIC_DATA'
            WHEN search_location IS NOT NULL AND search_city IS NOT NULL 
                 AND search_location != search_city THEN 'LEGITIMATE_REMOTE_SEARCH'
            WHEN search_location = search_city THEN 'LOCATION_MATCHES'
            ELSE 'OTHER'
        END as resolution_type
    FROM searches
    WHERE search_timestamp >= EXTRACT(EPOCH FROM '2015-01-01'::timestamp) * 1000
      AND search_timestamp <= EXTRACT(EPOCH FROM '2023-01-01'::timestamp) * 1000
      AND search_client_name != 'automated_scraper'
)
SELECT resolution_type, COUNT(*) as count
FROM conflict_analysis
GROUP BY resolution_type
ORDER BY count DESC;