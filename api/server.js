const express = require('express')
const bodyParser = require('body-parser')
const app = express()
const port = 11458

app.use(bodyParser.json())
app.use(
  bodyParser.urlencoded({
    extended: true,
  })
)

app.get('/', (request, response) => {
  response.json({ info: 'Hello'})
})

app.listen(port, () => {
   console.log('App running on port ${port}.')
})

const db = require('./queries')

app.get('/searches', db.getSearches)
app.post('/searches', db.createSearch) 
