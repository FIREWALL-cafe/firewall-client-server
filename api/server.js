const express = require('express')
const bodyParser = require('body-parser')
const db = require('./queries.js')
const fileUpload = require('express-fileupload')
const app = express()
const port = 11458

app.use(fileUpload())
// body parsing
app.use(express.json({ limit: '10mb' })); //Used to parse JSON bodies
app.use(express.urlencoded({ extended: true })); //Parse URL-encoded bodies

// Add headers before the routes are defined (thanks Stack Overflow)
// https://stackoverflow.com/questions/18310394/no-access-control-allow-origin-node-apache-port-issue
app.use(function (req, res, next) {
  // Website you wish to allow to connect... it's either one, or all, unless you set it dynamically depending on origin
  res.setHeader('Access-Control-Allow-Origin', '*');

  // Request methods you wish to allow
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT');

  // Request headers you wish to allow
  res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');

  // Pass to next layer of middleware
  next();
});

app.get('/', (request, response) => {
	response.json({ info: 'Firewall-Cafe API'})
})

app.listen(port, () => {
	 console.log(`App running on port ${port}.`)
})

/* Routes */

/* Dashboard Routes */
app.get('/dashboard', db.getDashboardData)
app.get('/searches/total', db.getTotalSearches)


/* Search Info Only */
app.get('/searches', db.getAllSearches)
app.get('/searches/search_id/:search_id', db.getSearchByID)

/* Searches & Image Info */
app.get('/searches/images', db.getImagesWithSearch)
app.get('/searches/images/search_id/:search_id', db.getImagesAndSearchBySearchID)

/* Searches & Vote Info */
app.get('/searches/votes', db.getAllVotes)
app.get('/searches/votes/search_id/:search_id', db.getVoteBySearchID)
app.get('/searches/votes/vote_id/:vote_id', db.getVoteByVoteID)
app.get('/searches/votes/censored_searches', db.getCensoredSearches)
app.get('/searches/votes/uncensored_searches', db.getUncensoredSearches)
app.get('/searches/votes/bad_translation_searches', db.getBadTranslationSearches)
app.get('/searches/votes/good_translation_searches', db.getGoodTranslationSearches)
app.get('/searches/votes/lost_in_translation_searches', db.getLostInTranslationSearches)
app.get('/searches/votes/nsfw_searches', db.getNSFWSearches)
app.get('/searches/votes/wtf_searches', db.getWTFSearches)

/* Searches With Vote Counts */
app.get('/searches/votecounts', db.getAllSearchesWithVoteCounts)
app.get('/searches/:search_id/votecounts', db.getSearchWithVoteCountsBySearchId)

/* Query searches by filters: location, vote, year, and term */
app.get('/searches/filter', db.getFilteredSearches)

/* Query searches by search term */
app.get('/searches/terms', db.getSearchesByTermWithImages)
app.get('/images/terms', db.getImagesByTermWithSearchInfo)
app.get('/terms', db.getAllTerms)

/* All Available Information, With Vote Counts */
app.get('/searches/votecounts/images', db.getSearchesWithVoteCountsAndImageInfo)
app.get('/searches/:search_id/votecounts/images', db.getSearchesWithVoteCountsAndImageInfoBySearchID)


/* Image Info Only & Image Subsets */
app.get('/images', db.getImages)
app.get('/images/image_id/:image_id', db.getImage)
app.get('/images/search_id/:search_id', db.getImagesOnlyBySearchID)
app.get('/images/type/censored_searches', db.getImagesOnlyCensored)
app.get('/images/type/uncensored_searches', db.getImagesOnlyUnsensored)
app.get('/images/type/bad_translation_searches', db.getImagesOnlyBadTranslation)
app.get('/images/type/good_translation_searches', db.getImagesOnlyGoodTranslation)
app.get('/images/type/lost_in_translation_searches', db.getImagesOnlyLostInTranslation)
app.get('/images/type/nsfw_searches', db.getImagesOnlyNSFW)
app.get('/images/type/wtf_searches', db.getImagesOnlyWTF)
// we should not ever need to use this as we should have all binaries in the data lake
app.get('/images/:image_id', db.getImageBinary)

/* POST Routes */
app.post('/createSearch', db.checkSecret, db.createSearch)
app.post('/deleteSearch', db.checkSecret, db.deleteSearch)
app.post('/vote', db.checkSecret, db.createVote)
app.post('/saveImage', db.checkSecret, db.saveImage)
app.post('/deleteImage', db.checkSecret, db.deleteImage)
app.post('/saveImages', db.checkSecret, db.saveImagesEndpoint)
app.post('/saveSearchAndImages', db.checkSecret, db.saveSearchAndImages)
app.post('/saveImagesToWordpress', db.checkSecret, db.saveImagesToWordpress)
app.put('/images', db.checkSecret, db.updateImageUrl)
