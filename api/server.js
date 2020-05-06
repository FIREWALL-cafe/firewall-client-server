const express = require('express')
const bodyParser = require('body-parser')
const app = express()
const db = require('./queries')
const port = 11458

app.use(bodyParser.json())
app.use(
  bodyParser.urlencoded({
    extended: true,
  })
)

app.get('/', (request, response) => {
  response.json({ info: 'Firewall-Cafe API'})
})

app.listen(port, () => {
   console.log('App running on port ${port}.')
})


/*Searches w/o Images & Votes*/
app.get('/searches', db.getAllSearches)
app.get('/searches/time_ASC', db.getAllSearchesByTimeASC) //Not sure if this is doing anything tbh
app.get('/searches/time_DESC', db.getAllSearchesByTimeDESC) //Not sure if this is doing anything tbh

app.get('/searches/search_location/:search_location', db.getSearchBySearchLocation) //may need to adjust location names to contain no spaces
app.get('/searches/search_id/:search_id', db.getSearchByID)
app.get('/searches/search_timestamp/:search_timestamp', db.getSearchBySearchTimestamp) //Not sure how this will work yet (if it accepts ranges)
app.get('/searches/initial_language_code/:initial_language_code', db.getSearchMatchingInitialLanguageCode)
app.get('/searches/translation_language_code/:translation_language_code', db.getSearchMatchingTranslationLanguageCode)
app.get('/searches/initial_engine/:initial_engine', db.getSearchMatchingInitialEngine)
app.get('/searches/translation_engine/:translation_engine', db.getSearchMatchingTranslationEngine)

/*Images & Search Info*/
app.get('/images', db.getAllImages)
app.get('/images/images_and_searches_by_search_id/:search_id', db.getImagesAndSearchBySearchID)
app.get('/images/images_and_searches_by_search_term/:search_term', db.getImagesAndSearchBySearchTerm)

/*Images Info Only*/
app.get('/imagesOnly/:search_id', db.getImagesOnlyBySearchID)

/*Votes & Search Info*/
app.get('/votes', db.getAllVotes)
app.get('/votes/vote_id/:vote_id', db.getVoteByVoteID,) //Get Individual Vote & Search Info for One Vote
app.get('/votes/search_id/:search_id', db.getVoteBySearchID,) //Get Individual Vote & Search Info for One Vote
//app.get('/votes/all_searches_with_counts', db.getAllSearchesWithVoteCounts)
//app.get('/votes/all_searches_with_counts/:search_id', db.getSearchWithVoteCountsBySearchId)
app.get('/votes/censored_searches', db.getCensoredSearches)
app.get('/votes/uncensored_searches', db.getUncensoredSearches)
app.get('/votes/bad_translation_searches', db.getBadTranslationSearches)
app.get('/votes/good_translation_searches', db.getGoodTranslationSearches)
app.get('/votes/lost_in_translation_searches', db.getLostInTranslationSearches)
app.get('/votes/nsfw_searches', db.getNSFWSearches)
app.get('/votes/wtf_searches', db.getWTFSearches)
//app.get('/searches/AllVoteCountsAndImages', db.getSearchesWithVoteCountsAndImageInfo)
