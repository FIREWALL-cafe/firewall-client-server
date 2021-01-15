const config = require('./config.js')
const pool = config.pool

/*****************************/
/*searches w/o Images & Votes*/
/*****************************/

//GET: All search results without images/Votes
const getAllSearches = (request, response) => {
	pool.query(`SELECT *
							FROM searches s`, (error, results) => {
	if (error) {
		throw error
	}
	response.status(200).json(results.rows)
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



/********/
/*Images*/
/********/

//GET: Image Info w/ search for individual search result (BY search_id)
const getImagesAndSearchBySearchID = (request, response) => {
    const search_id = parseInt(request.query.search_id)
    const page = parseInt(request.query.page) || 1;
    const page_size = parseInt(request.query.page_size) || 100;
    const offset = (page-1)*page_size;
    const query = `SELECT s.*, i.image_id, i.image_search_engine, i.image_href, i.image_rank, i.image_mime_type
        FROM searches s FULL JOIN images i ON s.search_id = i.search_id
        WHERE i.image_id > $1 AND s.search_id = $2 ORDER BY i.image_id ASC LIMIT $3`;
    const values = [offset, search_id, page_size];

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
    const pageSize = parseInt(request.query.pageSize) || 100;
    const offset = (page-1)*pageSize;
    const query = `SELECT s.*, i.image_id, i.image_search_engine, i.image_href, i.image_rank, i.image_mime_type
        FROM searches s FULL JOIN images i ON s.search_id = i.search_id
        WHERE i.image_id > $1 ORDER BY i.image_id ASC LIMIT $2`;
    const values = [offset, pageSize];

    pool.query(query, values, (error, results) => {
        if (error) {
            response.status(500).json(error);
        } else {
            response.status(200).json(results.rows);
        }
    })
}

const getImageBinary = (request, response) => {
    const image_id = parseInt(request.query.image_id);
    const query = `SELECT i.* FROM images WHERE i.image_id = $1`;
    const values = [image_id];

    pool.query(query, values, (error, results) => {
        if (error) {
            response.status(500).json(error);
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
    const query = `SELECT v.vote_name, s.*, hv.* FROM searches s INNER JOIN have_votes hv 
        ON s.search_id = hv.search  _id INNER JOIN votes v ON hv.vote_id = v.vote_id`
	pool.query(query, (error, results) => {
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

//GET: Returns all Censored searches.
const getCensoredSearches = (request, response) => {
    const query = `SELECT s.*, COUNT(*) as "censored_votes"
        FROM searches s INNER JOIN have_votes hv on s.search_id = hv.search_id
        WHERE hv.vote_id = 1 GROUP BY s.search_id;`
	pool.query(query, (error, results) => {
	if (error) {
		throw error
	}
	response.status(200).json(results.rows)
	})
}

//GET: Returns all Uncensored searches.
const getUncensoredSearches = (request, response) => {
	pool.query(`SELECT s.*, COUNT(*) as "uncensored_votes"
							FROM searches s INNER JOIN have_votes hv on s.search_id = hv.search_id
							WHERE hv.vote_id = 2
							GROUP BY s.search_id;`, (error, results) => {
	if (error) {
		throw error
	}
	response.status(200).json(results.rows)
	})
}

//GET: Returns all Bad Translation searches.
const getBadTranslationSearches = (request, response) => {
	pool.query(`SELECT s.*, COUNT(*) as "bad_translation_votes"
							FROM searches s INNER JOIN have_votes hv on s.search_id = hv.search_id
							WHERE hv.vote_id = 3
							GROUP BY s.search_id;`, (error, results) => {
	if (error) {
		throw error
	}
	response.status(200).json(results.rows)
	})
}

//GET: Returns all Good Translation searches.
const getGoodTranslationSearches = (request, response) => {
	pool.query(`SELECT s.*, COUNT(*) as "good_translation_votes"
							FROM searches s INNER JOIN have_votes hv on s.search_id = hv.search_id
							WHERE hv.vote_id = 4
							GROUP BY s.search_id;`, (error, results) => {
        if (error) {
            response.status(500).json(error);
        } else {
            response.status(200).json(results.rows);
        }
	})
}

//GET: Returns all Lost In Translation searches.
const getLostInTranslationSearches = (request, response) => {
	pool.query(`SELECT s.*, COUNT(*) as "lost_in_translation_votes"
							FROM searches s INNER JOIN have_votes hv on s.search_id = hv.search_id
							WHERE hv.vote_id = 5
							GROUP BY s.search_id;`, (error, results) => {
        if (error) {
            response.status(500).json(error);
        } else {
            response.status(200).json(results.rows);
        }
	})
}

//GET: Returns all NSFW searches.
const getNSFWSearches = (request, response) => {
	pool.query(`SELECT s.*, COUNT(*) as "nsfw_votes"
							FROM searches s INNER JOIN have_votes hv on s.search_id = hv.search_id
							WHERE hv.vote_id = 6
							GROUP BY s.search_id;`, (error, results) => {
        if (error) {
            response.status(500).json(error);
        } else {
            response.status(200).json(results.rows);
        }
	})
}

//GET: Returns all WTF searches.
const getWTFSearches = (request, response) => {
	pool.query(`SELECT s.*, COUNT(*) as "wtf_votes"
							FROM searches s INNER JOIN have_votes hv on s.search_id = hv.search_id
							WHERE hv.vote_id = 7
							GROUP BY s.search_id;`, (error, results) => {
        if (error) {
            response.status(500).json(error);
        } else {
            response.status(200).json(results.rows);
        }
	})
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
	pool.query(`SELECT s.*, i.image_id, i.image_href, i.image_search_engine, i.image_rank,
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
							GROUP BY s.search_id, i.image_id, i.image_href, i.image_search_engine, i.image_rank;`, (error, results) => {
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
	pool.query(`SELECT s.*, i.image_id, i.image_href, i.image_search_engine, i.image_rank,
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
/*Image Info Only & Image Subsets*/
/*********************************/

//GET: Image Info Only all search results
const getImages = (request, response) => {
    const page = parseInt(request.query.page) || 1;
    const page_size = parseInt(request.query.page_size) || 100;
    const offset = (page-1)*page_size;
    const query = `SELECT i.image_id, i.image_search_engine, i.image_href, i.image_rank, i.image_mime_type, 
        i.wordpress_attachment_post_id, i.wordpress_attachment_file_path FROM images i
        WHERE i.image_id > $1 ORDER BY i.image_id ASC LIMIT $2`;
    const values = [offset, page_size];
    pool.query(query, values, (error, results) => {
        if (error) {
            response.status(500).json(error);
        } else {
            response.status(200).json(results.rows);
        }
	})
}

//GET: Image Info Only individual search result (BY search_id)
const getImagesOnlyBySearchID = (request, response) => {
    const search_id = parseInt(request.params.search_id);
    const query = `SELECT i.image_id, i.image_search_engine, i.image_href, i.image_rank, i.image_mime_type, 
    i.wordpress_attachment_post_id, i.wordpress_attachment_file_path
    FROM searches s FULL JOIN images i ON s.search_id = i.search_id
    WHERE s.search_id = $1`;
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
    const query = `SELECT i.image_id, i.image_search_engine, i.image_href, i.image_rank, i.image_mime_type, 
        i.wordpress_attachment_post_id, i.wordpress_attachment_file_path
        FROM images i FULL JOIN searches S ON s.search_id = i.search_id
        INNER JOIN have_votes hv ON s.search_id = hv.search_id
        WHERE i.image_id > $1 AND hv.vote_id = $2 ORDER BY i.image_id ASC LIMIT $3`;
    const values = [offset, category, page_size];
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
		search_schema_initial
	} = request.body
    console.log("createSearch:", request.body);

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

//POST: createVote -- Add searches
const createVote = (request, response) => {
	const {vote_id, search_id, vote_timestamp, vote_client_name, vote_ip_address} = request.body
    console.log("createVote:", vote_id, search_id, vote_client_name, vote_ip_address)

    const query = 'INSERT INTO have_votes (vote_id, search_id, vote_timestamp, vote_client_name, vote_ip_address) VALUES ($1, $2, $3, $4, $5)';
    const values = [vote_id, search_id, vote_timestamp, vote_client_name, vote_ip_address];

	pool.query(query, values, (error, results) => {
        if (error) {
            response.status(500).json(error);
        } else {
            response.status(201).json(results.rows);
        }
	})
}

//POST: saveImage -- Add searches
const saveImage = (request, response) => {
	const {search_id, image_search_engine, image_href, image_rank, image_mime_type, image_data} = request.body
    console.log(search_id, image_search_engine, image_href, image_rank);

    if (image_data != null) response.status(401).json("saving images to database no longer supported");

    const query = `INSERT INTO images (image_id, search_id, image_search_engine, image_href, image_rank) VALUES (DEFAULT, $1, $2, $3, $4)`;
    const values = [search_id, image_search_engine, image_href, image_rank];

	pool.query(query, values, (error, results) => {
        if (error) {
            response.status(500).json(error);
        } else {
            response.status(201).json(results.rows);
        }
	})
}

module.exports = {
	getAllSearches,
	getSearchByID,
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
	getImages,
	getImagesOnlyCensored,
	getImagesOnlyUnsensored,
	getImagesOnlyBadTranslation,
	getImagesOnlyGoodTranslation,
	getImagesOnlyLostInTranslation,
	getImagesOnlyNSFW,
	getImagesOnlyWTF,
	createSearch,
	createVote,
	saveImage,
}
