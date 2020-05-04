const Pool = require('pg').Pool
const pool = new Pool({
  user: 'cannonball',
  host: 'localhost',
  database: 'cannonball',
  password: 'cannonball',
  port: 5432,
})

//Example Get Statement
const getSearches = (request, response) => {
  pool.query('SELECT * FROM Searches ORDER BY search_id ASC', (error, results) => {
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
  getSearches, 
  createSearch,
} 
