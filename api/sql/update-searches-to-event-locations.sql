-- Find searches created during events and update their search_location
-- Also identifies searches that fall within multiple events

-- Main query to find and report on searches during events
WITH events AS (
  SELECT 
    'firewall-pop-up-with-inside-chinas-surveillance-state-a-lecture-by-megha-rajagopalan' as event_name,
    'china_surveillance_marist' as event_location,
    '2020-02-23 00:00:00'::timestamp as start_time,
    '2020-02-29 23:59:59'::timestamp as end_time
  UNION ALL
  SELECT 
    'marymount-manhattan-digital-media-society-class-field-trip',
    'digital_media_chinatown',
    '2016-02-26 00:00:00'::timestamp,
    '2016-03-03 23:59:59'::timestamp
  UNION ALL
  SELECT 
    'oslo-freedom-forum-2022-taiwan-interactive-expo',
    'oslo_freedom_taiwan',
    '2022-10-31 00:00:00'::timestamp,
    '2022-11-06 23:59:59'::timestamp
  UNION ALL
  SELECT 
    'reactions-to-the-great-chinese-firewall',
    'chinese_firewall_vbko',
    '2020-01-13 00:00:00'::timestamp,
    '2020-01-19 23:59:59'::timestamp
  UNION ALL
  SELECT 
    'firewall-featured-on-bbc-the-real-story',
    'bbc_real_story_russia',
    '2019-10-29 00:00:00'::timestamp,
    '2019-11-04 23:59:59'::timestamp
  UNION ALL
  SELECT 
    'apex-for-youth-after-school-field-trip',
    'apex_youth_after_school',
    '2016-02-22 00:00:00'::timestamp,
    '2016-03-06 23:59:59'::timestamp
  UNION ALL
  SELECT 
    'creative-hacktivism-roundtable',
    'creative_hacktivism_roundtable',
    '2016-02-23 00:00:00'::timestamp,
    '2016-02-29 23:59:59'::timestamp
  UNION ALL
  SELECT 
    'proxy-pals-trial-by-firewall',
    'proxy_pals_trial_by_firewall',
    '2016-02-15 00:00:00'::timestamp,
    '2016-02-21 23:59:59'::timestamp
  UNION ALL
  SELECT 
    'networked-feminism-in-china',
    'networked_feminism_in_china',
    '2016-02-16 00:00:00'::timestamp,
    '2016-02-22 23:59:59'::timestamp
  UNION ALL
  SELECT 
    'firewall-pop-up-group-show-in-rvcc',
    'rvcc_group_show',
    '2022-08-28 00:00:00'::timestamp,
    '2022-10-03 23:59:59'::timestamp
  UNION ALL
  SELECT 
    'oslo-freedom-forum-2021-miami-interactive-expo',
    'oslo_freedom_miami',
    '2021-10-01 00:00:00'::timestamp,
    '2021-10-07 23:59:59'::timestamp
  UNION ALL
  SELECT 
    'redirect-at-ramp-gallery-asheville-nc',
    'redirect_at_ramp_gallery',
    '2020-01-21 00:00:00'::timestamp,
    '2020-02-27 23:59:59'::timestamp
  UNION ALL
  SELECT 
    'search-for-feminism-at-vbko-vienna-austria',
    'search_for_feminism_vbko',
    '2020-01-07 00:00:00'::timestamp,
    '2020-02-04 23:59:59'::timestamp
  UNION ALL
  SELECT 
    'new-media-caucus-border-control-symposium',
    'border_control_symposium',
    '2019-09-18 00:00:00'::timestamp,
    '2019-09-24 23:59:59'::timestamp
  UNION ALL
  SELECT 
    'hknotfound',
    'hong_kong_not_found',
    '2015-12-09 00:00:00'::timestamp,
    '2015-12-16 23:59:59'::timestamp
  UNION ALL
  SELECT 
    'off-2018',
    'oslo_freedom_forum_2018',
    '2018-05-25 00:00:00'::timestamp,
    '2018-05-31 23:59:59'::timestamp
  UNION ALL
  SELECT 
    'off-nyc-2017',
    'oslo_freedom_forum_nyc',
    '2017-09-16 00:00:00'::timestamp,
    '2017-09-22 23:59:59'::timestamp
  UNION ALL
  SELECT 
    'off2017',
    'oslo_freedom_forum_2017',
    '2017-05-17 00:00:00'::timestamp,
    '2017-05-27 23:59:59'::timestamp
  UNION ALL
  SELECT 
    'search-for-serendipity-in-austria',
    'search_for_serendipity',
    '2016-11-30 00:00:00'::timestamp,
    '2017-01-03 23:59:59'::timestamp
  UNION ALL
  SELECT 
    'inaugural-new-york-2016-pop-up',
    'inaugural_new_york_pop_up',
    '2016-02-05 00:00:00'::timestamp,
    '2016-03-09 23:59:59'::timestamp
),
searches_during_events AS (
  SELECT 
    s.search_id,
    s.search_term_initial,
    TO_TIMESTAMP(s.search_timestamp) as created_at,
    s.search_location as current_location,
    e.event_name,
    e.event_location as new_location,
    COUNT(*) OVER (PARTITION BY s.search_id) as event_count
  FROM searches s
  INNER JOIN events e 
    ON TO_TIMESTAMP(s.search_timestamp) >= e.start_time 
    AND TO_TIMESTAMP(s.search_timestamp) <= e.end_time
  WHERE s.search_location != 'automated_scraper'
)
-- Searches that fall within multiple events (conflicts)
SELECT 
  'CONFLICT' as status,
  search_id,
  search_term_initial,
  created_at,
  current_location,
  STRING_AGG(event_name || ' (' || new_location || ')', ', ' ORDER BY event_name) as overlapping_events
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
  event_name || ' (' || new_location || ')' as overlapping_events
FROM searches_during_events
WHERE event_count = 1

ORDER BY status DESC, created_at;

-- Update statement for searches within single events (commented out for safety)
-- Uncomment and run after reviewing the results above
/*
UPDATE searches s
SET search_location = sde.new_location
FROM (
  SELECT DISTINCT
    search_id,
    new_location
  FROM searches_during_events
  WHERE event_count = 1
) sde
WHERE s.search_id = sde.search_id
  AND s.search_location != sde.new_location;
*/

-- Summary statistics (run as a separate query)
WITH events AS (
  SELECT 
    'firewall-pop-up-with-inside-chinas-surveillance-state-a-lecture-by-megha-rajagopalan' as event_name,
    'china_surveillance_marist' as event_location,
    '2020-02-23 00:00:00'::timestamp as start_time,
    '2020-02-29 23:59:59'::timestamp as end_time
  UNION ALL
  SELECT 
    'marymount-manhattan-digital-media-society-class-field-trip',
    'digital_media_chinatown',
    '2016-02-26 00:00:00'::timestamp,
    '2016-03-03 23:59:59'::timestamp
  UNION ALL
  SELECT 
    'oslo-freedom-forum-2022-taiwan-interactive-expo',
    'oslo_freedom_taiwan',
    '2022-10-31 00:00:00'::timestamp,
    '2022-11-06 23:59:59'::timestamp
  UNION ALL
  SELECT 
    'reactions-to-the-great-chinese-firewall',
    'chinese_firewall_vbko',
    '2020-01-13 00:00:00'::timestamp,
    '2020-01-19 23:59:59'::timestamp
  UNION ALL
  SELECT 
    'firewall-featured-on-bbc-the-real-story',
    'bbc_real_story_russia',
    '2019-10-29 00:00:00'::timestamp,
    '2019-11-04 23:59:59'::timestamp
  UNION ALL
  SELECT 
    'apex-for-youth-after-school-field-trip',
    'apex_youth_after_school',
    '2016-02-22 00:00:00'::timestamp,
    '2016-03-06 23:59:59'::timestamp
  UNION ALL
  SELECT 
    'creative-hacktivism-roundtable',
    'creative_hacktivism_roundtable',
    '2016-02-23 00:00:00'::timestamp,
    '2016-02-29 23:59:59'::timestamp
  UNION ALL
  SELECT 
    'proxy-pals-trial-by-firewall',
    'proxy_pals_trial_by_firewall',
    '2016-02-15 00:00:00'::timestamp,
    '2016-02-21 23:59:59'::timestamp
  UNION ALL
  SELECT 
    'networked-feminism-in-china',
    'networked_feminism_in_china',
    '2016-02-16 00:00:00'::timestamp,
    '2016-02-22 23:59:59'::timestamp
  UNION ALL
  SELECT 
    'firewall-pop-up-group-show-in-rvcc',
    'rvcc_group_show',
    '2022-08-28 00:00:00'::timestamp,
    '2022-10-03 23:59:59'::timestamp
  UNION ALL
  SELECT 
    'oslo-freedom-forum-2021-miami-interactive-expo',
    'oslo_freedom_miami',
    '2021-10-01 00:00:00'::timestamp,
    '2021-10-07 23:59:59'::timestamp
  UNION ALL
  SELECT 
    'redirect-at-ramp-gallery-asheville-nc',
    'redirect_at_ramp_gallery',
    '2020-01-21 00:00:00'::timestamp,
    '2020-02-27 23:59:59'::timestamp
  UNION ALL
  SELECT 
    'search-for-feminism-at-vbko-vienna-austria',
    'search_for_feminism_vbko',
    '2020-01-07 00:00:00'::timestamp,
    '2020-02-04 23:59:59'::timestamp
  UNION ALL
  SELECT 
    'new-media-caucus-border-control-symposium',
    'border_control_symposium',
    '2019-09-18 00:00:00'::timestamp,
    '2019-09-24 23:59:59'::timestamp
  UNION ALL
  SELECT 
    'hknotfound',
    'hong_kong_not_found',
    '2015-12-09 00:00:00'::timestamp,
    '2015-12-16 23:59:59'::timestamp
  UNION ALL
  SELECT 
    'off-2018',
    'oslo_freedom_forum_2018',
    '2018-05-25 00:00:00'::timestamp,
    '2018-05-31 23:59:59'::timestamp
  UNION ALL
  SELECT 
    'off-nyc-2017',
    'oslo_freedom_forum_nyc',
    '2017-09-16 00:00:00'::timestamp,
    '2017-09-22 23:59:59'::timestamp
  UNION ALL
  SELECT 
    'off2017',
    'oslo_freedom_forum_2017',
    '2017-05-17 00:00:00'::timestamp,
    '2017-05-27 23:59:59'::timestamp
  UNION ALL
  SELECT 
    'search-for-serendipity-in-austria',
    'search_for_serendipity',
    '2016-11-30 00:00:00'::timestamp,
    '2017-01-03 23:59:59'::timestamp
  UNION ALL
  SELECT 
    'inaugural-new-york-2016-pop-up',
    'inaugural_new_york_pop_up',
    '2016-02-05 00:00:00'::timestamp,
    '2016-03-09 23:59:59'::timestamp
),
searches_during_events AS (
  SELECT 
    s.search_id,
    COUNT(*) OVER (PARTITION BY s.search_id) as event_count
  FROM searches s
  INNER JOIN events e 
    ON TO_TIMESTAMP(s.search_timestamp) >= e.start_time 
    AND TO_TIMESTAMP(s.search_timestamp) <= e.end_time
  WHERE s.search_location != 'automated_scraper'
)
SELECT 
  'Summary' as report_type,
  COUNT(DISTINCT CASE WHEN event_count = 1 THEN search_id END) as single_event_matches,
  COUNT(DISTINCT CASE WHEN event_count > 1 THEN search_id END) as multi_event_conflicts,
  COUNT(DISTINCT search_id) as total_event_searches
FROM searches_during_events;