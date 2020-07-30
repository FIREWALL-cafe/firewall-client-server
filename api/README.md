
# Firewall-API

Firewall-API is the interface between the app and the data stored in the database.

- *server.js* is the script to run in order to interface with the firewall-cafe database and contains the routes for the API itself.
- *queries.js* links the database to the API and contains the specific functions the routes call in *server.js*.


## Installing and Running the API

The API need only run in one instance and be connec

 1. Pull from the repository.
 2. Add *config.js* (secret, see *config-example.js*) file to the directory to link the API to the database.
 3. Run `npm install`
 4. Run `node app.js` - (or run the app using any node process manager).
 5. The app should now be running and accessible on *port 11458*!

## Getting Started

### Reading Data
Read-Only data in JSON format can be retrieved using the following paths appended to api.firewallcafe.com/.

#### Search Information Only
*Returns all fields from the 'Searches' table.*
|Route  | Description |
|--|--|
|`/searches` | Returns all search-related info for all searches. |
|`/searches/search_id/:search_id`|Returns search-related info for an individual search object (by `search_id`).|

#### Searches With Image Information
*Returns all fields from the 'Searches'  and 'Images' tables.*
|Route  | Description |
|--|--|
|`/searches/images`|Returns all search-related info & image data for all searches.|
|`/searches/images/search_id/:search_id`|Returns all search-related info & image data for an individual search (by `search_id`).|

#### Searches With Vote Information
*Returns all fields from the 'Searches' and 'Have_Votes' tables.*

|Route  | Description |
|--|--|
|`/searches/votes`|Returns search and vote data for searches containing votes.
|`/searches/votes/search_id/:search_id`|Returns all votes for a given search.|
|`/searches/votes/vote_id/:vote_id`|Returns all votes for a given vote category* (*See Resources for vote_id values) .|
|`/searches/votes/censored_searches`|Returns all searches that have received a 'censored' vote.|
|`/searches/votes/uncensored_searches`|Returns all searches that have received an 'uncensored' vote.|
|`/searches/votes/bad_translation_searches`|Returns all searches that have received a 'bad translation' vote.|
|`/searches/votes/good_translation_searches`|Returns all searches that have received a 'good translation' vote.|
|`/searches/votes/nsfw_searches`|Returns all searches that have received an 'nsfw' vote.|
|`/searches/votes/wtf_searches`|Returns all searches that have received a 'wtf' vote.|
|`/searches/votecounts`|Returns all fields from the 'Searches' table along with total votes per vote category for all votes.|
|`/searches/:search_id/votecounts`|Returns all fields from the 'Searches' table along with total votes per vote category for an individual vote (By `search_id`).

#### Searches and Images, With Vote Counts
*Returns all fields from the 'Searches' and 'Images' tables with the total number of votes received per vote category.*
|Route  | Description |
|--|--|
|`/searches/votescounts/images`|Returns data for all searches|
|`/searches/:search_id/votecounts/images`|Returns data for individual search (by search_id).

#### Image Subsets
*Returns only image data for given searches*
|Route  | Description |
|--|--|
|`/images`|Returns all images for all searches.|
|`/images/search_id/:search_id`|Returns all images for an individual search (by search_id).
|`/images/censored_searches`|Returns all images for searches with a 'censored' vote.|
|`/images/uncensored_searches`|Returns all images for searches with an 'uncensored' vote.|
|`/images/bad_translation_searches`|Returns all images for searches with a 'bad translation' vote.|
|`/images/good_translation_searches`|Returns all images for searches with a 'good translation' vote.|
|`/images/lost_in_translation_searches`|Returns all images for searches with a 'lost in translation' vote.|
|`/images/nsfw_searches`|Returns all images for searches with an 'nsfw' vote.|
|`/images/wtf_searches`|Returns all images for searches with a 'wtf' vote.|

## Resources

#### Database Layout
*Here is a visual representation of the current database structure:*

#### Vote  Category Values
|Vote_id|vote_name|vote_description|
|--|--|--|
|`1`|Censored|Search results appear to be censored.|
|`2`|Uncensored|Search results do not appear to be censored.|
|`3`|Bad Translation|The translated search term appears incorrect.|
|`4`|Good Translation|The translated search term correctly matches the initial search term.|
|`5`|Lost In Translation|The search term does not seem to translate well.|
|`6`|NSFW|Search results appear to be 'Not Safe for Work'.|
|`7`|WTF|The search yielded some weird or unusual results.|
