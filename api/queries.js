const db_credentials = require('./db_credentials.js')
pool = db_credentials.pool
/*****************************/
/*Searches w/o Images & Votes*/
/*****************************/

//GET: All search results without images/Votes
const getAllSearches = (request, response) => {
  pool.query(`SELECT *
              FROM Searches s`, (error, results) => {
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
              FROM Searches s
              WHERE s.search_id = ${search_id}`, (error, results) => {
  if (error) {
    console.log(error)
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
  const search_id = parseInt(request.params.search_id)

  pool.query(`SELECT s.*, i.*
              FROM Searches s FULL JOIN Images i ON s.search_id = i.search_id
              WHERE s.search_id = ${search_id}`, (error, results) => {
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
  pool.query(`SELECT s.*, hv.*
              FROM Searches s INNER JOIN Have_Votes hv ON s.search_id = hv.search_id;`, (error, results) => {
  if (error) {
    throw error
  }
  response.status(200).json(results.rows)
  })
}

//GET: Individual vote (BY Search_ID)
const getVoteBySearchID = (request, response) => {
  const search_id = parseInt(request.params.search_id)

  pool.query(`SELECT hv.*, s.*
              FROM Searches s INNER JOIN Have_Votes hv ON s.search_id = hv.search_id
              WHERE s.search_id = ${search_id}`, (error, results) => {
  if (error) {
    throw error
  }
  response.status(200).json(results.rows)
  })
}

//GET: Individual vote (BY Vote_ID)
const getVoteByVoteID = (request, response) => {
  const vote_id = parseInt(request.params.vote_id)

  pool.query(`SELECT  hv.*, s.*
              FROM Searches s INNER JOIN Have_Votes hv ON s.search_id = hv.search_id
              WHERE hv.vote_id = ${vote_id}`,  (error, results) => {
  if (error) {
    throw error
  }
  response.status(200).json(results.rows)
  })
}

//GET: Returns all Censored Searches.
const getCensoredSearches = (request, response) => {
  pool.query(`SELECT s.*, COUNT(*) as "censored_votes"
              FROM searches s INNER JOIN Have_Votes hv on s.search_id = hv.search_id
              WHERE hv.vote_id = 1
              GROUP BY s.search_id;`, (error, results) => {
  if (error) {
    throw error
  }
  response.status(200).json(results.rows)
  })
}

//GET: Returns all Uncensored Searches.
const getUncensoredSearches = (request, response) => {
  pool.query(`SELECT s.*, COUNT(*) as "uncensored_votes"
              FROM searches s INNER JOIN Have_Votes hv on s.search_id = hv.search_id
              WHERE hv.vote_id = 2
              GROUP BY s.search_id;`, (error, results) => {
  if (error) {
    throw error
  }
  response.status(200).json(results.rows)
  })
}

//GET: Returns all Bad Translation Searches.
const getBadTranslationSearches = (request, response) => {
  pool.query(`SELECT s.*, COUNT(*) as "bad_translation_votes"
              FROM searches s INNER JOIN Have_Votes hv on s.search_id = hv.search_id
              WHERE hv.vote_id = 3
              GROUP BY s.search_id;`, (error, results) => {
  if (error) {
    throw error
  }
  response.status(200).json(results.rows)
  })
}

//GET: Returns all Good Translation Searches.
const getGoodTranslationSearches = (request, response) => {
  pool.query(`SELECT s.*, COUNT(*) as "good_translation_votes"
              FROM searches s INNER JOIN Have_Votes hv on s.search_id = hv.search_id
              WHERE hv.vote_id = 4
              GROUP BY s.search_id;`, (error, results) => {
  if (error) {
    throw error
  }
  response.status(200).json(results.rows)
  })
}

//GET: Returns all Lost In Translation Searches.
const getLostInTranslationSearches = (request, response) => {
  pool.query(`SELECT s.*, COUNT(*) as "lost_in_translation_votes"
              FROM searches s INNER JOIN Have_Votes hv on s.search_id = hv.search_id
              WHERE hv.vote_id = 5
              GROUP BY s.search_id;`, (error, results) => {
  if (error) {
    throw error
  }
  response.status(200).json(results.rows)
  })
}

//GET: Returns all NSFW Searches.
const getNSFWSearches = (request, response) => {
  pool.query(`SELECT s.*, COUNT(*) as "nsfw_votes"
              FROM searches s INNER JOIN Have_Votes hv on s.search_id = hv.search_id
              WHERE hv.vote_id = 6
              GROUP BY s.search_id;`, (error, results) => {
  if (error) {
    throw error
  }
  response.status(200).json(results.rows)
  })
}

//GET: Returns all WTF Searches.
const getWTFSearches = (request, response) => {
  pool.query(`SELECT s.*, COUNT(*) as "wtf_votes"
              FROM searches s INNER JOIN Have_Votes hv on s.search_id = hv.search_id
              WHERE hv.vote_id = 7
              GROUP BY s.search_id;`, (error, results) => {
  if (error) {
    throw error
  }
  response.status(200).json(results.rows)
  })
}

/****************************/
/*Searches With Vote Counts */
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
    throw error
  }
  response.status(200).json(results.rows)
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
    throw error
  }
  response.status(200).json(results.rows)
  })
}

/***********************************************/
/* All Available Information, With Vote Counts */
/***********************************************/

//GET: All Search Results With Vote Counts & Image Info
const getSearchesWithVoteCountsAndImageInfo = (request, response) => {
  pool.query(`SELECT s.*, i.image_id, i.image_path, i.image_source, i.image_rank,
              COUNT(hv.*) total,
              COUNT(case when vote_id = '1' then 1 end) AS Censored,
              COUNT(case when vote_id = '2' then 1 end) AS Uncensored,
              COUNT(case when vote_id = '3' then 1 end) AS BadTranslation,
              COUNT(case when vote_id = '4' then 1 end) AS GoodTranslation,
              COUNT(case when vote_id = '5' then 1 end) AS LostInTranslation,
              COUNT(case when vote_id = '6' then 1 end) AS NSFW,
              COUNT(case when vote_id = '7' then 1 end) AS WTF
              FROM searches s FULL OUTER JOIN have_votes hv ON s.search_id = hv.search_id
              FULL OUTER JOIN Images i on s.search_id = i.search_id
              GROUP BY s.search_id, i.image_id, i.image_path, i.image_source, i.image_rank;`, (error, results) => {
  if (error) {
    throw error
  }
  response.status(200).json(results.rows)
  })
}

//GET: All Search Results With Vote Counts & Image Info
const getSearchesWithVoteCountsAndImageInfoBySearchID = (request, response) => {
  const search_id = parseInt(request.params.search_id)
  pool.query(`SELECT s.*, i.image_id, i.image_path, i.image_source, i.image_rank,
              COUNT(hv.*) total,
              COUNT(case when vote_id = '1' then 1 end) AS Censored,
              COUNT(case when vote_id = '2' then 1 end) AS Uncensored,
              COUNT(case when vote_id = '3' then 1 end) AS BadTranslation,
              COUNT(case when vote_id = '4' then 1 end) AS GoodTranslation,
              COUNT(case when vote_id = '5' then 1 end) AS LostInTranslation,
              COUNT(case when vote_id = '6' then 1 end) AS NSFW,
              COUNT(case when vote_id = '7' then 1 end) AS WTF
              FROM searches s FULL OUTER JOIN have_votes hv ON s.search_id = hv.search_id
              FULL OUTER JOIN Images i on s.search_id = i.search_id
              WHERE s.search_id = ${search_id}
              GROUP BY s.search_id, i.image_id, i.image_path, i.image_source, i.image_rank;`, (error, results) => {
  if (error) {
    throw error
  }
  response.status(200).json(results.rows)
  })
}

/*********************************/
/*Image Info Only & Image Subsets*/
/*********************************/

//GET: Image Info Only all search results
const getAllImagesOnly = (request, response) => {

  pool.query(`SELECT i.*
              FROM Searches s FULL JOIN Images i ON s.search_id = i.search_id`, (error, results) => {
  if (error) {
    throw error
  }
  response.status(200).json(results.rows)
  })
}


//GET: Image Info Only individual search result (BY search_id)
const getImagesOnlyBySearchID = (request, response) => {
  const search_id = parseInt(request.params.search_id)

  pool.query(`SELECT i.*
              FROM Searches s FULL JOIN Images i ON s.search_id = i.search_id
              WHERE s.search_id = ${search_id}`, (error, results) => {
  if (error) {
    throw error
  }
  response.status(200).json(results.rows)
  })
}

//GET: Image Info Only for Censored Searches
const getImagesOnlyCensored = (request, response) => {

  pool.query(`SELECT i.*
              FROM Images i FULL JOIN Searches S ON s.search_id = i.search_id
              INNER JOIN Have_Votes hv ON s.search_id = hv.search_id
              WHERE hv.vote_id = 1`, (error, results) => {
  if (error) {
    throw error
  }
  response.status(200).json(results.rows)
  })
}

//GET: Image Info Only for Censored Searches
const getImagesOnlyUnsensored = (request, response) => {

  pool.query(`SELECT i.*
              FROM Images i FULL JOIN Searches S ON s.search_id = i.search_id
              INNER JOIN Have_Votes hv ON s.search_id = hv.search_id
              WHERE hv.vote_id = 2`, (error, results) => {
  if (error) {
    throw error
  }
  response.status(200).json(results.rows)
  })
}

//GET: Image Info Only for Censored Searches
const getImagesOnlyBadTranslation = (request, response) => {

  pool.query(`SELECT i.*
              FROM Images i FULL JOIN Searches S ON s.search_id = i.search_id
              INNER JOIN Have_Votes hv ON s.search_id = hv.search_id
              WHERE hv.vote_id = 3`, (error, results) => {
  if (error) {
    throw error
  }
  response.status(200).json(results.rows)
  })
}

//GET: Image Info Only for Censored Searches
const getImagesOnlyGoodTranslation = (request, response) => {

  pool.query(`SELECT i.*
              FROM Images i FULL JOIN Searches S ON s.search_id = i.search_id
              INNER JOIN Have_Votes hv ON s.search_id = hv.search_id
              WHERE hv.vote_id = 4`, (error, results) => {
  if (error) {
    throw error
  }
  response.status(200).json(results.rows)
  })
}
//GET: Image Info Only for Censored Searches
const getImagesOnlyLostInTranslation = (request, response) => {

  pool.query(`SELECT i.*
              FROM Images i FULL JOIN Searches S ON s.search_id = i.search_id
              INNER JOIN Have_Votes hv ON s.search_id = hv.search_id
              WHERE hv.vote_id = 5`, (error, results) => {
  if (error) {
    throw error
  }
  response.status(200).json(results.rows)
  })
}

//GET: Image Info Only for Censored Searches
const getImagesOnlyNSFW = (request, response) => {

  pool.query(`SELECT i.*
              FROM Images i FULL JOIN Searches S ON s.search_id = i.search_id
              INNER JOIN Have_Votes hv ON s.search_id = hv.search_id
              WHERE hv.vote_id = 6`, (error, results) => {
  if (error) {
    throw error
  }
  response.status(200).json(results.rows)
  })
}

//GET: Image Info Only for Censored Searches
const getImagesOnlyWTF = (request, response) => {

  pool.query(`SELECT i.*
              FROM Images i FULL JOIN Searches S ON s.search_id = i.search_id
              INNER JOIN Have_Votes hv ON s.search_id = hv.search_id
              WHERE hv.vote_id = 8`, (error, results) => {
  if (error) {
    throw error
  }
  response.status(200).json(results.rows)
  })
}

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
  getSearchByID,
  getAllImages,
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
  getAllImagesOnly,
  getImagesOnlyCensored,
  getImagesOnlyUnsensored,
  getImagesOnlyBadTranslation,
  getImagesOnlyGoodTranslation,
  getImagesOnlyLostInTranslation,
  getImagesOnlyNSFW,
  getImagesOnlyWTF,
}
