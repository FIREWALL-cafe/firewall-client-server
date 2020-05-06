const db_credentials = require('./db_credentials.js')
pool = db_credentials.pool
/*****************************/
/*Searches w/o Images & Votes*/
/*****************************/

//GET: All search results without images/Votes
const getAllSearches = (request, response) => {
  pool.query('SELECT * \
              FROM Searches s', (error, results) => {
  if (error) {
    throw error
  }
  response.status(200).json(results.rows)
  })
}

//GET: All search results of any kind sorted by date (ascending)
const getAllSearchesByTimeASC = (request, response) => {
  pool.query('SELECT * \
              FROM Searches s \
              ORDER BY s.search_timestamp ASC', (error, results) => {
  if (error) {
    throw error
  }
  response.status(200).json(results.rows)
  })
}

//GET: All search results of any kind sorted by date (descending)
const getAllSearchesByTimeDESC = (request, response) => {
  pool.query('SELECT * \
              FROM Searches s \
              ORDER BY s.search_timestamp DESC', (error, results) => {
  if (error) {
    throw error
  }
  response.status(200).json(results.rows)
  })
}

//GET: Individual search result without images/Votes matching a given location
const getSearchBySearchLocation = (request, response) => {
  const {search_location} = request.body

  pool.query('SELECT * \
              FROM Searches s \
              WHERE s.search_location = $1', [search_location], (error, results) => {
  if (error) {
    throw error
  }
  response.status(200).json(results.rows)
  })
}

//GET: Individual search result without images/Votes matching a given location
const getSearchByID = (request, response) => {
  const {search_id} = parseInt(request.params.search_id)

  pool.query('SELECT * \
              FROM Searches s \
              WHERE s.search_id = $1', [search_id], (error, results) => {
  if (error) {
    throw error
  }
  response.status(200).json(results.rows)
  })
}

//GET: Individual search result without images/Votes matching a given year or time range
const getSearchBySearchTimestamp = (request, response) => {
  const {search_timestamp} = request.body

  pool.query('SELECT * \
              FROM Searches s \
              WHERE s.search_timestamp = $1', [search_timestamp],(error, results) => {
  if (error) {
    throw error
  }
  response.status(200).json(results.rows)
  })
}

//GET: Individual search result without images/Votes matching a given initial language(s) (BY search_term_initial_language_code)
const getSearchMatchingInitialLanguageCode = (request, response) => {
  const {initial_language_code} = request.body

  pool.query('SELECT * \
              FROM Searches s \
              WHERE s.search_term_initial_language_code = $1', [initial_language_code], (error, results) => {
  if (error) {
    throw error
  }
  response.status(200).json(results.rows)
  })
}

//GET: Individual search result without images/Votes matching a given initial language(s) (BY search_term_translation_language_code)
const getSearchMatchingTranslationLanguageCode = (request, response) => {
  const {translation_language_code} = request.body

  pool.query('SELECT * \
              FROM Searches s \
              WHERE s.search_term_translation_language_code = $1', [translation_language_code], (error, results) => {
  if (error) {
    throw error
  }
  response.status(200).json(results.rows)
  })
}

//GET: Individual search result without images/Votes matching a given initial search engine
const getSearchMatchingInitialEngine = (request, response) => {
  const {initial_engine} = request.body

  pool.query('SELECT * \
              FROM Searches s \
              WHERE s.search_engine_initial = $1', [initial_engine], (error, results) => {
  if (error) {
    throw error
  }
  response.status(200).json(results.rows)
  })
}

//GET: Individual search result without images/Votes matching a given initial search engine
const getSearchMatchingTranslationEngine = (request, response) => {
  const {translation_engine} = request.body

  pool.query('SELECT * \
              FROM Searches s \
              WHERE s.search_engine_translation = $1', [translation_engine], (error, results) => {
  if (error) {
    throw error
  }
  response.status(200).json(results.rows)
  })
}

/********/
/*Images*/
/********/

//GET: All Image Info for All search results
const getAllImages = (request, response) => {
  pool.query('SELECT s.*, i.* \
              FROM Searches s FULL JOIN Images i ON s.search_id = i.search_id', (error, results) => {
  if (error) {
    throw error
  }
  response.status(200).json(results.rows)
  })
}

//GET: Image Info w/ search for individual search result (BY search_id)
const getImagesAndSearchBySearchID = (request, response) => {
  const {search_id} = parseInt(request.params.search_id)

  pool.query('SELECT s.*, i.* \
              FROM Searches s FULL JOIN Images i ON s.search_id = i.search_id \
              WHERE s.search_id = $1', [search_id], (error, results) => {
  if (error) {
    throw error
  }
  response.status(200).json(results.rows)
  })
}

//GET: Image Info for individual search result (BY search_term_initial)
const getImagesAndSearchBySearchTerm = (request, response) => {
  const {search_term} = request.body

  pool.query('SELECT s.*, i.* \
              FROM Searches s FULL JOIN Images i ON s.search_id = i.search_id \
              WHERE s.search_term_initial = $1', [search_term], (error, results) => {
  if (error) {
    throw error
  }
  response.status(200).json(results.rows)
  })
}

//GET: Image Info ONLY for individual search result (BY search_id)
const getImagesOnlyBySearchID = (request, response) => {
  const {search_id} = parseInt(request.params.search_id)

  pool.query('SELECT s.*, i.* \
              FROM Searches s FULL JOIN Images i ON s.search_id = i.search_id \
              WHERE s.search_id = $1', [search_id], (error, results) => {
  if (error) {
    throw error
  }
  response.status(200).json(results.rows)
  })
}

/*******/
/*Votes*/
/*******/

//GET: All Votes with Search Info (Only contains searches with votes b/c Inner Join)
const getAllVotes = (request, response) => {
  pool.query('SELECT s.*, hv.* \
              FROM Searches s INNER JOIN Have_Votes hv ON s.search_id = hv.search_id;', (error, results) => {
  if (error) {
    throw error
  }
  response.status(200).json(results.rows)
  })
}

//GET: Individual vote (BY Vote_ID)
const getVoteByVoteID = (request, response) => {
  const {vote_id} = parseInt(request.params.vote_id)

  pool.query('SELECT s.*, hv.* \
              FROM Searches s INNER JOIN Have_Votes hv ON s.search_id = hv.search_id \
              WHERE hv.vote_id = $1', [vote_id],(error, results) => {
  if (error) {
    throw error
  }
  response.status(200).json(results.rows)
  })
}

//GET: Individual vote (BY Vote_ID)
const getVoteBySearchID = (request, response) => {
  const {search_id} = parseInt(request.params.search_id)

  pool.query('SELECT hv.*, s.* \
              FROM Searches s INNER JOIN Have_Votes hv ON s.search_id = hv.search_id \
              WHERE s.search_id = $1', [search_id],(error, results) => {
  if (error) {
    throw error
  }
  response.status(200).json(results.rows)
  })
}

/*Does Not work at the moment
//GET: Consolidated Counts for each type of vote_id (for ALL SEARCHES)
const getAllSearchesWithVoteCounts = (request, response) => {
  pool.query('SELECT s.*, \
                COUNT(hv.*) total, \
                COUNT(case when vote_id = '1' then 1 end) AS Censored, \
                COUNT(case when vote_id = '2' then 1 end) AS Uncensored, \
                COUNT(case when vote_id = '3' then 1 end) AS BadTranslation, \
                COUNT(case when vote_id = '4' then 1 end) AS GoodTranslation, \
                COUNT(case when vote_id = '5' then 1 end) AS LostInTranslation, \
                COUNT(case when vote_id = '6' then 1 end) AS NSFW, \
                COUNT(case when vote_id = '7' then 1 end) AS WTF \
             FROM searches s FULL OUTER JOIN have_votes hv ON s.search_id = hv.search_id \
             GROUP BY s.search_id', (error, results) => {
  if (error) {
    throw error
  }
  response.status(200).json(results.rows)
  })
} */

/*Does Not work at the moment
//GET: Consolidated Counts for each type of vote_id (for Individual Search BY search_id)
const getSearchWithVoteCountsBySearchId = (request, response) => {
  const {search_id} = request.body
  pool.query('SELECT s.*, \
                COUNT(hv.*) total, \
                COUNT(case when vote_id = '1' then 1 end) AS Censored, \
                COUNT(case when vote_id = '2' then 1 end) AS Uncensored, \
                COUNT(case when vote_id = '3' then 1 end) AS BadTranslation, \
                COUNT(case when vote_id = '4' then 1 end) AS GoodTranslation, \
                COUNT(case when vote_id = '5' then 1 end) AS LostInTranslation, \
                COUNT(case when vote_id = '6' then 1 end) AS NSFW, \
                COUNT(case when vote_id = '7' then 1 end) AS WTF \
             FROM searches s FULL OUTER JOIN have_votes hv ON s.search_id = hv.search_id \
             WHERE s.search_id = $1 \
             GROUP BY s.search_id', [search_id], (error, results) => {
  if (error) {
    throw error
  }
  response.status(200).json(results.rows)
  })
} */

//GET: Returns all Censored Searches.
const getCensoredSearches = (request, response) => {
  pool.query('SELECT s.*, COUNT(*) as "censored_votes" \
              FROM searches s INNER JOIN Have_Votes hv on s.search_id = hv.search_id \
              WHERE hv.vote_id = 1 \
              GROUP BY s.search_id;', (error, results) => {
  if (error) {
    throw error
  }
  response.status(200).json(results.rows)
  })
}

//GET: Returns all Uncensored Searches.
const getUncensoredSearches = (request, response) => {
  pool.query('SELECT s.*, COUNT(*) as "uncensored_votes" \
              FROM searches s INNER JOIN Have_Votes hv on s.search_id = hv.search_id \
              WHERE hv.vote_id = 2 \
              GROUP BY s.search_id;', (error, results) => {
  if (error) {
    throw error
  }
  response.status(200).json(results.rows)
  })
}

//GET: Returns all Bad Translation Searches.
const getBadTranslationSearches = (request, response) => {
  pool.query('SELECT s.*, COUNT(*) as "bad_translation_votes" \
              FROM searches s INNER JOIN Have_Votes hv on s.search_id = hv.search_id \
              WHERE hv.vote_id = 3 \
              GROUP BY s.search_id;', (error, results) => {
  if (error) {
    throw error
  }
  response.status(200).json(results.rows)
  })
}

//GET: Returns all Good Translation Searches.
const getGoodTranslationSearches = (request, response) => {
  pool.query('SELECT s.*, COUNT(*) as "good_translation_votes" \
              FROM searches s INNER JOIN Have_Votes hv on s.search_id = hv.search_id \
              WHERE hv.vote_id = 4 \
              GROUP BY s.search_id;', (error, results) => {
  if (error) {
    throw error
  }
  response.status(200).json(results.rows)
  })
}

//GET: Returns all Lost In Translation Searches.
const getLostInTranslationSearches = (request, response) => {
  pool.query('SELECT s.*, COUNT(*) as "lost_in_translation_votes" \
              FROM searches s INNER JOIN Have_Votes hv on s.search_id = hv.search_id \
              WHERE hv.vote_id = 5 \
              GROUP BY s.search_id;', (error, results) => {
  if (error) {
    throw error
  }
  response.status(200).json(results.rows)
  })
}

//GET: Returns all NSFW Searches.
const getNSFWSearches = (request, response) => {
  pool.query('SELECT s.*, COUNT(*) as "nsfw_votes" \
              FROM searches s INNER JOIN Have_Votes hv on s.search_id = hv.search_id \
              WHERE hv.vote_id = 6 \
              GROUP BY s.search_id;', (error, results) => {
  if (error) {
    throw error
  }
  response.status(200).json(results.rows)
  })
}

//GET: Returns all WTF Searches.
const getWTFSearches = (request, response) => {
  pool.query('SELECT s.*, COUNT(*) as "wtf_votes" \
              FROM searches s INNER JOIN Have_Votes hv on s.search_id = hv.search_id \
              WHERE hv.vote_id = 7 \
              GROUP BY s.search_id;', (error, results) => {
  if (error) {
    throw error
  }
  response.status(200).json(results.rows)
  })
}

/*Does Not work at the moment
//GET: All Search Results With Vote Counts & Image Info
const getSearchesWithVoteCountsAndImageInfo = (request, response) => {
  pool.query('SELECT s.*, i.image_id, i.image_path, i.image_source, i.image_rank, \
              COUNT(hv.*) total, \
              COUNT(case when vote_id = '1' then 1 end) AS Censored, \
              COUNT(case when vote_id = '2' then 1 end) AS Uncensored, \
              COUNT(case when vote_id = '3' then 1 end) AS BadTranslation, \
              COUNT(case when vote_id = '4' then 1 end) AS GoodTranslation, \
              COUNT(case when vote_id = '5' then 1 end) AS LostInTranslation,\
              COUNT(case when vote_id = '6' then 1 end) AS NSFW,\
              COUNT(case when vote_id = '7' then 1 end) AS WTF\
              FROM searches s FULL OUTER JOIN have_votes hv ON s.search_id = hv.search_id\
              FULL OUTER JOIN Images i on s.search_id = i.search_id\
              GROUP BY s.search_id, i.image_id, i.image_path, i.image_source, i.image_rank;', (error, results) => {
  if (error) {
    throw error
  }
  response.status(200).json(results.rows)
  })
} */

/*******/
/*Votes*/
/*******/

/* NOTE: Cannot Write a Query Combining Images and Votes
         Without Creating Cartesian Products

        Should make two calls to
        getAllVotes() - returns s.* and hv.* for all searches
        getImagesOnlyBySearchID - returns i.* for search_id
        */



//Example Post Statement
const createSearch = (request, response) => {
  const {search_text} = request.body

  pool.query('INSERT INTO Searches (search_text) VALUES ($1)', [search_text], (error, results) => {
  if (error) {
    throw error
  }
  response.status(201).send('Search added with ID: $result.insertId}')
  })
}

module.exports = {
  getAllSearches,
  getAllSearchesByTimeASC,
  getAllSearchesByTimeDESC,
  getSearchBySearchLocation,
  getSearchByID,
  getSearchBySearchTimestamp,
  getSearchMatchingInitialLanguageCode,
  getSearchMatchingTranslationLanguageCode,
  getSearchMatchingInitialEngine,
  getSearchMatchingTranslationEngine,
  getAllImages,
  getImagesAndSearchBySearchID,
  getImagesAndSearchBySearchTerm,
  getImagesOnlyBySearchID,
  getAllVotes,
  getVoteByVoteID,
  getVoteBySearchID,
  //getAllSearchesWithVoteCounts,
  //getSearchWithVoteCountsBySearchId,
  getCensoredSearches,
  getUncensoredSearches,
  getBadTranslationSearches,
  getGoodTranslationSearches,
  getLostInTranslationSearches,
  getNSFWSearches,
  getWTFSearches,
  //getSearchesWithVoteCountsAndImageInfo,
}
