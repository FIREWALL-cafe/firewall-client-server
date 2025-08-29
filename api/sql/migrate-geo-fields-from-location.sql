-- SQL script to populate geographic fields (country, region, city) from search_location
-- This updates searches that have a search_location but missing geo data
-- Based on actual location values found in the database

-- Create a temporary mapping table for location to geo data
CREATE TEMP TABLE location_geo_mapping (
    search_location VARCHAR(255),
    country_code VARCHAR(2),
    country VARCHAR(100),
    region VARCHAR(100),
    city VARCHAR(100)
);

-- Insert location to geo mappings based on actual data patterns
-- Format: (search_location, country_code, country, region, city)
INSERT INTO location_geo_mapping VALUES
    -- US Cities with states
    ('New York City', 'US', 'United States', 'New York', 'New York City'),
    ('New York', 'US', 'United States', 'New York', 'New York'),
    ('Atlanta', 'US', 'United States', 'Georgia', 'Atlanta'),
    ('San Francisco', 'US', 'United States', 'California', 'San Francisco'),
    ('Los Angeles', 'US', 'United States', 'California', 'Los Angeles'),
    ('Chicago', 'US', 'United States', 'Illinois', 'Chicago'),
    ('Boston', 'US', 'United States', 'Massachusetts', 'Boston'),
    ('Seattle', 'US', 'United States', 'Washington', 'Seattle'),
    ('Portland', 'US', 'United States', 'Oregon', 'Portland'),
    ('Miami', 'US', 'United States', 'Florida', 'Miami'),
    ('Houston', 'US', 'United States', 'Texas', 'Houston'),
    ('Dallas', 'US', 'United States', 'Texas', 'Dallas'),
    ('Austin', 'US', 'United States', 'Texas', 'Austin'),
    ('Phoenix', 'US', 'United States', 'Arizona', 'Phoenix'),
    ('Philadelphia', 'US', 'United States', 'Pennsylvania', 'Philadelphia'),
    ('San Diego', 'US', 'United States', 'California', 'San Diego'),
    ('Denver', 'US', 'United States', 'Colorado', 'Denver'),
    ('Washington', 'US', 'United States', 'District of Columbia', 'Washington'),
    ('Washington DC', 'US', 'United States', 'District of Columbia', 'Washington DC'),
    ('Detroit', 'US', 'United States', 'Michigan', 'Detroit'),
    ('Minneapolis', 'US', 'United States', 'Minnesota', 'Minneapolis'),
    ('Nashville', 'US', 'United States', 'Tennessee', 'Nashville'),
    ('Baltimore', 'US', 'United States', 'Maryland', 'Baltimore'),
    ('Las Vegas', 'US', 'United States', 'Nevada', 'Las Vegas'),
    ('Kansas City', 'US', 'United States', 'Missouri', 'Kansas City'),
    ('Columbus', 'US', 'United States', 'Ohio', 'Columbus'),
    ('Cleveland', 'US', 'United States', 'Ohio', 'Cleveland'),
    ('Pittsburgh', 'US', 'United States', 'Pennsylvania', 'Pittsburgh'),
    ('Cincinnati', 'US', 'United States', 'Ohio', 'Cincinnati'),
    ('Indianapolis', 'US', 'United States', 'Indiana', 'Indianapolis'),
    ('Charlotte', 'US', 'United States', 'North Carolina', 'Charlotte'),
    ('Raleigh', 'US', 'United States', 'North Carolina', 'Raleigh'),
    ('Orlando', 'US', 'United States', 'Florida', 'Orlando'),
    ('Tampa', 'US', 'United States', 'Florida', 'Tampa'),
    ('St. Louis', 'US', 'United States', 'Missouri', 'St. Louis'),
    ('St Louis', 'US', 'United States', 'Missouri', 'St. Louis'),
    ('Salt Lake City', 'US', 'United States', 'Utah', 'Salt Lake City'),
    ('Sacramento', 'US', 'United States', 'California', 'Sacramento'),
    ('San Jose', 'US', 'United States', 'California', 'San Jose'),
    ('San Antonio', 'US', 'United States', 'Texas', 'San Antonio'),
    ('Milwaukee', 'US', 'United States', 'Wisconsin', 'Milwaukee'),
    ('Jacksonville', 'US', 'United States', 'Florida', 'Jacksonville'),
    ('Memphis', 'US', 'United States', 'Tennessee', 'Memphis'),
    ('Louisville', 'US', 'United States', 'Kentucky', 'Louisville'),
    ('Richmond', 'US', 'United States', 'Virginia', 'Richmond'),
    ('Oklahoma City', 'US', 'United States', 'Oklahoma', 'Oklahoma City'),
    ('New Orleans', 'US', 'United States', 'Louisiana', 'New Orleans'),
    ('Buffalo', 'US', 'United States', 'New York', 'Buffalo'),
    ('Hartford', 'US', 'United States', 'Connecticut', 'Hartford'),
    ('Birmingham', 'US', 'United States', 'Alabama', 'Birmingham'),
    ('Rochester', 'US', 'United States', 'New York', 'Rochester'),
    ('Albany', 'US', 'United States', 'New York', 'Albany'),
    ('Tucson', 'US', 'United States', 'Arizona', 'Tucson'),
    ('Fresno', 'US', 'United States', 'California', 'Fresno'),
    ('Oakland', 'US', 'United States', 'California', 'Oakland'),
    ('Fort Worth', 'US', 'United States', 'Texas', 'Fort Worth'),
    ('Albuquerque', 'US', 'United States', 'New Mexico', 'Albuquerque'),
    
    -- Additional Michigan cities
    ('Ann Arbor', 'US', 'United States', 'Michigan', 'Ann Arbor'),
    ('Grand Rapids', 'US', 'United States', 'Michigan', 'Grand Rapids'),
    ('Lansing', 'US', 'United States', 'Michigan', 'Lansing'),
    ('Flint', 'US', 'United States', 'Michigan', 'Flint'),
    
    -- International locations
    -- Hong Kong variations
    ('Hong Kong', 'HK', 'Hong Kong', 'Hong Kong', 'Hong Kong'),
    ('HK', 'HK', 'Hong Kong', 'Hong Kong', 'Hong Kong'),
    ('Hong Kong SAR', 'HK', 'Hong Kong', 'Hong Kong', 'Hong Kong'),
    
    -- Austria
    ('Vienna', 'AT', 'Austria', 'Vienna', 'Vienna'),
    ('Graz', 'AT', 'Austria', 'Styria', 'Graz'),
    ('Salzburg', 'AT', 'Austria', 'Salzburg', 'Salzburg'),
    ('Innsbruck', 'AT', 'Austria', 'Tyrol', 'Innsbruck'),
    ('Linz', 'AT', 'Austria', 'Upper Austria', 'Linz'),
    ('Austria', 'AT', 'Austria', 'Austria', 'Austria'),
    
    -- Norway
    ('Oslo', 'NO', 'Norway', 'Oslo', 'Oslo'),
    ('Bergen', 'NO', 'Norway', 'Vestland', 'Bergen'),
    ('Trondheim', 'NO', 'Norway', 'Trøndelag', 'Trondheim'),
    ('Stavanger', 'NO', 'Norway', 'Rogaland', 'Stavanger'),
    ('Norway', 'NO', 'Norway', 'Norway', 'Norway'),
    
    -- Taiwan
    ('Taipei', 'TW', 'Taiwan', 'Taipei', 'Taipei'),
    ('Kaohsiung', 'TW', 'Taiwan', 'Kaohsiung', 'Kaohsiung'),
    ('Taichung', 'TW', 'Taiwan', 'Taichung', 'Taichung'),
    ('Taiwan', 'TW', 'Taiwan', 'Taiwan', 'Taiwan'),
    
    -- Canada
    ('Toronto', 'CA', 'Canada', 'Ontario', 'Toronto'),
    ('Montreal', 'CA', 'Canada', 'Quebec', 'Montreal'),
    ('Vancouver', 'CA', 'Canada', 'British Columbia', 'Vancouver'),
    ('Calgary', 'CA', 'Canada', 'Alberta', 'Calgary'),
    ('Edmonton', 'CA', 'Canada', 'Alberta', 'Edmonton'),
    ('Ottawa', 'CA', 'Canada', 'Ontario', 'Ottawa'),
    ('Quebec City', 'CA', 'Canada', 'Quebec', 'Quebec City'),
    ('Winnipeg', 'CA', 'Canada', 'Manitoba', 'Winnipeg'),
    ('Canada', 'CA', 'Canada', 'Canada', 'Canada'),
    
    -- United Kingdom
    ('London', 'GB', 'United Kingdom', 'England', 'London'),
    ('Manchester', 'GB', 'United Kingdom', 'England', 'Manchester'),
    ('Birmingham', 'GB', 'United Kingdom', 'England', 'Birmingham'),
    ('Edinburgh', 'GB', 'United Kingdom', 'Scotland', 'Edinburgh'),
    ('Glasgow', 'GB', 'United Kingdom', 'Scotland', 'Glasgow'),
    ('Cardiff', 'GB', 'United Kingdom', 'Wales', 'Cardiff'),
    ('Belfast', 'GB', 'United Kingdom', 'Northern Ireland', 'Belfast'),
    ('UK', 'GB', 'United Kingdom', 'United Kingdom', 'UK'),
    ('United Kingdom', 'GB', 'United Kingdom', 'United Kingdom', 'United Kingdom'),
    
    -- China
    ('Beijing', 'CN', 'China', 'Beijing', 'Beijing'),
    ('Shanghai', 'CN', 'China', 'Shanghai', 'Shanghai'),
    ('Guangzhou', 'CN', 'China', 'Guangdong', 'Guangzhou'),
    ('Shenzhen', 'CN', 'China', 'Guangdong', 'Shenzhen'),
    ('Chengdu', 'CN', 'China', 'Sichuan', 'Chengdu'),
    ('Wuhan', 'CN', 'China', 'Hubei', 'Wuhan'),
    ('Xi''an', 'CN', 'China', 'Shaanxi', 'Xi''an'),
    ('Hangzhou', 'CN', 'China', 'Zhejiang', 'Hangzhou'),
    ('China', 'CN', 'China', 'China', 'China'),
    ('Peking', 'CN', 'China', 'Beijing', 'Beijing'),
    
    -- Germany
    ('Berlin', 'DE', 'Germany', 'Berlin', 'Berlin'),
    ('Munich', 'DE', 'Germany', 'Bavaria', 'Munich'),
    ('Hamburg', 'DE', 'Germany', 'Hamburg', 'Hamburg'),
    ('Frankfurt', 'DE', 'Germany', 'Hesse', 'Frankfurt'),
    ('Cologne', 'DE', 'Germany', 'North Rhine-Westphalia', 'Cologne'),
    ('Stuttgart', 'DE', 'Germany', 'Baden-Württemberg', 'Stuttgart'),
    ('Germany', 'DE', 'Germany', 'Germany', 'Germany'),
    
    -- Australia
    ('Sydney', 'AU', 'Australia', 'New South Wales', 'Sydney'),
    ('Melbourne', 'AU', 'Australia', 'Victoria', 'Melbourne'),
    ('Brisbane', 'AU', 'Australia', 'Queensland', 'Brisbane'),
    ('Perth', 'AU', 'Australia', 'Western Australia', 'Perth'),
    ('Adelaide', 'AU', 'Australia', 'South Australia', 'Adelaide'),
    ('Canberra', 'AU', 'Australia', 'Australian Capital Territory', 'Canberra'),
    ('Australia', 'AU', 'Australia', 'Australia', 'Australia'),
    
    -- Other major international cities
    ('Paris', 'FR', 'France', 'Île-de-France', 'Paris'),
    ('Tokyo', 'JP', 'Japan', 'Tokyo', 'Tokyo'),
    ('Seoul', 'KR', 'South Korea', 'Seoul', 'Seoul'),
    ('Singapore', 'SG', 'Singapore', 'Singapore', 'Singapore'),
    ('Madrid', 'ES', 'Spain', 'Madrid', 'Madrid'),
    ('Rome', 'IT', 'Italy', 'Lazio', 'Rome'),
    ('Amsterdam', 'NL', 'Netherlands', 'North Holland', 'Amsterdam'),
    ('Stockholm', 'SE', 'Sweden', 'Stockholm', 'Stockholm'),
    ('Copenhagen', 'DK', 'Denmark', 'Capital Region', 'Copenhagen'),
    ('Helsinki', 'FI', 'Finland', 'Uusimaa', 'Helsinki'),
    ('Dublin', 'IE', 'Ireland', 'Leinster', 'Dublin'),
    ('Zurich', 'CH', 'Switzerland', 'Zurich', 'Zurich'),
    ('Brussels', 'BE', 'Belgium', 'Brussels', 'Brussels'),
    ('Lisbon', 'PT', 'Portugal', 'Lisbon', 'Lisbon'),
    ('Prague', 'CZ', 'Czech Republic', 'Prague', 'Prague'),
    ('Warsaw', 'PL', 'Poland', 'Masovian', 'Warsaw'),
    ('Budapest', 'HU', 'Hungary', 'Budapest', 'Budapest'),
    ('Athens', 'GR', 'Greece', 'Attica', 'Athens'),
    ('Moscow', 'RU', 'Russia', 'Moscow', 'Moscow'),
    ('Mumbai', 'IN', 'India', 'Maharashtra', 'Mumbai'),
    ('Delhi', 'IN', 'India', 'Delhi', 'Delhi'),
    ('Bangalore', 'IN', 'India', 'Karnataka', 'Bangalore'),
    ('Dubai', 'AE', 'United Arab Emirates', 'Dubai', 'Dubai'),
    ('Tel Aviv', 'IL', 'Israel', 'Tel Aviv', 'Tel Aviv'),
    ('Cairo', 'EG', 'Egypt', 'Cairo', 'Cairo'),
    ('Johannesburg', 'ZA', 'South Africa', 'Gauteng', 'Johannesburg'),
    ('São Paulo', 'BR', 'Brazil', 'São Paulo', 'São Paulo'),
    ('Sao Paulo', 'BR', 'Brazil', 'São Paulo', 'São Paulo'),
    ('Rio de Janeiro', 'BR', 'Brazil', 'Rio de Janeiro', 'Rio de Janeiro'),
    ('Buenos Aires', 'AR', 'Argentina', 'Buenos Aires', 'Buenos Aires'),
    ('Mexico City', 'MX', 'Mexico', 'Mexico City', 'Mexico City');

-- Show current state before update
SELECT 'BEFORE UPDATE:' as status;
SELECT 
    COUNT(*) as total_records,
    COUNT(CASE WHEN search_location IS NOT NULL AND search_location != '' THEN 1 END) as with_location,
    COUNT(CASE WHEN search_country IS NOT NULL AND search_country != '' THEN 1 END) as with_country,
    COUNT(CASE WHEN search_region IS NOT NULL AND search_region != '' THEN 1 END) as with_region,
    COUNT(CASE WHEN search_city IS NOT NULL AND search_city != '' THEN 1 END) as with_city
FROM searches;

-- Show what locations we have that will be updated
SELECT 'Locations to be updated:' as status;
SELECT DISTINCT search_location, COUNT(*) as count
FROM searches 
WHERE search_location IS NOT NULL 
  AND search_location != ''
  AND search_location != 'nyc3'
  AND (search_country IS NULL OR search_country = '' OR 
       search_region IS NULL OR search_region = '' OR
       search_city IS NULL OR search_city = '')
GROUP BY search_location
ORDER BY count DESC
LIMIT 20;

-- Update searches with geo data based on search_location
-- This updates only records that have a search_location but are missing country, region, or city data
UPDATE searches s
SET 
    search_country_code = COALESCE(NULLIF(s.search_country_code, ''), m.country_code),
    search_country = COALESCE(NULLIF(s.search_country, ''), m.country),
    search_region = COALESCE(NULLIF(s.search_region, ''), m.region),
    search_city = COALESCE(NULLIF(s.search_city, ''), m.city)
FROM location_geo_mapping m
WHERE s.search_location = m.search_location
  AND s.search_location IS NOT NULL
  AND s.search_location != ''
  AND s.search_location != 'nyc3'
  AND (s.search_country IS NULL OR s.search_country = '' OR 
       s.search_region IS NULL OR s.search_region = '' OR
       s.search_city IS NULL OR s.search_city = '');

-- Show how many records were updated
SELECT 'Records updated: ' || COUNT(*) as status
FROM searches s
JOIN location_geo_mapping m ON s.search_location = m.search_location
WHERE s.search_location IS NOT NULL
  AND s.search_location != ''
  AND s.search_location != 'nyc3';

-- Show current state after update
SELECT 'AFTER UPDATE:' as status;
SELECT 
    COUNT(*) as total_records,
    COUNT(CASE WHEN search_location IS NOT NULL AND search_location != '' THEN 1 END) as with_location,
    COUNT(CASE WHEN search_country IS NOT NULL AND search_country != '' THEN 1 END) as with_country,
    COUNT(CASE WHEN search_region IS NOT NULL AND search_region != '' THEN 1 END) as with_region,
    COUNT(CASE WHEN search_city IS NOT NULL AND search_city != '' THEN 1 END) as with_city
FROM searches;

-- Verify the update by showing country distribution after update
SELECT 'Country distribution after update:' as status;
SELECT 
    search_country_code as code,
    search_country as country,
    COUNT(*) as search_count,
    ROUND(
        (COUNT(*) * 100.0 / (SELECT COUNT(*) FROM searches WHERE search_country IS NOT NULL)), 
        1
    ) as percentage
FROM searches 
WHERE search_country IS NOT NULL
GROUP BY search_country_code, search_country
ORDER BY search_count DESC 
LIMIT 20;

-- Show US state distribution
SELECT 'US state distribution:' as status;
SELECT 
    search_region as state,
    COUNT(*) as search_count,
    ROUND(
        (COUNT(*) * 100.0 / (SELECT COUNT(*) FROM searches WHERE search_country_code = 'US')), 
        1
    ) as percentage
FROM searches 
WHERE search_country_code = 'US' AND search_region IS NOT NULL
GROUP BY search_region
ORDER BY search_count DESC 
LIMIT 20;

-- Show any remaining unmapped locations
SELECT 'Unmapped locations (may need manual review):' as status;
SELECT DISTINCT search_location, COUNT(*) as count
FROM searches 
WHERE search_location IS NOT NULL 
  AND search_location != ''
  AND search_location != 'nyc3'
  AND (search_country IS NULL OR search_country = '')
GROUP BY search_location
ORDER BY count DESC
LIMIT 20;

-- Clean up
DROP TABLE location_geo_mapping;

-- Summary message
SELECT 'Migration complete! Run queries above to verify the results.' as message;