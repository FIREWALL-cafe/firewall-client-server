-- Find searches created during events and update their search_location
-- Fixed version that properly handles millisecond timestamps

-- First, let's check what format the timestamps are in
SELECT
    search_id,
    search_timestamp,
    TO_TIMESTAMP(search_timestamp/1000) as converted_time
FROM searches
LIMIT 5;

-- Main query to find and report on searches during events
WITH events AS (
  SELECT
    'firewall-pop-up-with-inside-chinas-surveillance-state-a-lecture-by-megha-rajagopalan' as event_name,
    'china_surveillance_marist' as event_location,
    EXTRACT(EPOCH FROM '2020-02-23 00:00:00'::timestamp) * 1000 as start_time,
    EXTRACT(EPOCH FROM '2020-02-29 23:59:59'::timestamp) * 1000 as end_time
  UNION ALL
  SELECT
    'marymount-manhattan-digital-media-society-class-field-trip',
    'digital_media_chinatown',
    EXTRACT(EPOCH FROM '2016-02-26 00:00:00'::timestamp) * 1000,
    EXTRACT(EPOCH FROM '2016-03-03 23:59:59'::timestamp) * 1000
  UNION ALL
  SELECT
    'oslo-freedom-forum-2022-taiwan-interactive-expo',
    'oslo_freedom_taiwan',
    EXTRACT(EPOCH FROM '2022-10-31 00:00:00'::timestamp) * 1000,
    EXTRACT(EPOCH FROM '2022-11-06 23:59:59'::timestamp) * 1000
  UNION ALL
  SELECT
    'reactions-to-the-great-chinese-firewall',
    'chinese_firewall_vbko',
    EXTRACT(EPOCH FROM '2020-01-13 00:00:00'::timestamp) * 1000,
    EXTRACT(EPOCH FROM '2020-01-19 23:59:59'::timestamp) * 1000
  UNION ALL
  SELECT
    'firewall-featured-on-bbc-the-real-story',
    'bbc_real_story_russia',
    EXTRACT(EPOCH FROM '2019-10-29 00:00:00'::timestamp) * 1000,
    EXTRACT(EPOCH FROM '2019-11-04 23:59:59'::timestamp) * 1000
  UNION ALL
  SELECT
    'apex-for-youth-after-school-field-trip',
    'apex_youth_after_school',
    EXTRACT(EPOCH FROM '2016-02-22 00:00:00'::timestamp) * 1000,
    EXTRACT(EPOCH FROM '2016-03-06 23:59:59'::timestamp) * 1000
  UNION ALL
  SELECT
    'creative-hacktivism-roundtable',
    'creative_hacktivism_roundtable',
    EXTRACT(EPOCH FROM '2016-02-23 00:00:00'::timestamp) * 1000,
    EXTRACT(EPOCH FROM '2016-02-29 23:59:59'::timestamp) * 1000
  UNION ALL
  SELECT
    'proxy-pals-trial-by-firewall',
    'proxy_pals_trial_by_firewall',
    EXTRACT(EPOCH FROM '2016-02-15 00:00:00'::timestamp) * 1000,
    EXTRACT(EPOCH FROM '2016-02-21 23:59:59'::timestamp) * 1000
  UNION ALL
  SELECT
    'networked-feminism-in-china',
    'networked_feminism_in_china',
    EXTRACT(EPOCH FROM '2016-02-16 00:00:00'::timestamp) * 1000,
    EXTRACT(EPOCH FROM '2016-02-22 23:59:59'::timestamp) * 1000
  UNION ALL
  SELECT
    'firewall-pop-up-group-show-in-rvcc',
    'rvcc_group_show',
    EXTRACT(EPOCH FROM '2022-08-28 00:00:00'::timestamp) * 1000,
    EXTRACT(EPOCH FROM '2022-10-03 23:59:59'::timestamp) * 1000
  UNION ALL
  SELECT
    'oslo-freedom-forum-2021-miami-interactive-expo',
    'oslo_freedom_miami',
    EXTRACT(EPOCH FROM '2021-10-01 00:00:00'::timestamp) * 1000,
    EXTRACT(EPOCH FROM '2021-10-07 23:59:59'::timestamp) * 1000
  UNION ALL
  SELECT
    'redirect-at-ramp-gallery-asheville-nc',
    'redirect_at_ramp_gallery',
    EXTRACT(EPOCH FROM '2020-01-21 00:00:00'::timestamp) * 1000,
    EXTRACT(EPOCH FROM '2020-02-27 23:59:59'::timestamp) * 1000
  UNION ALL
  SELECT
    'search-for-feminism-at-vbko-vienna-austria',
    'search_for_feminism_vbko',
    EXTRACT(EPOCH FROM '2020-01-07 00:00:00'::timestamp) * 1000,
    EXTRACT(EPOCH FROM '2020-02-04 23:59:59'::timestamp) * 1000
  UNION ALL
  SELECT
    'new-media-caucus-border-control-symposium',
    'border_control_symposium',
    EXTRACT(EPOCH FROM '2019-09-18 00:00:00'::timestamp) * 1000,
    EXTRACT(EPOCH FROM '2019-09-24 23:59:59'::timestamp) * 1000
  UNION ALL
  SELECT
    'hknotfound',
    'hong_kong_not_found',
    EXTRACT(EPOCH FROM '2015-12-09 00:00:00'::timestamp) * 1000,
    EXTRACT(EPOCH FROM '2015-12-16 23:59:59'::timestamp) * 1000
  UNION ALL
  SELECT
    'off-2018',
    'oslo_freedom_forum_2018',
    EXTRACT(EPOCH FROM '2018-05-25 00:00:00'::timestamp) * 1000,
    EXTRACT(EPOCH FROM '2018-05-31 23:59:59'::timestamp) * 1000
  UNION ALL
  SELECT
    'off-nyc-2017',
    'oslo_freedom_forum_nyc',
    EXTRACT(EPOCH FROM '2017-09-16 00:00:00'::timestamp) * 1000,
    EXTRACT(EPOCH FROM '2017-09-22 23:59:59'::timestamp) * 1000
  UNION ALL
  SELECT
    'off2017',
    'oslo_freedom_forum_2017',
    EXTRACT(EPOCH FROM '2017-05-17 00:00:00'::timestamp) * 1000,
    EXTRACT(EPOCH FROM '2017-05-27 23:59:59'::timestamp) * 1000
  UNION ALL
  SELECT
    'search-for-serendipity-in-austria',
    'search_for_serendipity',
    EXTRACT(EPOCH FROM '2016-11-30 00:00:00'::timestamp) * 1000,
    EXTRACT(EPOCH FROM '2017-01-03 23:59:59'::timestamp) * 1000
  UNION ALL
  SELECT
    'inaugural-new-york-2016-pop-up',
    'inaugural_new_york_pop_up',
    EXTRACT(EPOCH FROM '2016-02-05 00:00:00'::timestamp) * 1000,
    EXTRACT(EPOCH FROM '2016-03-09 23:59:59'::timestamp) * 1000
),
searches_during_events AS (
  SELECT
    s.search_id,
    s.search_term_initial,
    TO_TIMESTAMP(s.search_timestamp/1000) as created_at,
    s.search_timestamp,
    s.search_location as current_location,
    e.event_name,
    e.event_location as new_location,
    COUNT(*) OVER (PARTITION BY s.search_id) as event_count
  FROM searches s
  INNER JOIN events e
    ON s.search_timestamp >= e.start_time
    AND s.search_timestamp <= e.end_time
  WHERE s.search_location != 'automated_scraper'
    AND s.search_location IS NOT NULL
)
-- Searches that fall within multiple events (conflicts)
SELECT
  'CONFLICT' as status,
  search_id,
  search_term_initial,
  created_at,
  current_location,
  STRING_AGG(event_name || ' (' || new_location || ')', ', ' ORDER BY event_name) as overlapping_events,
  COUNT(*) as conflict_count
FROM searches_during_events
WHERE event_count > 1
GROUP BY search_id, search_term_initial, created_at, current_location

UNION ALL

-- Searches that fall within exactly one event (can be updated)
SELECT
  'UPDATE' as status,
  search_id,
  search_term_initial,
  created_at,
  current_location,
  event_name || ' (' || new_location || ')' as overlapping_events,
  1 as conflict_count
FROM searches_during_events
WHERE event_count = 1

ORDER BY status DESC, created_at;

-- Count how many searches would be updated
WITH events AS (
  SELECT
    'networked-feminism-in-china' as event_name,
    'networked_feminism_in_china' as event_location,
    EXTRACT(EPOCH FROM '2016-02-16 00:00:00'::timestamp) * 1000 as start_time,
    EXTRACT(EPOCH FROM '2016-02-22 23:59:59'::timestamp) * 1000 as end_time
  -- Add other events here as needed
)
SELECT
  COUNT(*) as searches_to_update,
  MIN(TO_TIMESTAMP(s.search_timestamp/1000)) as earliest_search,
  MAX(TO_TIMESTAMP(s.search_timestamp/1000)) as latest_search
FROM searches s
INNER JOIN events e
  ON s.search_timestamp >= e.start_time
  AND s.search_timestamp <= e.end_time
WHERE s.search_location != 'automated_scraper'
  AND (s.search_location IS NULL OR s.search_location = '');

-- Update statement for searches within single events (commented out for safety)
-- Uncomment and run after reviewing the results above
/*
WITH events AS (
  -- Copy all event definitions from above
  SELECT
    'networked-feminism-in-china' as event_name,
    'networked_feminism_in_china' as event_location,
    EXTRACT(EPOCH FROM '2016-02-16 00:00:00'::timestamp) * 1000 as start_time,
    EXTRACT(EPOCH FROM '2016-02-22 23:59:59'::timestamp) * 1000 as end_time
  -- Add all other events...
),
searches_during_events AS (
  SELECT
    s.search_id,
    e.event_location as new_location,
    COUNT(*) OVER (PARTITION BY s.search_id) as event_count
  FROM searches s
  INNER JOIN events e
    ON s.search_timestamp >= e.start_time
    AND s.search_timestamp <= e.end_time
  WHERE s.search_location != 'automated_scraper'
    AND (s.search_location IS NULL OR s.search_location = '')
)
UPDATE searches s
SET search_location = sde.new_location
FROM searches_during_events sde
WHERE s.search_id = sde.search_id
  AND sde.event_count = 1
  AND (s.search_location IS NULL OR s.search_location = '' OR s.search_location != sde.new_location);
*/

-- For testing: Update specific searches to 2016-02-16
-- This converts the date to milliseconds for the search_timestamp column

-- Option 1: Update specific search IDs
UPDATE searches
SET search_timestamp = EXTRACT(EPOCH FROM '2016-02-16 00:00:00'::timestamp) * 1000
WHERE search_id IN (
  -- Add specific search IDs here
  -- Example: 1234, 5678, 9012
);

-- Option 2: Update a limited number of searches (using subquery for LIMIT)
UPDATE searches
SET search_timestamp = EXTRACT(EPOCH FROM '2016-02-16 00:00:00'::timestamp) * 1000
WHERE search_id IN (
  SELECT search_id
  FROM searches
  WHERE search_timestamp IS NULL
     OR search_timestamp = 0
  LIMIT 5
);

-- Verify the update worked
SELECT
  search_id,
  search_timestamp,
  TO_TIMESTAMP(search_timestamp/1000) as human_readable_time,
  search_location
FROM searches
WHERE search_timestamp = EXTRACT(EPOCH FROM '2016-02-16 00:00:00'::timestamp) * 1000;