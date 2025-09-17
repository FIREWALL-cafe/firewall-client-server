const cheerio = require('cheerio');
const { query } = require('express');
const config = require('./config.js')
const {pool,secret} = config
const space = require('./spaces-interface.js')
const locationByTimeRange = require('./location-time-ranges.js');
const ipGeolocationService = require('./services/ipGeolocation');
const eventData = require('./event-data.js');

const {Worker} = require('worker_threads');

/*****************************/
/* Helper Functions          */
/*****************************/

/**
 * Detects the language of a search term and returns the appropriate PostgreSQL text search configuration
 * @param {string} term - The search term to analyze
 * @returns {string} - The PostgreSQL text search configuration ('simple' for Chinese/Japanese/Korean, 'english' for others)
 */
const getSearchConfig = (term) => {
    if (!term) return 'simple';
    
    // Check for Chinese characters (CJK Unified Ideographs)
    const hasChinese = /[\u4e00-\u9fff]/.test(term);
    
    // Check for Japanese characters (Hiragana, Katakana)
    const hasJapanese = /[\u3040-\u309f\u30a0-\u30ff]/.test(term);
    
    // Check for Korean characters (Hangul)
    const hasKorean = /[\uac00-\ud7af\u1100-\u11ff]/.test(term);
    
    // Use 'simple' configuration for CJK languages, 'english' for others
    if (hasChinese || hasJapanese || hasKorean) {
        console.log(`Using 'simple' search config for CJK term: ${term}`);
        return 'simple';
    }
    
    console.log(`Using 'english' search config for term: ${term}`);
    return 'english';
};

/*****************************/
/*Dashboard Routes*/
/*****************************/

const getDashboardData = async (request, response) => {
    try {
        const [totalSearches, totalImages, totalVotes, totalUsers] = await Promise.all([
            getTotalSearches(),
            getTotalImages(),
            getTotalVotes(),
            getTotalUsers()
        ]);

        response.status(200).json({
            totalSearches,
            totalImages,
            totalVotes,
            totalUsers
        });
    } catch (error) {
        response.status(500).json(error);
    }
}

const getTotalSearches = () => {
    return new Promise((resolve, reject) => {
        const query = 'SELECT COUNT(*) FROM searches';
        pool.query(query, (error, result) => {
            if (error) {
                reject(error);
            } else {
                resolve(result.rows[0]);
            }
        });
    });
}

const getTotalImages = () => {
    return new Promise((resolve, reject) => {
        const query = 'SELECT COUNT(*) FROM images';
        pool.query(query, (error, result) => {
            if (error) {
                reject(error);
            } else {
                resolve(result.rows[0]);
            }
        });
    });
}

const getTotalVotes = () => {
    return new Promise((resolve, reject) => {
        const query = 'SELECT COUNT(*) FROM have_votes';
        pool.query(query, (error, result) => {
            if (error) {
                reject(error);
            } else {
                resolve(result.rows[0]);
            }
        });
    });
}

const getTotalUsers = () => {
    return new Promise((resolve, reject) => {
        const query = 'SELECT COUNT(distinct search_client_name) FROM searches';
        pool.query(query, (error, result) => {
            if (error) {
                reject(error);
            } else {
                resolve(result.rows[0]);
            }
        });
    });
}

/*****************************/
/*Analytics Routes*/
/*****************************/

const getGeographicAnalytics = (request, response) => {
    // Query geographic data from search_country field
    let query = `
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
        LIMIT 15
    `;
    
    pool.query(query, (error, results) => {
        if (error) {
            console.error('Geographic analytics query error:', error);
            response.status(500).json(error);
        } else {
            // If no IP-based data, fall back to location-based
            if (results.rows.length === 0) {
                const fallbackQuery = `
                    SELECT 
                        search_location as location,
                        COUNT(*) as search_count,
                        ROUND(
                            (COUNT(*) * 100.0 / (SELECT COUNT(*) FROM searches WHERE search_location IS NOT NULL AND search_location != 'automated_scraper' AND search_location != 'nyc3')), 
                            1
                        ) as percentage
                    FROM searches 
                    WHERE search_location IS NOT NULL 
                    AND search_location != 'automated_scraper'
                    AND search_location != 'nyc3'
                    GROUP BY search_location 
                    ORDER BY search_count DESC 
                    LIMIT 15
                `;
                
                pool.query(fallbackQuery, (error, fallbackResults) => {
                    if (error) {
                        response.status(500).json(error);
                    } else {
                        response.status(200).json(fallbackResults.rows);
                    }
                });
            } else {
                response.status(200).json(results.rows);
            }
        }
    });
}

const getUSStatesAnalytics = (request, response) => {
    // Query US states data from search_region field
    const query = `
        SELECT 
            search_region as state,
            COUNT(*) as search_count,
            ROUND(
                (COUNT(*) * 100.0 / (SELECT COUNT(*) FROM searches WHERE search_country = 'United States' AND search_region IS NOT NULL)), 
                1
            ) as percentage
        FROM searches 
        WHERE search_country_code = 'US' 
        AND search_region IS NOT NULL
        AND search_region != ''
        GROUP BY search_region
        ORDER BY search_count DESC
    `;
    
    pool.query(query, (error, results) => {
        if (error) {
            console.error('US States analytics query error:', error);
            response.status(500).json(error);
        } else {
            response.status(200).json(results.rows);
        }
    });
}

const getCountriesList = (request, response) => {
    const query = `
        SELECT DISTINCT
            search_country as name,
            search_country_code as code,
            COUNT(*) as search_count
        FROM searches 
        WHERE search_country IS NOT NULL
        AND search_country != ''
        GROUP BY search_country, search_country_code
        ORDER BY search_count DESC
    `;
    
    pool.query(query, (error, results) => {
        if (error) {
            console.error('Countries list query error:', error);
            response.status(500).json(error);
        } else {
            response.status(200).json(results.rows);
        }
    });
}

const getSearchLocationsList = async (request, response) => {
    try {
        const searchLocations = eventData.map(event => event.search_location);
        if (searchLocations.length === 0) {
            console.log('No search locations found');
            return response.status(200).json([]);
        }

        const query = `
            WITH locations AS (
                SELECT unnest($1::text[]) as search_location
            )
            SELECT 
                l.search_location,
                COALESCE(COUNT(s.search_id), 0) as search_count
            FROM locations l
            LEFT JOIN searches s ON s.search_location = l.search_location
            GROUP BY l.search_location
            ORDER BY search_count DESC, l.search_location ASC
        `;

        pool.query(query, [searchLocations], (error, results) => {
            if (error) {
                console.error('Search locations query error:', error);
                response.status(500).json(error);
            } else {
                response.status(200).json(results.rows);
            }
        });
    } catch (error) {
        console.error('Search locations function error:', error);
        return response.status(500).json(error);
    }
}

const getSearchAnalytics = async (request, response) => {
    try {
        // Execute all queries in parallel
        const [searchVolumeResult, topTermsResult, languagesResult, searchEnginesResult] = await Promise.all([
            // Search volume over the last 30 days
            new Promise((resolve, reject) => {
                const query = `
                    SELECT 
                        DATE(TO_TIMESTAMP(search_timestamp::bigint / 1000)) as search_date,
                        COUNT(*) as search_count
                    FROM searches 
                    WHERE search_location != 'automated_scraper' 
                    AND search_location != 'nyc3'
                    AND TO_TIMESTAMP(search_timestamp::bigint / 1000) >= NOW() - INTERVAL '30 days'
                    GROUP BY DATE(TO_TIMESTAMP(search_timestamp::bigint / 1000))
                    ORDER BY search_date DESC
                    LIMIT 30
                `;
                pool.query(query, (error, result) => {
                    if (error) reject(error);
                    else resolve(result.rows);
                });
            }),

            // Top 10 search terms
            new Promise((resolve, reject) => {
                const query = `
                    SELECT 
                        search_term_initial as term,
                        COUNT(*) as search_count
                    FROM searches 
                    WHERE search_location != 'automated_scraper' 
                    AND search_location != 'nyc3'
                    AND search_term_initial IS NOT NULL
                    AND search_term_initial != ''
                    GROUP BY search_term_initial 
                    ORDER BY search_count DESC 
                    LIMIT 10
                `;
                pool.query(query, (error, result) => {
                    if (error) reject(error);
                    else resolve(result.rows);
                });
            }),

            // Language distribution
            new Promise((resolve, reject) => {
                const query = `
                    SELECT 
                        COALESCE(search_term_initial_language_code, 'unknown') as language,
                        COUNT(*) as search_count,
                        ROUND(
                            (COUNT(*) * 100.0 / (SELECT COUNT(*) FROM searches WHERE search_location != 'automated_scraper' AND search_location != 'nyc3')), 
                            1
                        ) as percentage
                    FROM searches 
                    WHERE search_location != 'automated_scraper' 
                    AND search_location != 'nyc3'
                    GROUP BY search_term_initial_language_code 
                    ORDER BY search_count DESC
                `;
                pool.query(query, (error, result) => {
                    if (error) reject(error);
                    else resolve(result.rows);
                });
            }),

            // Search engine usage
            new Promise((resolve, reject) => {
                const query = `
                    SELECT 
                        search_engine_initial as engine,
                        COUNT(*) as search_count,
                        ROUND(
                            (COUNT(*) * 100.0 / (SELECT COUNT(*) FROM searches WHERE search_location != 'automated_scraper' AND search_location != 'nyc3')), 
                            1
                        ) as percentage
                    FROM searches 
                    WHERE search_location != 'automated_scraper' 
                    AND search_location != 'nyc3'
                    AND search_engine_initial IS NOT NULL
                    GROUP BY search_engine_initial 
                    ORDER BY search_count DESC
                `;
                pool.query(query, (error, result) => {
                    if (error) reject(error);
                    else resolve(result.rows);
                });
            })
        ]);

        const analyticsData = {
            searchVolume: searchVolumeResult,
            topTerms: topTermsResult,
            languages: languagesResult,
            searchEngines: searchEnginesResult
        };

        console.log('Search analytics results:', {
            searchVolume: searchVolumeResult.length,
            topTerms: topTermsResult.length,
            languages: languagesResult.length,
            searchEngines: searchEnginesResult.length
        });

        response.status(200).json(analyticsData);
    } catch (error) {
        console.error('Search analytics query error:', error);
        response.status(500).json(error);
    }
}

const getVoteAnalytics = async (request, response) => {
    try {
        // Vote categories mapping based on existing code
        const voteCategories = [
            { id: 1, name: 'Censored', color: '#ef4444' },
            { id: 2, name: 'Uncensored', color: '#22c55e' },
            { id: 3, name: 'Bad Translation', color: '#f97316' },
            { id: 4, name: 'Good Translation', color: '#3b82f6' },
            { id: 5, name: 'Lost in Translation', color: '#8b5cf6' },
            { id: 6, name: 'NSFW', color: '#ec4899' },
            { id: 7, name: 'WTF', color: '#6b7280' }
        ];

        // Execute all queries in parallel
        const [voteCategoryResult, voteTimelineResult, topVotedSearchesResult] = await Promise.all([
            // Vote category breakdown
            new Promise((resolve, reject) => {
                const query = `
                    SELECT 
                        vote_id,
                        COUNT(*) as vote_count
                    FROM have_votes hv
                    JOIN searches s ON hv.search_id = s.search_id
                    WHERE s.search_location != 'automated_scraper' 
                    AND s.search_location != 'nyc3'
                    GROUP BY vote_id 
                    ORDER BY vote_id
                `;
                pool.query(query, (error, result) => {
                    if (error) reject(error);
                    else resolve(result.rows);
                });
            }),

            // Vote timeline over last 30 days
            new Promise((resolve, reject) => {
                const query = `
                    SELECT 
                        DATE(TO_TIMESTAMP(s.search_timestamp::bigint / 1000)) as vote_date,
                        COUNT(*) as vote_count
                    FROM have_votes hv
                    JOIN searches s ON hv.search_id = s.search_id
                    WHERE s.search_location != 'automated_scraper' 
                    AND s.search_location != 'nyc3'
                    AND TO_TIMESTAMP(s.search_timestamp::bigint / 1000) >= NOW() - INTERVAL '30 days'
                    GROUP BY DATE(TO_TIMESTAMP(s.search_timestamp::bigint / 1000))
                    ORDER BY vote_date DESC
                    LIMIT 30
                `;
                pool.query(query, (error, result) => {
                    if (error) reject(error);
                    else resolve(result.rows);
                });
            }),

            // Top voted searches (most controversial)
            new Promise((resolve, reject) => {
                const query = `
                    SELECT 
                        s.search_term_initial,
                        COUNT(hv.vote_id) as total_votes,
                        s.search_location
                    FROM searches s
                    JOIN have_votes hv ON s.search_id = hv.search_id
                    WHERE s.search_location != 'automated_scraper' 
                    AND s.search_location != 'nyc3'
                    AND s.search_term_initial IS NOT NULL
                    GROUP BY s.search_id, s.search_term_initial, s.search_location
                    ORDER BY total_votes DESC
                    LIMIT 10
                `;
                pool.query(query, (error, result) => {
                    if (error) reject(error);
                    else resolve(result.rows);
                });
            })
        ]);

        // Process vote categories with names and percentages
        const totalVotes = voteCategoryResult.reduce((sum, vote) => sum + parseInt(vote.vote_count), 0);
        const voteCategories_processed = voteCategories.map(category => {
            const voteData = voteCategoryResult.find(v => parseInt(v.vote_id) === category.id);
            const count = voteData ? parseInt(voteData.vote_count) : 0;
            const percentage = totalVotes > 0 ? ((count / totalVotes) * 100).toFixed(1) : '0.0';
            
            return {
                ...category,
                count,
                percentage: parseFloat(percentage)
            };
        });

        const analyticsData = {
            voteCategories: voteCategories_processed,
            voteTimeline: voteTimelineResult,
            topVotedSearches: topVotedSearchesResult,
            totalVotes
        };

        console.log('Vote analytics results:', {
            voteCategories: voteCategories_processed.length,
            voteTimeline: voteTimelineResult.length,
            topVotedSearches: topVotedSearchesResult.length,
            totalVotes
        });

        response.status(200).json(analyticsData);
    } catch (error) {
        console.error('Vote analytics query error:', error);
        response.status(500).json(error);
    }
}

const getRecentActivity = (request, response) => {
    const query = `
        SELECT 
            s.search_id,
            s.search_timestamp,
            s.search_location,
            s.search_client_name,
            s.search_term_initial,
            s.search_term_translation,
            s.search_term_initial_language_code,
            s.search_engine_initial,
            s.search_ip_address,
            COUNT(hv.vote_id) as vote_count
        FROM searches s
        LEFT JOIN have_votes hv ON s.search_id = hv.search_id
        WHERE s.search_location != 'automated_scraper' 
        AND s.search_location != 'nyc3'
        AND s.search_term_initial IS NOT NULL
        AND s.search_term_initial != ''
        GROUP BY s.search_id, s.search_timestamp, s.search_location, 
                 s.search_client_name, s.search_term_initial, s.search_term_translation,
                 s.search_term_initial_language_code, s.search_engine_initial, s.search_ip_address
        ORDER BY s.search_timestamp DESC 
        LIMIT 20
    `;
    
    pool.query(query, (error, results) => {
        if (error) {
            console.error('Recent activity query error:', error);
            response.status(500).json(error);
        } else {
            console.log('Recent activity results:', results.rows.length, 'searches');
            response.status(200).json(results.rows);
        }
    });
}

const getIPDistribution = (request, response) => {
    const query = `
        SELECT 'search' as type, search_ip_address as ip_address, search_timestamp as timestamp
        FROM searches 
        WHERE search_ip_address IS NOT NULL 
        AND search_location != 'automated_scraper' 
        AND search_location != 'nyc3'
        
        UNION ALL
        
        SELECT 'vote' as type, hv.vote_ip_address as ip_address, hv.vote_timestamp as timestamp
        FROM have_votes hv
        JOIN searches s ON hv.search_id = s.search_id
        WHERE hv.vote_ip_address IS NOT NULL
        AND s.search_location != 'automated_scraper' 
        AND s.search_location != 'nyc3'
        
        ORDER BY timestamp DESC
        LIMIT 1000
    `;
    
    pool.query(query, (error, results) => {
        if (error) {
            console.error('IP distribution query error:', error);
            response.status(500).json(error);
        } else {
            console.log('IP distribution results:', results.rows.length, 'records');
            response.status(200).json(results.rows);
        }
    });
}

/*****************************/
/*searches w/o Images & Votes*/
/*****************************/

//GET: All search results without images/Votes
const getAllSearches = (request, response) => {
    const page = parseInt(request.query.page) || 1;
    const page_size = parseInt(request.query.page_size) || 100;
    const offset = (page-1)*page_size;

    const countQuery = `SELECT COUNT(*) FROM searches`;
    const dataQuery = `SELECT s.* FROM searches s ORDER BY s.search_timestamp DESC  LIMIT $1 OFFSET $2`;
    const values = [page_size, offset];

    // First get total count
    pool.query(countQuery, [], (error, countResult) => {
        if (error) {
            response.status(500).json(error);
            return;
        }
        
        // Then get paginated data
        pool.query(dataQuery, values, (error, results) => {
            if (error) {
                response.status(500).json(error);
            } else {
                response.status(200).json({
                    total: parseInt(countResult.rows[0].count),
                    page,
                    page_size,
                    data: results.rows
                });
            }
        })
    })
}

//GET: Individual search result without images/Votes matching a given location
const getSearchByID = (request, response) => {
	const search_id = parseInt(request.params.search_id)
	pool.query(`SELECT *
							FROM searches s
							WHERE s.search_id = ${search_id}`, (error, results) => {
        if (error) {
            response.status(500).json(error);
        } else {
            response.status(200).json(results.rows);
        }
	})
}

// Create a timestamp by year formatted for psql
const createTimestamp = (year) => new Date(year, 0, 1)
    .toISOString()
    .replace('T', ' ')
    .replace('Z', '')
    .replace(/\.[0-9]+/, '-00');

/*
 * Queries for images associated with an array of objects of search data
 * and adds the image data to each search object. This categorizes searches
 * into images from Google or Baidu
 * @param: searchData - an array of objects with search data
 * @returns - an array of objects with search data and associated images
 */
const appendImageIds = async (searchData) => {
    if (!searchData.length) return [];

    let query = `SELECT i.search_id, i.image_href, i.image_href_original, i.image_search_engine FROM images i WHERE `;
    const conditions = [];

    searchData.map(s => conditions.push(`i.search_id = ${s.search_id}`));

    query += conditions.join(' OR ');

    const results = await pool.query(query, []);
    const imageData = results.rows;

    searchData.map(s => {
        s.galleries = [{src: []}, {src: []}];
        const filteredImages = imageData.filter(i => i.search_id === s.search_id);
        filteredImages.forEach(i => {
            if (i.image_search_engine.toLowerCase() === 'google')
                s.galleries[0]['src'].push(i.image_href || i.image_href_original)
            else
                s.galleries[1]['src'].push(i.image_href || i.image_href_original)
        })
    })
    return searchData;
}

// Builds a filtered search query
const getFilterConditions = (keyword, vote_ids, search_locations, us_states_filter, countries_filter, years, start_date, end_date) => {
    console.log("getFilterConditions: ", keyword, vote_ids, search_locations, us_states_filter, countries_filter, years, start_date, end_date);
    const conditions = [];

    // Keyword searches
    if (keyword) {
        console.log("filterCondition: keyword: ", keyword);
        conditions.push(`to_tsvector(s.search_term_initial) @@ plainto_tsquery('${keyword}')`);
    }

    // Filter by vote ids
    if (vote_ids.length) {
        console.log("filterCondition: vote_ids: ", vote_ids);
        if (vote_ids.length > 1) {
            const condition = vote_ids
                .map(id => ` hv.vote_id = ${id}`)
                .join(' OR ');
            conditions.push(`(${condition})`);
        } else {
            conditions.push(` hv.vote_id = ${parseInt(vote_ids[0])}`);
        }
    }

    // Filter locations that weren't tagged in the postgres db
    const syntheticLocations = ['miami_beach', 'taiwan', 'new_jersey'];
    const filteredLocations = search_locations.filter(location => !syntheticLocations.includes(location));

    // Approximate missing locations by using timestamps
    const getApproximatedLocations = (location) => {
        console.log("getApproximatedLocations: ", search_locations, location);
        return `to_timestamp(s.search_timestamp/1000) BETWEEN '${location.time1}' AND '${location.time2}'`;
    }

    // Filter by location (using search_location column)
    if (filteredLocations.length) {
        console.log("filterCondition: filteredLocations: ", filteredLocations);
        // Get multiple locations
        if (search_locations.length > 1) {
            let condition = filteredLocations
                .map(name => `s.search_location = '${name}'`);

            search_locations.forEach(location => {
                if (locationByTimeRange[location]) {
                    condition.push(getApproximatedLocations(locationByTimeRange[location]));
                }
            });

            condition = condition.join(' OR ');
            conditions.push(` (${condition})`);
        } else {
            // Get single location
            console.log("filterCondition: single location", filteredLocations);
            conditions.push(` s.search_location = '${filteredLocations[0]}'`);
        }
    } else if (!filteredLocations.length && search_locations.length) {
        // Get locations that are not in the postgres
        search_locations.forEach(location => {
            if (locationByTimeRange[location]) {
                conditions.push(getApproximatedLocations(locationByTimeRange[location]));
            }
        });
    }
    
    // Filter by US states (using search_region field)
    if (us_states_filter && us_states_filter.length) {
        console.log("filterCondition: us_states_filter: ", us_states_filter);
        if (us_states_filter.length > 1) {
            const condition = us_states_filter
                .map(state => `s.search_region = '${state}'`)
                .join(' OR ');
            conditions.push(`(${condition})`);
        } else {
            conditions.push(`s.search_region = '${us_states_filter[0]}'`);
        }
    }
    
    // Filter by countries (using search_country field)
    if (countries_filter && countries_filter.length) {
        console.log("filterCondition: countries_filter: ", countries_filter);
        if (countries_filter.length > 1) {
            const condition = countries_filter
                .map(country => {
                    return `s.search_country_code = '${country}'`;
                })
                .join(' OR ');
            conditions.push(`(${condition})`);
        } else {
            conditions.push(`s.search_country_code = '${countries_filter[0]}'`);
        }
    }
    
    // Create condition to filter for searches by year
    const buildYearCondition = (year) => {
        const parsedYear = parseInt(year);
        return `(to_timestamp(s.search_timestamp/1000) BETWEEN '${createTimestamp(parsedYear)}' AND '${createTimestamp(parsedYear+1)}')`;
    };

    // Filter by year by querying searches that were made between
    // Jan 1 <year> and Jan 1 <year+1>
    if (years.length) {
        console.log("filterCondition: years: ", years);
        if (years.length > 1) {
            const condition = years
                .map(year => buildYearCondition(year))
                .join(' OR ');
            conditions.push(` (${condition})`);
        } else {
            conditions.push(` ${buildYearCondition(years[0])}`);
        }
    }
    
    // Filter by date range
    if (start_date) {
        console.log("filterCondition: start_date: ", start_date);
        // Convert date to timestamp and filter searches after start_date
        conditions.push(`to_timestamp(s.search_timestamp/1000) >= '${start_date} 00:00:00'::timestamp`);
    }
    
    if (end_date) {
        console.log("filterCondition: end_date: ", end_date);
        // Convert date to timestamp and filter searches before end_date (end of day)
        conditions.push(`to_timestamp(s.search_timestamp/1000) <= '${end_date} 23:59:59'::timestamp`);
    }

    return conditions.join(' AND ');
};

/*
 * Called from Search Archive page. It filters
 * searches based on keyword OR location, vote, and year.
 * It then collects images associated with each search.
 */
const getFilteredSearches = async (request, response) => {
    console.log("getFilteredSearches: ", request.query);
    let { keyword, vote_ids, search_locations, cities, us_states, countries, years, start_date, end_date } = request.query;
    const extractData = (data) => JSON.parse(data ? data : '[]')
    vote_ids = extractData(vote_ids);
    if (getType(request.query.search_locations) === 'string') {
        search_locations = [search_locations];
    } else if (getType(request.query.search_locations) === 'array') {
        search_locations = request.query.search_locations;
    } else {
        console.log("search_locations is not a string or array");
        search_locations = [];
    }
    
    // Handle cities parameter (legacy support)
    if (cities && !search_locations.length) {
        if (getType(cities) === 'string') {
            search_locations = [cities];
        } else if (getType(cities) === 'array') {
            search_locations = cities;
        }
    }
    
    // Handle us_states parameter for geographic filtering
    let us_states_filter = [];
    if (us_states) {
        if (getType(us_states) === 'string') {
            us_states_filter = [us_states];
        } else if (getType(us_states) === 'array') {
            us_states_filter = us_states;
        }
    }
    
    // Handle countries parameter for geographic filtering
    let countries_filter = [];
    if (countries) {
        if (getType(countries) === 'string') {
            countries_filter = [countries];
        } else if (getType(countries) === 'array') {
            countries_filter = countries;
        }
    }
    
    years = request.query.years ? [extractData(years)] : [];
    const page = parseInt(request.query.page) || 1;
    const page_size = parseInt(request.query.page_size) || 100;
    const offset = (page-1)*page_size;
    let baseQuery = `SELECT s.search_id, s.search_timestamp, search_location, search_country, search_country_code, search_region, search_city, 
        search_latitude, search_longitude, search_ip_address, search_client_name, search_engine_initial, search_term_initial, 
        search_term_initial_language_code, search_term_translation, search_engine_translation, COUNT(hv.vote_id) as "total_votes" 
        FROM searches s LEFT JOIN have_votes hv on s.search_id = hv.search_id
        WHERE s.search_location != 'nyc3' AND s.search_location != 'automated_scraper'`;
    
    let countQuery = `SELECT COUNT(*) FROM searches s WHERE s.search_location != 'nyc3' AND s.search_location != 'automated_scraper'`;

    // Check if any filters are applied
    const hasFilters = (vote_ids.length > 0) || (search_locations.length > 0) || (us_states_filter.length > 0) || 
                      (countries_filter.length > 0) || (years.length > 0) || keyword || start_date || end_date;
    
    // Get all searches (no filters)
    if (!hasFilters) {
        console.log("getFilteredSearches: no filters applied");
    } else { // Get filtered searches
        console.log("getFilteredSearches: FILTERING", keyword, vote_ids, search_locations, us_states_filter, countries_filter, years, start_date, end_date);
        // Filter test searches
        // baseQuery += ` s.search_client_name != 'rowan_scraper_tests' AND `;
        const conditionClause = ` AND ` + getFilterConditions(keyword, vote_ids, search_locations, us_states_filter, countries_filter, years, start_date, end_date);
        countQuery += conditionClause;
        baseQuery += conditionClause;
    }

    // Get total count first
    pool.query(countQuery, [], async (error, countResult) => {
        if (error) {
            response.status(500).json(error);
            return;
        }

        // Then get paginated data
        const dataQuery = baseQuery + ` GROUP BY s.search_id ORDER BY s.search_id DESC LIMIT $1 OFFSET $2`;
        pool.query(dataQuery, [page_size, offset], async (error, results) => {
            console.log("dataQuery: ", dataQuery);
            console.log("values: ", [page_size, offset]);
            if (error) {
                response.status(500).json(error);
            } else {
                // Get each search's associated images
                // const dataWithImages = await appendImageIds(results.rows);
                response.status(200).json({
                    total: countResult.rows[0].count,
                    page,
                    page_size,
                    data: results.rows
                });
            }
        });
    });
}

/********/
/*Images*/
/********/

//GET: Image Info w/ search for individual search result (BY search_id)
const getImagesAndSearchBySearchID = (request, response) => {
    const search_id = parseInt(request.params.search_id);
    const page = parseInt(request.query.page) || 1;
    const page_size = parseInt(request.query.page_size) || 100;
    const offset = (page-1)*page_size;
    const query = `SELECT s.*, i.image_id, i.image_search_engine, i.image_href, i.image_href_original, i.image_rank, i.image_mime_type
        FROM searches s FULL JOIN images i ON s.search_id = i.search_id
        WHERE s.search_id = $1 ORDER BY i.image_id DESC LIMIT $2 OFFSET $3`;
    const values = [search_id, page_size, offset];

    pool.query(query, values, (error, results) => {
        if (error) {
            response.status(500).json(error);
        } else {
            response.status(200).json(results.rows);
        }
    })
}

//GET: return all image info EXCEPT raw image data
const getImagesWithSearch = (request, response) => {
    const page = parseInt(request.query.page) || 1;
    const page_size = parseInt(request.query.page_size) || 100;
    const offset = (page-1)*page_size;
    const query = `SELECT s.*, i.image_id, i.image_search_engine, i.image_href, i.image_href_original, i.image_rank, i.image_mime_type
        FROM searches s FULL JOIN images i ON s.search_id = i.search_id
        ORDER BY s.search_id DESC LIMIT $1 OFFSET $2`;
    const values = [page_size, offset];

    pool.query(query, values, (error, results) => {
        if (error) {
            response.status(500).json(error);
        } else {
            response.status(200).json(results.rows);
        }
    })
}

const getImage = (request, response) => {
    const image_id = parseInt(request.params.image_id);
    const query = `SELECT image_id, search_id, image_search_engine,
        image_href, image_href_original, image_rank, image_mime_type, wordpress_attachment_post_id,
        wordpress_attachment_file_path
        FROM images WHERE image_id = $1`;
    const values = [image_id];

    pool.query(query, values, (error, results) => {
        if (error) {
            response.status(500).json({error, image_id});
        } else {
            response.status(200).json(results.rows);
        }
    })
}

const getImageBinary = (request, response) => {
    const image_id = parseInt(request.params.image_id);
    const query = `SELECT * FROM images WHERE image_id = $1`;
    const values = [image_id];

    pool.query(query, values, (error, results) => {
        if (error) {
            response.status(500).json({error, image_id});
        } else {
            response.status(200).json(results.rows);
        }
    })
}

/*******/
/*Votes*/
/*******/

//GET: All Votes with Search Info (Only contains searches with votes b/c Inner Join)
const getAllVotes = (request, response) => {
    const page = parseInt(request.query.page) || 1;
    const page_size = parseInt(request.query.page_size) || 100;
    const offset = (page-1)*page_size;
    const query = `SELECT v.vote_name, s.*, hv.* FROM searches s INNER JOIN have_votes hv 
        ON s.search_id = hv.search_id INNER JOIN votes v ON hv.vote_id = v.vote_id
        ORDER BY s.search_id DESC LIMIT $1 OFFSET $2;`;
    const values = [page_size, offset];
	pool.query(query, values, (error, results) => {
        if (error) {
            response.status(500).json(error);
        } else {
            response.status(200).json(results.rows);
        }
    })
}

//GET: Individual votes for a given search (BY Search_ID)
const getVoteBySearchID = (request, response) => {
    const search_id = parseInt(request.params.search_id);
    const query = `SELECT v.vote_name, hv.*, s.*
        FROM searches s INNER JOIN have_votes hv ON s.search_id = hv.search_id
        INNER JOIN votes v ON hv.vote_id = v.vote_id WHERE s.search_id = $1`;
    const values = [search_id];

	pool.query(query, values, (error, results) => {
        if (error) {
            response.status(500).json(error);
        } else {
            response.status(200).json(results.rows);
        }
	})
}

//GET: Individual votes for a given vote category (BY Vote_ID)
const getVoteByVoteID = (request, response) => {
    const vote_id = parseInt(request.params.vote_id);
    const query = `SELECT  v.vote_name, hv.*, s.*
        FROM searches s INNER JOIN have_votes hv ON s.search_id = hv.search_id
        INNER JOIN votes v ON hv.vote_id = v.vote_id WHERE hv.vote_id = $1`;
    const values = [vote_id];

	pool.query(query, values,  (error, results) => {
        if (error) {
            response.status(500).json(error);
        } else {
            response.status(200).json(results.rows);
        }
	})
}

// GET: Searches by vote category
const getSearchesByCategory = (request, response, category, title) => {
    const query = `SELECT s.*, COUNT(*) as "votes"
        FROM searches s INNER JOIN have_votes hv on s.search_id = hv.search_id
        WHERE hv.vote_id = $1 GROUP BY s.search_id;`
    const values = [category];
    pool.query(query, values, (error, results) => {
        if (error) {
            response.status(500).json(error);
        } else {
            response.status(200).json(results.rows);
        }
    })
}

//GET: Returns all Censored searches.
const getCensoredSearches = (request, response) => {
    getSearchesByCategory(request, response, 1, "censored");
}

//GET: Returns all Uncensored searches.
const getUncensoredSearches = (request, response) => {
	getSearchesByCategory(request, response, 2, "uncensored");
}

//GET: Returns all Bad Translation searches.
const getBadTranslationSearches = (request, response) => {
	getSearchesByCategory(request, response, 3, "bad_translation");
}

//GET: Returns all Good Translation searches.
const getGoodTranslationSearches = (request, response) => {
	getSearchesByCategory(request, response, 4, "good_translation");
}

//GET: Returns all Lost In Translation searches.
const getLostInTranslationSearches = (request, response) => {
	getSearchesByCategory(request, response, 5, "lost_in_translation");
}

//GET: Returns all NSFW searches.
const getNSFWSearches = (request, response) => {
	getSearchesByCategory(request, response, 6, "nsfw");
}

//GET: Returns all WTF searches.
const getWTFSearches = (request, response) => {
	getSearchesByCategory(request, response, 7, "wtf");
}

/****************************/
/*searches With Vote Counts */
/****************************/

//GET: Consolidated Counts for each type of vote_id (for ALL SEARCHES)
const getAllSearchesWithVoteCounts = (request, response) => {
	pool.query(`SELECT s.*,
								COUNT(hv.*) total,
								COUNT(case when vote_id = '1' then 1 end) AS Censored,
								COUNT(case when vote_id = '2' then 1 end) AS Uncensored,
								COUNT(case when vote_id = '3' then 1 end) AS BadTranslation,
								COUNT(case when vote_id = '4' then 1 end) AS GoodTranslation,
								COUNT(case when vote_id = '5' then 1 end) AS LostInTranslation,
								COUNT(case when vote_id = '6' then 1 end) AS NSFW,
								COUNT(case when vote_id = '7' then 1 end) AS WTF
						 FROM searches s FULL OUTER JOIN have_votes hv ON s.search_id = hv.search_id
						 GROUP BY s.search_id`, (error, results) => {
        if (error) {
            response.status(500).json(error);
        } else {
            response.status(200).json(results.rows);
        }
	})
}

//GET: Consolidated Counts for each type of vote_id (for Individual Search BY search_id)
const getSearchWithVoteCountsBySearchId = (request, response) => {
	const search_id = parseInt(request.params.search_id)
	pool.query(`SELECT s.*,
								COUNT(hv.*) total,
								COUNT(case when vote_id = '1' then 1 end) AS Censored,
								COUNT(case when vote_id = '2' then 1 end) AS Uncensored,
								COUNT(case when vote_id = '3' then 1 end) AS BadTranslation,
								COUNT(case when vote_id = '4' then 1 end) AS GoodTranslation,
								COUNT(case when vote_id = '5' then 1 end) AS LostInTranslation,
								COUNT(case when vote_id = '6' then 1 end) AS NSFW,
								COUNT(case when vote_id = '7' then 1 end) AS WTF
						 FROM searches s FULL OUTER JOIN have_votes hv ON s.search_id = hv.search_id
						 WHERE s.search_id = ${search_id}
						 GROUP BY s.search_id`, (error, results) => {
        if (error) {
            response.status(500).json(error);
        } else {
            response.status(200).json(results.rows);
        }
	})
}

/***********************************************/
/* All Available Information, With Vote Counts */
/***********************************************/

//GET: All Search Results With Vote Counts & Image Info
const getSearchesWithVoteCountsAndImageInfo = (request, response) => {
    const page = parseInt(request.query.page) || 1;
    const page_size = parseInt(request.query.page_size) || 100;
    const offset = (page-1)*page_size;
    const query = `SELECT s.*, i.image_id, i.image_href, i.image_href_original, i.image_search_engine, i.image_rank,
        COUNT(hv.*) total,
        COUNT(case when vote_id = '1' then 1 end) AS Censored,
        COUNT(case when vote_id = '2' then 1 end) AS Uncensored,
        COUNT(case when vote_id = '3' then 1 end) AS BadTranslation,
        COUNT(case when vote_id = '4' then 1 end) AS GoodTranslation,
        COUNT(case when vote_id = '5' then 1 end) AS LostInTranslation,
        COUNT(case when vote_id = '6' then 1 end) AS NSFW,
        COUNT(case when vote_id = '7' then 1 end) AS WTF
        FROM searches s FULL OUTER JOIN have_votes hv ON s.search_id = hv.search_id
        FULL OUTER JOIN images i on s.search_id = i.search_id
        GROUP BY s.search_id, i.image_id, i.image_href, i.image_search_engine, i.image_rank
        ORDER BY s.search_id DESC LIMIT $1 OFFSET $2`;
        // if pagination is broken, can limit it to the first 10k results
    const values = [page_size, offset];
	pool.query(query, values, (error, results) => {
        if (error) {
            response.status(500).json(error);
        } else {
            response.status(200).json(results.rows);
        }
	})
}

//GET: All Search Results With Vote Counts & Image Info
const getSearchesWithVoteCountsAndImageInfoBySearchID = (request, response) => {
	const search_id = parseInt(request.params.search_id)
	pool.query(`SELECT s.*, i.image_id, i.image_href, i.image_href_original, i.image_search_engine, i.image_rank,
							COUNT(hv.*) total,
							COUNT(case when vote_id = '1' then 1 end) AS Censored,
							COUNT(case when vote_id = '2' then 1 end) AS Uncensored,
							COUNT(case when vote_id = '3' then 1 end) AS BadTranslation,
							COUNT(case when vote_id = '4' then 1 end) AS GoodTranslation,
							COUNT(case when vote_id = '5' then 1 end) AS LostInTranslation,
							COUNT(case when vote_id = '6' then 1 end) AS NSFW,
							COUNT(case when vote_id = '7' then 1 end) AS WTF
							FROM searches s FULL OUTER JOIN have_votes hv ON s.search_id = hv.search_id
							FULL OUTER JOIN images i on s.search_id = i.search_id
							WHERE s.search_id = ${search_id}
							GROUP BY s.search_id, i.image_id, i.image_href, i.image_search_engine, i.image_rank;`, (error, results) => {
        if (error) {
            response.status(500).json(error);
        } else {
            response.status(200).json(results.rows);
        }
	})
}

/*********************************/
/*    Searches by term           */
/*********************************/

const getSearchesByTerm = (request, response) => {
    const term = request.query.term;
    if(!term) {
        response.status(401).json("term not defined")
        return
    }
    console.log("getSearchesByTerm: ", request.query.term);
    const page = parseInt(request.query.page) || 1;
    const page_size = parseInt(request.query.page_size) || 100;
    const offset = (page-1)*page_size;
    const query = `SELECT s.* FROM searches s WHERE s.search_term_initial = $1 ORDER BY s.search_id DESC LIMIT $2 OFFSET $3`;
    const values = [term, page_size, offset];
    pool.query(query, values, (error, results) => {
        if (error) {
            response.status(500).json(error);
        } else {
            response.status(200).json(results.rows);
        }
    })
}

const getSearchesByTermWithImages = (request, response) => {
    console.log("getSearchesByTermWithImages: ", request.query.term);
    const term = request.query.term;
    if(!term) {
        response.status(401).json("term not defined")
        return
    }
    const page = parseInt(request.query.page) || 1;
    const page_size = parseInt(request.query.page_size) || 100;
    const offset = (page-1)*page_size;
    
    console.log("getSearchesByTermWithImages: ", term);
    
    // Detect if the search term contains CJK characters
    const hasCJK = /[\u4e00-\u9fff\u3040-\u309f\u30a0-\u30ff\uac00-\ud7af]/.test(term);
    
    // Build WHERE clause based on language detection
    // Search only in search_term_initial and filter by the appropriate language code
    let whereClause;
    if (hasCJK) {
        // CJK input: search for Chinese/Japanese/Korean original searches
        console.log(`Searching for CJK original searches: ${term}`);
        whereClause = `(
            s.search_term_initial LIKE '%' || $1 || '%'
            AND s.search_term_initial_language_code IN ('zh', 'ja', 'ko')
        )`;
    } else {
        // English input: search for English original searches
        console.log(`Searching for English original searches: ${term}`);
        whereClause = `(
            (to_tsvector('english', COALESCE(s.search_term_initial, '')) @@ plainto_tsquery('english', $1)
             OR s.search_term_initial ILIKE '%' || $1 || '%')
            AND s.search_term_initial_language_code = 'en'
        )`;
    }
    
    // Common filter for excluding automated data
    const excludeFilter = `AND s.search_location != 'nyc3' AND s.search_location != 'automated_scraper'`;
    
    // Build queries using common components
    const countQuery = `
        SELECT COUNT(DISTINCT s.search_id)
        FROM searches s
        LEFT JOIN have_votes hv on s.search_id = hv.search_id
        WHERE ${whereClause}
        ${excludeFilter}`;
    
    const dataQuery = `
        SELECT s.search_id, s.search_timestamp, search_location, search_ip_address, 
            search_client_name, search_engine_initial, search_term_initial, search_term_initial_language_code,
            search_term_translation, search_engine_translation, COUNT(hv.vote_id) as "total_votes"
        FROM searches s
        LEFT JOIN have_votes hv on s.search_id = hv.search_id
        WHERE ${whereClause}
        ${excludeFilter}
        GROUP BY s.search_id
        ORDER BY s.search_id DESC
        LIMIT $2 OFFSET $3`;

    // First get the total count
    pool.query(countQuery, [term], (error, countResult) => {
        if (error) {
            console.error('Count query error:', error);
            response.status(500).json({error, results: null});
            return;
        }

        // Then get the paginated data
        pool.query(dataQuery, [term, page_size, offset], (error, results) => {
            if (error) {
                console.error('Data query error:', error);
                response.status(500).json({error, results: null});
            } else {
                const data = {
                    total: parseInt(countResult.rows[0].count),
                    page,
                    page_size,
                    data: results.rows
                }
                response.status(200).json(data);
            }
        });
    });
}

const getImagesByTermWithSearchInfo = (request, response) => {
    console.log("getImagesByTermWithSearchInfo: ", request.query.term);
    const term = request.query.term;
    if(!term) {
        response.status(401).json("term not defined")
        return
    }
    
    // Detect if the search term contains CJK characters
    const hasCJK = /[\u4e00-\u9fff\u3040-\u309f\u30a0-\u30ff\uac00-\ud7af]/.test(term);
    
    let query;
    
    if (hasCJK) {
        // For CJK text, use LIKE pattern matching
        console.log(`Using LIKE pattern matching for CJK term in images query: ${term}`);
        query = `SELECT s.search_id, s.search_timestamp, s.search_client_name, 
            s.search_engine_initial, s.search_engine_translation, s.search_term_initial, 
            s.search_term_translation, i.image_search_engine, i.image_rank, i.image_href,
            i.image_href_original, i.image_id
            FROM searches s
            FULL OUTER JOIN images i
            ON s.search_id = i.search_id
            WHERE s.search_term_translation LIKE '%' || $1 || '%'
               OR s.search_term_initial LIKE '%' || $1 || '%';`
    } else {
        // For English text, use hybrid approach
        console.log(`Using hybrid search for English term in images query: ${term}`);
        query = `SELECT s.search_id, s.search_timestamp, s.search_client_name, 
            s.search_engine_initial, s.search_engine_translation, s.search_term_initial, 
            s.search_term_translation, i.image_search_engine, i.image_rank, i.image_href,
            i.image_href_original, i.image_id
            FROM searches s
            FULL OUTER JOIN images i
            ON s.search_id = i.search_id
            WHERE to_tsvector('english', COALESCE(s.search_term_initial, '')) @@ plainto_tsquery('english', $1)
               OR to_tsvector('english', COALESCE(s.search_term_translation, '')) @@ plainto_tsquery('english', $1)
               OR s.search_term_initial ILIKE '%' || $1 || '%'
               OR s.search_term_translation ILIKE '%' || $1 || '%';`
    }
    
    const values = [term];
    pool.query(query, values, (error, results) => {
        if (error) {
            console.error('Images query error:', error);
            response.status(500).json({error, results});
        } else {
            response.status(200).json(results.rows);
        }
    })
}

const getAllTerms = (request, response) => {
    const query = `SELECT DISTINCT search_term_initial, search_term_translation, search_timestamp 
        FROM searches;`;
    pool.query(query, (error, results) => {
        if (error) {
            response.status(500).json(error);
        } else {
            response.status(200).json(results.rows);
        }
    })
}

/*********************************/
/*Image Info Only & Image Subsets*/
/*********************************/

//GET: Image Info Only all search results
const getImages = (request, response) => {
    const page = parseInt(request.query.page) || 1;
    const page_size = parseInt(request.query.page_size) || 100;
    const offset = (page-1)*page_size;
    
    // Get total count first
    const countQuery = `SELECT COUNT(*) FROM images`;
    pool.query(countQuery, [], (error, countResult) => {
        if (error) {
            response.status(500).json(error);
            return;
        }

        // Then get paginated data
        const dataQuery = `SELECT i.image_id, i.image_search_engine, i.image_href, i.image_href_original, i.image_rank, i.image_mime_type, 
            i.wordpress_attachment_post_id, i.wordpress_attachment_file_path FROM images i
            ORDER BY i.image_id DESC LIMIT $1 OFFSET $2`;
        const values = [page_size, offset];
        
        pool.query(dataQuery, values, (error, results) => {
            if (error) {
                response.status(500).json(error);
            } else {
                response.status(200).json({
                    total: parseInt(countResult.rows[0].count),
                    page,
                    page_size,
                    data: results.rows
                });
            }
        })
    });
}

//GET: Image Info Only individual search result (BY search_id)
const getImagesOnlyBySearchID = (request, response) => {
    console.log("getImagesOnlyBySearchID: ", request.params.search_id);
    const search_id = parseInt(request.params.search_id);
    const query = `SELECT i.image_id, i.image_search_engine, i.image_href, i.image_href_original, i.image_rank, i.image_mime_type
    FROM searches s FULL JOIN images i ON s.search_id = i.search_id
    WHERE s.search_id = $1 and (i.image_href <> '' or i.image_href <> NULL)`;
    const values = [search_id];
	pool.query(query, values, (error, results) => {
        if (error) {
            response.status(500).json(error);
        } else {
            response.status(200).json(results.rows);
        }
	})
}

const getImagesVoteCategory = (request, response, category) => {
    const page = parseInt(request.query.page) || 1;
    const page_size = parseInt(request.query.page_size) || 100;
    const offset = (page-1)*page_size;
    const query = `SELECT i.image_id, i.image_search_engine, i.image_href, i.image_href_original, i.image_rank, i.image_mime_type, 
        i.wordpress_attachment_post_id, i.wordpress_attachment_file_path
        FROM images i FULL JOIN searches S ON s.search_id = i.search_id
        INNER JOIN have_votes hv ON s.search_id = hv.search_id
        WHERE hv.vote_id = $1 ORDER BY s.search_id DESC LIMIT $2 OFFSET $3`;
    const values = [category, page_size, offset];
    pool.query(query, values, (error, results) => {
        if (error) {
            response.status(500).json(error);
        } else {
            response.status(200).json(results.rows);
        }
    })
}

//GET: Image Info Only for Censored searches
const getImagesOnlyCensored = (request, response) => {
	getImagesVoteCategory(request, response, 1);
}

//GET: Image Info Only for Censored searches
const getImagesOnlyUnsensored = (request, response) => {
    getImagesVoteCategory(request, response, 2);
}

//GET: Image Info Only for Censored searches
const getImagesOnlyBadTranslation = (request, response) => {
	getImagesVoteCategory(request, response, 3);
}

//GET: Image Info Only for Censored searches
const getImagesOnlyGoodTranslation = (request, response) => {
    getImagesVoteCategory(request, response, 4);
}
//GET: Image Info Only for Censored searches
const getImagesOnlyLostInTranslation = (request, response) => {
    getImagesVoteCategory(request, response, 5);
}

//GET: Image Info Only for Censored searches
const getImagesOnlyNSFW = (request, response) => {
    getImagesVoteCategory(request, response, 6);
}

//GET: Image Info Only for Censored searches
const getImagesOnlyWTF = (request, response) => {
    getImagesVoteCategory(request, response, 7);
}

/******************/
/*POST Statements*/
/****************/

const checkSecret = (request, response, next) => {
    if(request.body.secret !== secret) {
        console.log("wrong secret")
        response.status(401).json("wrong secret")
    } else {
        next()
    }
}

//POST: createSearch -- Add searches
const createSearch = (request, response) => {
    const {
        search_timestamp,
        search_location,
        search_ip_address,
        search_client_name,
        search_engine_initial,
        search_engine_translation,
        search_term_initial,
        search_term_initial_language_code,
        search_term_initial_language_confidence,
        search_term_initial_language_alternate_code,
        search_term_translation,
        search_term_translation_language_code,
        search_term_status_banned,
        search_term_status_sensitive,
    } = request.body

    const query = `INSERT INTO searches (
        search_id,
        search_timestamp,
        search_location,
        search_ip_address,
        search_client_name,
        search_engine_initial,
        search_engine_translation,
        search_term_initial,
        search_term_initial_language_code,
        search_term_initial_language_confidence,
        search_term_initial_language_alternate_code,
        search_term_translation,
        search_term_translation_language_code,
        search_term_status_banned,
        search_term_status_sensitive
    ) VALUES (
        DEFAULT, $1,  $2,  $3,  $4,  $5,  $6,  $7,  $8,  $9,  $10,  $11,  $12,  $13,  $14
    ) RETURNING search_id`;

    const values = [
        search_timestamp,
        search_location,
        search_ip_address,
        search_client_name,
        search_engine_initial,
        search_engine_translation,
        search_term_initial,
        search_term_initial_language_code,
        search_term_initial_language_confidence,
        search_term_initial_language_alternate_code,
        search_term_translation,
        search_term_translation_language_code,
        search_term_status_banned,
        search_term_status_sensitive
    ];

	pool.query(query, values, (error, results) => {
        if (error) {
            response.status(500).json(error);
        } else {
            response.status(201).json(results.rows);
        }
	})
}

const deleteSearch = async (request, response) => {
    const {search_id} = request.body;
    const query = `DELETE FROM searches WHERE search_id = $1;`
    const values = [search_id];
    pool.query(query, values, (error, results) => {
        if (error) {
            response.status(500).json(error);
        } else {
            response.status(201).json(results.rows);
        }
	})
}

//POST: createVote -- Add searches
const createVote = (request, response) => {
    const { vote_id, search_id, vote_timestamp, vote_client_name, vote_ip_address} = request.body
    console.log("createVote:", vote_id, search_id, vote_timestamp, vote_client_name, vote_ip_address)

    const query = 'INSERT INTO have_votes (vote_id, search_id, vote_timestamp, vote_client_name, vote_ip_address) VALUES ($1, $2, $3, $4, $5)';
    const values = [ vote_id, search_id, vote_timestamp, vote_client_name, vote_ip_address];

	pool.query(query, values, (error, insertResults) => {
        if (error) {
            response.status(500).json(error);
        } else {
            console.log("createVote insertResults:", insertResults.rows);
        }
        
        const countQuery = `SELECT hv.vote_id, v.vote_name, COUNT(hv.vote_id) as vote_count FROM votes v
                                LEFT JOIN have_votes hv ON v.vote_id = hv.vote_id AND hv.search_id = $1
                                WHERE v.vote_id = $2
                            GROUP BY hv.vote_id, v.vote_name
                            ORDER BY v.vote_name`;
        pool.query(countQuery, [search_id, vote_id], async (error, countResults) => {
            if (error) {
                console.log("createVote countQuery error:", error);
                response.status(500).json(error);
            } else {
                console.log("createVote countResults:", countResults.rows[0]);
                response.status(201).json(countResults.rows[0]);
                return countResults.rows[0];
            }
        });
    })
}

const updateImageUrl = (request, response) => {
    const {url, image_id} = request.body;
    if(!url) {
        response.status(401).json("new image URL must be defined and non-empty");
        return;
    }
    const query = `UPDATE images SET image_href=$1 WHERE image_id=$2;`;
    const values = [url, image_id];
    console.log("values:", values);
	pool.query(query, values, (error, results) => {
        if (error) {
            response.status(500).json(error);
        } else {
            response.status(201).json({url, query_result: results.rows});
        }
	})
}

//POST: saveImage -- Add searches
// there are two types of saveImage calls: with and without a file. If with a file, it is uploaded
const saveImage = async (request, response) => {
    const {search_id, image_search_engine, image_href, image_href_original, image_rank, image_mime_type, image_data} = request.body
    if(!search_id || !image_search_engine || !image_rank || !image_href) {
        response.status(400).json("Need a search_id, image_rank, image_href, and image_search_engine. If uploading a file, the source URL is still needed for its name")        
        return;
    }
    let new_url = null;
    if(request.files) {
        response.status(501).json("Uploading files via the API not supported because image hashing in the JS ecosystem isn't as robust as in Python. \
        Upload the file separately using a Python script (see Great Firewall Codebase Space interface for an implementation)")
        return;

        let file_content;
        try {
            file_content = Buffer.from(request.files.image.data, 'binary');
        } catch {
            response.status(400).json("Need a form-data HTTP request with image with key 'image'")        
            return;
        }
        try {
            new_url = await space.saveImage(file_content, image_href);
            console.log(typeof new_url, new_url)
        } catch (err){
            response.status(500).json(err);
            return;
        }
    }
    
    const query = `INSERT INTO images (image_id, search_id, image_search_engine, image_href, image_href_original, image_rank) VALUES (DEFAULT, $1, $2, $3, $4, $5)`;
    const values = [parseInt(search_id), image_search_engine, new_url ? new_url : image_href, image_href_original? image_href_original : "", image_rank];
	pool.query(query, values, (error, results) => {
        if (error) {
            response.status(500).json(error);
        } else {
            response.status(201).json({url: new_url ? new_url : image_href, query_result: results});
        }
	})
}

const deleteImage = async (request, response) => {
    const {image_id} = request.body;
    const query = `DELETE FROM images WHERE image_id = $1;`
    const values = [image_id]
    pool.query(query, values, (error, results) => {
        if (error) {
            response.status(500).json(error);
        } else {
            response.status(201).json(results.rows);
        }
	})
}

const saveImagesEndpoint = (request, response) => {
    const {search_id, image_search_engine, urls, image_ranks } = request.body
    if(!search_id || !image_search_engine || !image_ranks || !urls || request.files) {
        response.status(400).json("Need a search_id, image_ranks, urls, and image_search_engine. No file uploads")        
        return;
    }
    if(urls.length !== image_ranks.length || urls.length == 0) {
        response.status(400).json("arrays 'urls' and 'image_ranks' must be the same length")        
        return;
    }
    const query = `INSERT INTO images (image_id, search_id, image_search_engine, image_href, image_rank) VALUES (DEFAULT, $1, $2, $3, $4)`;
    let promises = [];
    // for each given URL, call that SQL query with that value
    for(let i=0; i<urls.length; i++)
        promises.push(pool.query(query, [parseInt(search_id), image_search_engine, urls[i], image_ranks[i]]))
    // don't respond before all promises have resolved
    Promise.all(promises).then(results => response.status(201).json(results)).catch(err => response.status(500).json(err));
}

const uploadImagesToWordpress = async (data) => {
    const wpData = {
        timestamp: data.timestamp,
        location: data.location,
        client: data.client,
        secret: config.wordpress.secret,
        search_engine: data.search_engine,
        query: data.query,
        translated: data.translated,
        lang_from: `${data.lang_from}`,
        lang_to: `${data.lang_to}`,
        lang_confidence: 1,
        lang_alternate: `${data.lang_alternate}`,
        lang_name: `${data.lang_name}`,
        banned: data.banned ? data.banned : false,
        sensitive: data.sensitive ? data.sensitive : false,
    };

    console.log(`[uploadImagesToWordpress data ${JSON.stringify(wpData)}]`);

    wpData.google_images = data.google_images ? data.google_images : '{}';
    wpData.baidu_images = data.baidu_images ? data.baidu_images : '{}';
};

const saveImagesToWordpress = async (request, response) => {
    try {
        await uploadImagesToWordpress(response);
    } catch (error) {
        response.status(500).json(error);
    }

    response.sendStatus(200);
};

// Find image results in Google Image result response and return the first 10 results
const getGoogleImageSrcs = (results) => {
    const html = cheerio.load(results);
    const imgs = html('.DS1iW').toArray().slice(10);
    // return a stringified array of objects containing href and src
    return JSON.stringify(imgs.map((img) => ({ href: '', src: img.attribs.src })));
};

const saveSearchAndImages = async (request, response) => {
    // Log the entire request body first
    console.log('[saveSearchAndImages] Full request body:', JSON.stringify(request.body, null, 2));

    const {
        timestamp,
        location,
        search_client_name,
        search_ip_address,
        search_engine,
        search,
        translation,
        lang_from,
        google_images,
        baidu_images,
        banned,
        sensitive,
    } = request.body;
    console.log(`[saveSearchAndImages for ${search_engine}]`);
    console.log(`[IP address received: ${search_ip_address}]`);
    console.log(`[Search term: ${search}]`);
    console.log(`[Translation: ${translation}]`);

    // Validate required fields
    if (!search || !timestamp) {
        console.error('[saveSearchAndImages] Missing required fields - search:', search, 'timestamp:', timestamp);
        response.status(400).json({
            error: 'Missing required fields',
            missing: {
                search: !search,
                timestamp: !timestamp
            }
        });
        return;
    }

    // Get geolocation data (don't wait if it fails)
    let geoData = null;
    try {
        geoData = await ipGeolocationService.getLocation(search_ip_address);
    } catch (error) {
        console.log('Geolocation failed, continuing without it');
    }

    const searchQuery = `INSERT INTO searches (
        search_timestamp,
        search_client_name,
        search_ip_address,
        search_country,
        search_country_code,
        search_region,
        search_city,
        search_latitude,
        search_longitude,
        search_engine_initial,
        search_engine_translation,
        search_term_initial,
        search_term_initial_language_code,
        search_term_translation,
        search_term_status_banned,
        search_term_status_sensitive,
        search_location
    ) VALUES (
        $1,  $2,  $3,  $4,  $5,  $6,  $7,  $8,  $9, $10, $11, $12, $13, $14, $15, $16, $17
    ) RETURNING search_id`;

    const searchValues = [
        timestamp,
        search_client_name,
        search_ip_address,
        geoData && geoData.country ? geoData.country : null,
        geoData && geoData.countryCode ? geoData.countryCode : null,
        geoData && geoData.region ? geoData.region : null,
        geoData && geoData.city ? geoData.city : null,
        geoData && geoData.latitude ? geoData.latitude : null,
        geoData && geoData.longitude ? geoData.longitude : null,
        search_engine,
        search_engine === 'google' ? 'baidu' : 'google',
        search,
        lang_from,
        translation,
        banned ? banned : false,
        sensitive ? sensitive : false,
        location,
    ];

    let searchId;
    try {
        console.log('[searchValues]', searchValues);
        console.log(`[saving search for ${search_engine}...]`);
        const searchInsertResult = await pool.query(searchQuery, searchValues);
        searchId = searchInsertResult.rows[0].search_id;
        console.log(`[saved search for ${search_engine} searchId: ${searchId}]`);
    } catch (error) {
        console.error(error);
        response.status(500).json(error);
        return;
    }

    // Save images if at least one search engine returned results
    if (google_images.length > 0 || baidu_images.length > 0) {
        console.log(`[saving images for ${search_engine}...]`);
        console.log(`[google_images]`, google_images);
        console.log(`[baidu_images]`, baidu_images);
        const worker = new Worker('./worker.js', {workerData: { baidu_images, google_images, searchId }});
        worker.on('message', (result) => {
            console.log('worker: saveImages args', result);
        })
        worker.on("error", (msg) => {
            console.log(msg);
        });
        console.log('image urls sent to worker');
    } else {
        console.log('[No images to save - both search engines returned empty results]');
    }

    response.status(201).json({ searchId });
};

function getType(value) {
    if (value === null) return 'null';
    if (Array.isArray(value)) return 'array';
    if (value instanceof Date) return 'date';
    return typeof value;
}

const getVoteCountsBySearchId = (request, response) => {
    console.log("getVoteCountsBySearchId", request.params.search_id);
    const search_id = parseInt(request.params.search_id);
    
    const query = `
        SELECT 
            v.vote_name,
            COUNT(hv.vote_id) as vote_count
        FROM votes v
        LEFT JOIN have_votes hv ON v.vote_id = hv.vote_id AND hv.search_id = $1
        GROUP BY v.vote_name
        ORDER BY v.vote_name
    `;
    
    const values = [search_id];

    pool.query(query, values, (error, results) => {
        if (error) {
            response.status(500).json(error);
        } else {
            response.status(200).json(results.rows);
        }
    });
}

module.exports = {
    getAllSearches,
    getDashboardData,
    getTotalSearches,
	getSearchByID,
    getFilteredSearches,
    getImageBinary,
    getImagesWithSearch,
	getImagesOnlyBySearchID,
	getImagesAndSearchBySearchID,
	getAllVotes,
	getVoteBySearchID,
	getVoteByVoteID,
	getCensoredSearches,
	getUncensoredSearches,
	getBadTranslationSearches,
	getGoodTranslationSearches,
	getLostInTranslationSearches,
	getNSFWSearches,
	getWTFSearches,
	getAllSearchesWithVoteCounts,
	getSearchWithVoteCountsBySearchId,
	getSearchesWithVoteCountsAndImageInfo,
    getSearchesWithVoteCountsAndImageInfoBySearchID,
    getSearchesByTerm,
    getSearchesByTermWithImages,
    getImagesByTermWithSearchInfo,
    getAllTerms,
	getImages,
    getImage,
	getImagesOnlyCensored,
	getImagesOnlyUnsensored,
	getImagesOnlyBadTranslation,
	getImagesOnlyGoodTranslation,
	getImagesOnlyLostInTranslation,
	getImagesOnlyNSFW,
	getImagesOnlyWTF,
    checkSecret,
	createSearch,
    deleteSearch,
	createVote,
    saveImage,
    deleteImage,
    updateImageUrl,
    saveImagesEndpoint,
    saveSearchAndImages,
    saveImagesToWordpress,
    getVoteCountsBySearchId,
    getGeographicAnalytics,
    getUSStatesAnalytics,
    getCountriesList,
    getSearchLocationsList,
    getSearchAnalytics,
    getVoteAnalytics,
    getRecentActivity,
    getIPDistribution,
}
