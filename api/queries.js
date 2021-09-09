const config = require('./config.js')
const {pool,secret} = config
const space = require('./spaces-interface.js')

/*****************************/
/*searches w/o Images & Votes*/
/*****************************/

//GET: All search results without images/Votes
const getAllSearches = (request, response) => {
    const page = parseInt(request.query.page) || 1;
    const page_size = parseInt(request.query.page_size) || 100;
    const offset = (page-1)*page_size;

    const query = `SELECT s.* FROM searches s ORDER BY s.search_id DESC LIMIT $1 OFFSET $2`;
    const values = [page_size, offset];
    pool.query(query, values, (error, results) => {
        if (error) {
            response.status(500).json(error);
        } else {
            response.status(200).json(results.rows);
        }
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
    const term = request.query.term;
    if(!term) {
        response.status(401).json("term not defined")
        return
    }
    const query =  `SELECT s.*, i.image_hrefs FROM searches s
        INNER JOIN (SELECT array_agg(image_href) as image_hrefs, search_id FROM images GROUP BY search_id) i
        ON s.search_id = i.search_id
        WHERE s.search_term_initial = $1;`
    const values = [term];
    pool.query(query, values, (error, results) => {
        if (error) {
            response.status(500).json({error, results});
        } else {
            response.status(200).json(results.rows);
        }
    })
}

const getImagesByTermWithSearchInfo = (request, response) => {
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
        WHERE s.search_term_initial = $1;`
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
    pool.query(`SELECT MAX(image_id) FROM images`, (err, res) => {
        console.log(err, res)
        const max_img_id = res.rows[0].max;
        const query = `SELECT i.image_id, i.image_search_engine, i.image_href, i.image_href_original, i.image_rank, i.image_mime_type, 
            i.wordpress_attachment_post_id, i.wordpress_attachment_file_path FROM images i
            ORDER BY i.image_id DESC LIMIT $1 OFFSET $2`;
        const values = [page_size, offset];
        pool.query(query, values, (error, results) => {
            if (error) {
                response.status(500).json(error);
            } else {
                response.status(200).json(results.rows);
            }
        })
    })
}

//GET: Image Info Only individual search result (BY search_id)
const getImagesOnlyBySearchID = (request, response) => {
    const search_id = parseInt(request.params.search_id);
    const query = `SELECT i.image_id, i.image_search_engine, i.image_href, i.image_href_original, i.image_rank, i.image_mime_type, 
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
        response.status(401).json("wrong secret")
    } else {
        next()
    }
}

const buildSearchQuery = (request) => {
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

    return { query, values };
};

//POST: createSearch -- Add searches
const createSearch = (request, response) => {
    const { query, values } = buildSearchQuery(request);

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

const saveImages = async (request, response) => {
    const { search_id, image_search_engine, urls, original_urls, image_ranks } = request.body

    if(!search_id || !image_search_engine || !image_ranks || !urls || request.files) {
        response.status(400).json("Need a search_id, image_ranks, urls, and image_search_engine. No file uploads")        
        return;
    }
    if(urls.length !== image_ranks.length || urls.length == 0) {
        response.status(400).json("arrays 'urls' and 'image_ranks' must be the same length")        
        return;
    }
    if(original_urls && original_urls.length > 0 && original_urls.length !== urls.length) {
        response.status(400).json("if including 'original_urls', there must be the same number as 'urls'")
        return;
    }
    const query = `INSERT INTO images (image_id, search_id, image_search_engine, image_href, image_href_original, image_rank) VALUES (DEFAULT, $1, $2, $3, $4, $5)`;
    let imageQueries = [];
    // for each given URL, call that SQL query with that value
    for(let i=0; i<urls.length; i++) {
        let original_url = original_urls && original_urls.length > 0 ? original_urls[i] : "";
        imageQueries.push(pool.query(query, [parseInt(search_id), image_search_engine, urls[i], original_url, image_ranks[i]]))
    }

    return imageQueries;
}

const saveSearchAndImages = async (request, response) => {
    const { searchQuery, searchValues } = buildSearchQuery(request);
    const searchPoolQuery = pool.query(searchQuery, searchValues);
    const promises = [ ...saveImages(request, response),  searchPoolQuery];
    let results;

    try {
        results = await Promise.all(promises);
    } catch (error) {
        response.status(500).json(error);
    }

    response.status(201).json(results);
};

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
    saveSearchAndImages
}
