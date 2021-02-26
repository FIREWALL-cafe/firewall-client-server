const express = require('express')
const bodyParser = require('body-parser')
const db = require('./queries.js')
const fileUpload = require('express-fileupload')
const app = express()
const port = 11458

app.use(bodyParser.json())
app.use(
    bodyParser.urlencoded({
        extended: true,
	})
)
app.use(fileUpload())

app.get('/', (request, response) => {
	response.json({ info: 'Firewall-Cafe API'})
})

app.listen(port, () => {
	 console.log(`App running on port ${port}.`)
})

/* Routes */

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

/* Query searches by search term */
app.get('/searches/terms', db.getSearchesByTermWithImages)
app.get('/terms', db.getAllInitialTerms)

/* All Available Information, With Vote Counts */
app.get('/searches/votecounts/images', db.getSearchesWithVoteCountsAndImageInfo)
app.get('/searches/:search_id/votecounts/images', db.getSearchesWithVoteCountsAndImageInfoBySearchID)


/* Image Info Only & Image Subsets */
app.get('/images', db.getImages)
app.get('/images/:image_id', db.getImageBinary)
app.get('/images/search_id/:search_id', db.getImagesOnlyBySearchID)
app.get('/images/type/censored_searches', db.getImagesOnlyCensored)
app.get('/images/type/uncensored_searches', db.getImagesOnlyUnsensored)
app.get('/images/type/bad_translation_searches', db.getImagesOnlyBadTranslation)
app.get('/images/type/good_translation_searches', db.getImagesOnlyGoodTranslation)
app.get('/images/type/lost_in_translation_searches', db.getImagesOnlyLostInTranslation)
app.get('/images/type/nsfw_searches', db.getImagesOnlyNSFW)
app.get('/images/type/wtf_searches', db.getImagesOnlyWTF)

/* POST Routes */
app.post('/createSearch', db.createSearch)
app.post('/deleteSearch', db.deleteSearch)
app.post('/createVote', db.createVote)
app.post('/saveImage', db.saveImage)
app.post('/deleteImage', db.deleteImage)
app.post('/saveImages', db.saveImages)
app.put('/images', db.updateImageUrl)
