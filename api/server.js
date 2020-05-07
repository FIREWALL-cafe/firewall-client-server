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


/*Routes*/

    /*Search Info Only*/
app.get('/searches', db.getAllSearches)
app.get('/searches/:search_id', db.getSearchByID)

    /*Searches & Image Info*/
app.get('/searches/images', db.getAllImages)
app.get('/searches/images/:search_id', db.getImagesAndSearchBySearchID)

    /*Searches & Vote Info*/
app.get('/searches/votes', db.getAllVotes)
app.get('/searches/votes/by_search_id/:search_id', db.getVoteBySearchID)
app.get('/searches/votes/by_vote_id/:search_id', db.getVoteByVoteID)
app.get('/searches/votes/censored_searches', db.getCensoredSearches)
app.get('/searches/votes/uncensored_searches', db.getUncensoredSearches)
app.get('/searches/votes/bad_translation_searches', db.getBadTranslationSearches)
app.get('/searches/votes/good_translation_searches', db.getGoodTranslationSearches)
app.get('/searches/votes/lost_in_translation_searches', db.getLostInTranslationSearches)
app.get('/searches/votes/nsfw_searches', db.getNSFWSearches)
app.get('/searches/votes/wtf_searches', db.getWTFSearches)

   /*Searches With Vote Counts*/
//app.get('/searches/votes/counts', db.getAllSearchesWithVoteCounts)
//app.get('/searches/votes/counts/:search_id', db.getSearchWithVoteCountsBySearchId)

  /* All Available Information, With Vote Counts */
//app.get('/searches/AllVoteCountsAndImages', db.getSearchesWithVoteCountsAndImageInfo)



/* TO BE REMOVED -- Can filter out results after data has been returned from routes above
*                   in order to get the desired results.
*
*app.get('/votes', db.getAllVotes)
*app.get('/votes/vote_id/:vote_id', db.getVoteByVoteID,)
*app.get('/searches/time_ASC', db.getAllSearchesByTimeASC) //Not sure if this is doing anything tbh
*app.get('/searches/time_DESC', db.getAllSearchesByTimeDESC) //Not sure if this is doing anything tbh
*app.get('/searches/search_location/:search_location', db.getSearchBySearchLocation) //may need to adjust location names to contain no spaces
*app.get('/searches/search_timestamp/:search_timestamp', db.getSearchBySearchTimestamp) //Not sure how this will work yet (if it accepts ranges)
*app.get('/searches/initial_language_code/:initial_language_code', db.getSearchMatchingInitialLanguageCode)
*app.get('/searches/translation_language_code/:translation_language_code', db.getSearchMatchingTranslationLanguageCode)
*app.get('/searches/initial_engine/:initial_engine', db.getSearchMatchingInitialEngine)
*app.get('/searches/translation_engine/:translation_engine', db.getSearchMatchingTranslationEngine) */
