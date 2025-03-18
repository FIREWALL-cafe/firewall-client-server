const axios = require('axios');
const cheerio = require('cheerio');
const { query } = require('express');
const config = require('./config.js')
const {pool,secret} = config
const space = require('./spaces-interface.js')

const {Worker} = require('worker_threads');

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
/*searches w/o Images & Votes*/
/*****************************/

//GET: All search results without images/Votes
const getAllSearches = (request, response) => {
    const page = parseInt(request.query.page) || 1;
    const page_size = parseInt(request.query.page_size) || 100;
    const offset = (page-1)*page_size;

    const countQuery = `SELECT COUNT(*) FROM searches`;
    const dataQuery = `SELECT s.* FROM searches s ORDER BY s.search_id DESC LIMIT $1 OFFSET $2`;
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
const getFilterConditions = (keyword, vote_ids, search_locations, years) => {
    console.log("getFilterConditions: ", keyword, vote_ids, search_locations, years);
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
    const blacklist = ['miami_beach'];
    const filteredLocations = search_locations.filter(location => !blacklist.includes(location));

    const locationByTimeRange = {
    'taiwan': {
        time1: '2022-11-03 08:00:00-00',
        time2: '2022-11-04 08:00:00-00'
    },
    'new_jersey': {
        time1: '2022-08-31 08:00:00-00',
        time2: '2022-09-30 08:00:00-00'
    },
    'miami_beach': {
        time1: '2021-10-04 08:00:00-00',
        time2: '2021-10-06 08:00:00-00'
    },
    'asheville': {
        time1: '2020-01-24 08:00:00-00',
        time2: '2020-02-25 08:00:00-00'
    },
    'poughkeepsie': {
        time1: '2020-02-26 08:00:00-00',
        time2: '2020-02-27 08:00:00-00'
    },
    'vienna': {
        time1: '2020-01-10 08:00:00-00',
        time2: '2020-02-02 08:00:00-00'
    },
    'ann_arbor': {
        time1: '2019-09-21 08:00:00-00',
        time2: '2019-09-22 08:00:00-00'
    },
    'hong_kong': {
        time1: '2019-01-12 08:00:00-00',
        time2: '2019-01-24 08:00:00-00'
    },
    'oslo': {
        time1: '2018-05-28 08:00:00-00',
        time2: '2018-05-29 08:00:00-00'
    },
    'nyc_expo_2017': {
        time1: '2017-09-19 08:00:00-00',
        time2: '2017-09-19 08:00:00-00'
    },
    'oslo_2017': {
        time1: '2017-05-20 08:00:00-00',
        time2: '2017-05-24 08:00:00-00'
    },
    'serendipity_austria': {
        time1: '2016-12-03 08:00:00-00',
        time2: '2016-12-31 08:00:00-00'
    },
    'marymount_field_trip': {
        time1: '2016-02-29 08:00:00-00',
        time2: '2016-02-29 08:00:00-00'
    },
    'hacktivism_roundtable': {
        time1: '2016-02-26 19:30:00-05',
        time2: '2016-02-26 21:30:00-05'
    },
    'apex_field_trip': {
        time1: '2016-02-25 16:00:00-05',
        time2: '2016-03-03 18:00:00-05'
    },
    'proxy_pals': {
        time1: '2016-02-25 20:00:00-05',
        time2: '2016-02-25 22:00:00-05'
    },
    'networked_feminism': {
        time1: '2016-02-19 19:30:00-05',
        time2: '2016-02-19 21:30:00-05'
    },
    'inaugural_popup': {
        time1: '2016-02-08 09:00:00-05',
        time2: '2016-03-06 17:00:00-05'
    }
    };

    // Approximate missing locations by using timestamps
    const getApproximatedLocations = (location) => {
        return `to_timestamp(s.search_timestamp/1000) BETWEEN '${location.time1}' AND '${location.time2}'`;
    }

    // Filter by location
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
            conditions.push(` s.search_location = '${filteredLocations[0]}'`);
        }
    } else if (!filteredLocations.length && search_locations.length) {
        // Get locations that are not in the postgres
        conditions.push(getApproximatedLocations());
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

    return conditions.join(' AND ');
};

/*
 * Called from Search Archive page. It filters
 * searches based on keyword OR location, vote, and year.
 * It then collects images associated with each search.
 */
const getFilteredSearches = async (request, response) => {
    console.log("getFilteredSearches: ", request.query);
    let { keyword, vote_ids, search_locations, years } = request.query;
    console.log("getFilteredSearches: ", keyword, vote_ids, search_locations, years);
    const extractData = (data) => JSON.parse(data ? data : '[]')
    vote_ids = extractData(vote_ids);
    search_locations = request.query.search_locations ? [search_locations] : [];
    years = request.query.years ? [extractData(years)] : [];
    const page = parseInt(request.query.page) || 1;
    const page_size = parseInt(request.query.page_size) || 100;
    const offset = (page-1)*page_size;
    let baseQuery = `SELECT s.* FROM searches s`;
    let countQuery = `SELECT COUNT(*) FROM searches s`;

    // Get all searches
    // Count votes sql
    // COUNT(hv.*) as "total_votes" FROM searches s LEFT JOIN have_votes hv ON s.search_id = hv.search_id
    if ((vote_ids.length == 0) && (search_locations.length == 0)
        && (years.length == 0) && !keyword) {
        console.log("getFilteredSearches:", years, years.length == 0);
    } else { // Get filtered searches
        console.log("getFilteredSearches: FILTERING", keyword, vote_ids, search_locations, years);
        // Filter test searches
        // baseQuery += ` s.search_client_name != 'rowan_scraper_tests' AND `;
        const whereClause = ` WHERE ` + getFilterConditions(keyword, vote_ids, search_locations, years)
        countQuery += whereClause;
        baseQuery += whereClause;
    }

    // Get total count first
    // const countQuery = baseQuery + ` GROUP BY s.search_id`;
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
    
    // First get total count
    const countQuery = `SELECT COUNT(DISTINCT s.search_id)
        FROM searches s
        LEFT JOIN have_votes hv on s.search_id = hv.search_id
        WHERE to_tsvector(s.search_term_initial) @@ plainto_tsquery($1)`;
    
    // Then get paginated data
    const dataQuery = `SELECT s.search_id, s.search_timestamp, search_location, search_ip_address, 
        search_client_name, search_engine_initial, search_term_initial, search_term_translation, 
        search_engine_translation, COUNT(*) as "total_votes"
        FROM searches s
        LEFT JOIN have_votes hv on s.search_id = hv.search_id
        WHERE to_tsvector(s.search_term_initial) @@ plainto_tsquery($1)
        GROUP BY s.search_id
        ORDER BY s.search_id DESC
        LIMIT $2 OFFSET $3`;

    // First get the total count
    pool.query(countQuery, [term], (error, countResult) => {
        if (error) {
            response.status(500).json({error, results: null});
            return;
        }

        // Then get the paginated data
        pool.query(dataQuery, [term, page_size, offset], (error, results) => {
            if (error) {
                response.status(500).json({error, results: null});
            } else {
                response.status(200).json({
                    total: parseInt(countResult.rows[0].count),
                    page,
                    page_size,
                    data: results.rows
                });
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
    const query =  `SELECT s.search_id, s.search_timestamp, s.search_client_name, 
        s.search_engine_initial, s.search_engine_translation, s.search_term_initial, 
        s.search_term_translation, i.image_search_engine, i.image_rank, i.image_href,
        i.image_href_original, i.image_id
        FROM searches s
        FULL OUTER JOIN images i
        ON s.search_id = i.search_id
        WHERE to_tsvector(s.search_term_initial) @@ plainto_tsquery($1);`
    const values = [term];
    pool.query(query, values, (error, results) => {
        if (error) {
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

	pool.query(query, values, (error, results) => {
        if (error) {
            response.status(500).json(error);
        } else {
            response.status(201).json(results.rows);
            return results.rows;
        }
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

// Converts Base64 image data to binary and uploads it to data lake
const uploadImageContent = async (content, href, response) => {
    let fileContent;
    try {
        fileContent = Buffer.from(content, 'binary');
    } catch {
        response.status(400).json("Needs an image string to convert to binary.");
        return;
    }

    let newUrl;
    try {
        newUrl = await space.saveImage(fileContent, href);
        console.log('saved new image with url', newUrl);
    } catch (error) {
        response.status(500).json(err);
        return;
    }
};

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

const saveImages = (request, response, searchId) => {
    console.log("saveImages", searchId);
    // assists endpoints by handling putting images into the database
    const {
        search_engine,
        google_images: googleImagesString,
        baidu_images: baiduImagesString
    } = request.body

    if (!searchId || !search_engine) {
        response.status(400).json("Requires search id and search_engine.")
        return;
    }

    const images = googleImagesString
        ? JSON.parse(googleImagesString)
        : JSON.parse(baiduImagesString);

    if (!images) {
        response.status(400).json("No images provided.")
        return;
    }

    const query = `INSERT INTO images (search_id, image_search_engine, image_href) VALUES ($1, $2, $3)`;

    const imageQueries = [];
    // for each given URL, call that psql query with that value
    for (const image of images) {
        console.log(
            searchId,
            search_engine,
            image.href, // TODO: phashed image ref
        )
        imageQueries.push(pool.query(
            query,
            [
                searchId,
                search_engine,
                image.href, // TODO: phashed image ref
            ]
        ))
        imageQueries.push(uploadImageContent(image.src, image.href, response))
    }
    console.log(imageQueries);

    return imageQueries;
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
    const {
        timestamp,
        location,
        search_client_name,
        secret,
        search_engine,
        search,
        translation,
        lang_from,
        lang_to,
        lang_confidence,
        lang_alternate,
        lang_name,
        google_images,
        baidu_images,
        banned,
        sensitive,
    } = request.body;
    console.log(`[saveSearchAndImages for ${search_engine}]`);

    const searchQuery = `INSERT INTO searches (
        search_timestamp,
        search_client_name,
        search_engine_initial,
        search_engine_translation,
        search_term_initial,
        search_term_initial_language_code,
        search_term_translation,
        search_term_status_banned,
        search_term_status_sensitive,
        search_location
    ) VALUES (
        $1,  $2,  $3,  $4,  $5,  $6,  $7,  $8, $9, $10
    ) RETURNING search_id`;

    const searchValues = [
        timestamp,
        search_client_name,
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

    if (google_images.length > 0 && baidu_images.length > 0) {
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
    }

    // let imageResults;
    // try {
    //     imageResults = Promise.all(imagePromises);
    //     console.log(`[saved images for ${search_engine} ${searchId}]`);
    // } catch (error) {
    //     response.status(500).json(error);
    //     return;
    // }

    response.status(201).json({ searchId });
};

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
}
