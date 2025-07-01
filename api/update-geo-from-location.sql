-- SQL script to update geo attributes based on search_location
-- This updates searches that have a search_location but missing geo data

-- Create a temporary mapping table
CREATE TEMP TABLE location_ip_mapping (
    search_location VARCHAR(255),
    country VARCHAR(100),
    ip_address VARCHAR(45),
    country_code VARCHAR(2),
    region VARCHAR(100),
    city VARCHAR(100)
);

-- Insert location to IP/geo mappings
INSERT INTO location_ip_mapping VALUES
    -- Michigan locations
    ('ann_arbor', '141.211.0.1', 'United States', 'US', 'Michigan', 'Ann Arbor'),
    ('detroit', '165.154.0.1', 'United States', 'US', 'Michigan', 'Detroit'),
    ('grand_rapids', '69.17.0.1', 'United States', 'US', 'Michigan', 'Grand Rapids'),
    ('lansing', '198.111.0.1', 'United States', 'US', 'Michigan', 'Lansing'),
    ('flint', '69.40.0.1', 'United States', 'US', 'Michigan', 'Flint'),
    
    -- Major US cities
    ('new_york_city', '74.125.0.1', 'United States', 'US', 'New York', 'New York'),
    ('los_angeles', '173.245.0.1', 'United States', 'US', 'California', 'Los Angeles'),
    ('chicago', '173.252.0.1', 'United States', 'US', 'Illinois', 'Chicago'),
    ('houston', '162.157.0.1', 'United States', 'US', 'Texas', 'Houston'),
    ('phoenix', '184.95.0.1', 'United States', 'US', 'Arizona', 'Phoenix'),
    ('philadelphia', '173.194.0.1', 'United States', 'US', 'Pennsylvania', 'Philadelphia'),
    ('san_antonio', '192.124.0.1', 'United States', 'US', 'Texas', 'San Antonio'),
    ('san_diego', '169.235.0.1', 'United States', 'US', 'California', 'San Diego'),
    ('dallas', '157.130.0.1', 'United States', 'US', 'Texas', 'Dallas'),
    ('san_jose', '216.58.0.1', 'United States', 'US', 'California', 'San Jose'),
    ('austin', '107.0.0.1', 'United States', 'US', 'Texas', 'Austin'),
    ('jacksonville', '65.35.0.1', 'United States', 'US', 'Florida', 'Jacksonville'),
    ('san_francisco', '140.82.0.1', 'United States', 'US', 'California', 'San Francisco'),
    ('indianapolis', '156.56.0.1', 'United States', 'US', 'Indiana', 'Indianapolis'),
    ('columbus', '164.107.0.1', 'United States', 'US', 'Ohio', 'Columbus'),
    ('fort_worth', '129.109.0.1', 'United States', 'US', 'Texas', 'Fort Worth'),
    ('charlotte', '152.19.0.1', 'United States', 'US', 'North Carolina', 'Charlotte'),
    ('seattle', '131.107.0.1', 'United States', 'US', 'Washington', 'Seattle'),
    ('denver', '198.11.0.1', 'United States', 'US', 'Colorado', 'Denver'),
    ('washington', '158.59.0.1', 'United States', 'US', 'District of Columbia', 'Washington'),
    ('boston', '18.0.0.1', 'United States', 'US', 'Massachusetts', 'Boston'),
    ('nashville', '129.59.0.1', 'United States', 'US', 'Tennessee', 'Nashville'),
    ('baltimore', '128.220.0.1', 'United States', 'US', 'Maryland', 'Baltimore'),
    ('memphis', '141.225.0.1', 'United States', 'US', 'Tennessee', 'Memphis'),
    ('portland', '209.142.0.1', 'United States', 'US', 'Oregon', 'Portland'),
    ('las_vegas', '72.32.0.1', 'United States', 'US', 'Nevada', 'Las Vegas'),
    ('milwaukee', '129.89.0.1', 'United States', 'US', 'Wisconsin', 'Milwaukee'),
    ('albuquerque', '129.24.0.1', 'United States', 'US', 'New Mexico', 'Albuquerque'),
    ('tucson', '150.135.0.1', 'United States', 'US', 'Arizona', 'Tucson'),
    ('fresno', '169.134.0.1', 'United States', 'US', 'California', 'Fresno'),
    ('sacramento', '168.150.0.1', 'United States', 'US', 'California', 'Sacramento'),
    ('kansas_city', '165.134.0.1', 'United States', 'US', 'Missouri', 'Kansas City'),
    ('atlanta', '130.207.0.1', 'United States', 'US', 'Georgia', 'Atlanta'),
    ('miami', '131.94.0.1', 'United States', 'US', 'Florida', 'Miami'),
    ('oakland', '169.229.0.1', 'United States', 'US', 'California', 'Oakland'),
    ('minneapolis', '134.84.0.1', 'United States', 'US', 'Minnesota', 'Minneapolis'),
    ('cleveland', '129.22.0.1', 'United States', 'US', 'Ohio', 'Cleveland'),
    ('tampa', '131.247.0.1', 'United States', 'US', 'Florida', 'Tampa'),
    ('st_louis', '128.252.0.1', 'United States', 'US', 'Missouri', 'St. Louis'),
    ('pittsburgh', '128.237.0.1', 'United States', 'US', 'Pennsylvania', 'Pittsburgh'),
    ('cincinnati', '129.137.0.1', 'United States', 'US', 'Ohio', 'Cincinnati'),
    ('raleigh', '152.1.0.1', 'United States', 'US', 'North Carolina', 'Raleigh'),
    ('salt_lake_city', '155.97.0.1', 'United States', 'US', 'Utah', 'Salt Lake City'),
    ('orlando', '132.170.0.1', 'United States', 'US', 'Florida', 'Orlando'),
    
    -- International cities
    ('toronto', '142.1.0.1', 'Canada', 'CA', 'Ontario', 'Toronto'),
    ('vancouver', '142.103.0.1', 'Canada', 'CA', 'British Columbia', 'Vancouver'),
    ('montreal', '132.205.0.1', 'Canada', 'CA', 'Quebec', 'Montreal'),
    ('london', '212.58.0.1', 'United Kingdom', 'GB', 'England', 'London'),
    ('paris', '193.51.0.1', 'France', 'FR', 'Île-de-France', 'Paris'),
    ('tokyo', '133.11.0.1', 'Japan', 'JP', 'Tokyo', 'Tokyo'),
    ('sydney', '203.2.0.1', 'Australia', 'AU', 'New South Wales', 'Sydney'),
    ('berlin', '130.133.0.1', 'Germany', 'DE', 'Berlin', 'Berlin'),
    ('madrid', '213.4.0.1', 'Spain', 'ES', 'Madrid', 'Madrid'),
    ('rome', '193.205.0.1', 'Italy', 'IT', 'Lazio', 'Rome'),
    ('amsterdam', '145.97.0.1', 'Netherlands', 'NL', 'North Holland', 'Amsterdam'),
    ('stockholm', '130.237.0.1', 'Sweden', 'SE', 'Stockholm', 'Stockholm'),
    ('copenhagen', '130.225.0.1', 'Denmark', 'DK', 'Capital Region', 'Copenhagen'),
    ('oslo', '129.240.0.1', 'Norway', 'NO', 'Oslo', 'Oslo'),
    ('helsinki', '128.214.0.1', 'Finland', 'FI', 'Uusimaa', 'Helsinki'),
    ('dublin', '134.226.0.1', 'Ireland', 'IE', 'Leinster', 'Dublin'),
    ('vienna', '131.130.0.1', 'Austria', 'AT', 'Vienna', 'Vienna'),
    ('zurich', '129.132.0.1', 'Switzerland', 'CH', 'Zurich', 'Zurich'),
    ('brussels', '134.184.0.1', 'Belgium', 'BE', 'Brussels', 'Brussels'),
    ('lisbon', '193.136.0.1', 'Portugal', 'PT', 'Lisbon', 'Lisbon'),
    ('prague', '147.231.0.1', 'Czech Republic', 'CZ', 'Prague', 'Prague'),
    ('warsaw', '150.254.0.1', 'Poland', 'PL', 'Masovian', 'Warsaw'),
    ('budapest', '152.66.0.1', 'Hungary', 'HU', 'Budapest', 'Budapest'),
    ('athens', '147.102.0.1', 'Greece', 'GR', 'Attica', 'Athens'),
    ('moscow', '93.180.0.1', 'Russia', 'RU', 'Moscow', 'Moscow'),
    ('beijing', '166.111.0.1', 'China', 'CN', 'Beijing', 'Beijing'),
    ('shanghai', '202.120.0.1', 'China', 'CN', 'Shanghai', 'Shanghai'),
    ('hong_kong', '137.189.0.1', 'Hong Kong', 'HK', 'Hong Kong', 'Hong Kong'),
    ('singapore', '137.132.0.1', 'Singapore', 'SG', 'Singapore', 'Singapore'),
    ('seoul', '147.46.0.1', 'South Korea', 'KR', 'Seoul', 'Seoul'),
    ('mumbai', '14.139.0.1', 'India', 'IN', 'Maharashtra', 'Mumbai'),
    ('delhi', '164.100.0.1', 'India', 'IN', 'Delhi', 'Delhi'),
    ('bangalore', '106.51.0.1', 'India', 'IN', 'Karnataka', 'Bangalore'),
    ('dubai', '213.42.0.1', 'United Arab Emirates', 'AE', 'Dubai', 'Dubai'),
    ('tel_aviv', '132.66.0.1', 'Israel', 'IL', 'Tel Aviv', 'Tel Aviv'),
    ('cairo', '193.227.0.1', 'Egypt', 'EG', 'Cairo', 'Cairo'),
    ('johannesburg', '146.141.0.1', 'South Africa', 'ZA', 'Gauteng', 'Johannesburg'),
    ('sao_paulo', '143.107.0.1', 'Brazil', 'BR', 'São Paulo', 'São Paulo'),
    ('rio_de_janeiro', '146.164.0.1', 'Brazil', 'BR', 'Rio de Janeiro', 'Rio de Janeiro'),
    ('buenos_aires', '168.96.0.1', 'Argentina', 'AR', 'Buenos Aires', 'Buenos Aires'),
    ('mexico_city', '132.248.0.1', 'Mexico', 'MX', 'Mexico City', 'Mexico City');

-- First, let's see what search_locations we have that need updating
SELECT DISTINCT search_location, COUNT(*) as count
FROM searches 
WHERE search_location IS NOT NULL 
  AND search_location != ''
  AND (search_ip_address IS NULL OR search_country IS NULL)
GROUP BY search_location
ORDER BY count DESC;

-- Update searches with geo data based on search_location
-- This updates only records that have a search_location but are missing IP or country data
UPDATE searches s
SET 
    search_ip_address = COALESCE(s.search_ip_address, m.ip_address),
    search_country = COALESCE(s.search_country, m.country),
    search_country_code = COALESCE(s.search_country_code, m.country_code),
    search_region = COALESCE(s.search_region, m.region),
    search_city = COALESCE(s.search_city, m.city)
FROM location_ip_mapping m
WHERE LOWER(REPLACE(s.search_location, ' ', '_')) = m.search_location
  AND s.search_location IS NOT NULL
  AND (s.search_ip_address IS NULL OR s.search_country IS NULL);

-- Show how many records were updated
SELECT 
    'Updated ' || COUNT(*) || ' records with geo data from search_location'
FROM searches s
JOIN location_ip_mapping m ON LOWER(REPLACE(s.search_location, ' ', '_')) = m.search_location
WHERE s.search_location IS NOT NULL;

-- Clean up
DROP TABLE location_ip_mapping;

-- Verify the update by showing location distribution after update
SELECT 
    search_country as location,
    search_country_code as country_code,
    COUNT(*) as search_count,
    ROUND(
        (COUNT(*) * 100.0 / (SELECT COUNT(*) FROM searches WHERE search_country IS NOT NULL)), 
        1
    ) as percentage
FROM searches 
WHERE search_country IS NOT NULL
GROUP BY search_country, search_country_code
ORDER BY search_count DESC 
LIMIT 20;