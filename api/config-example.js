'use strict';

const { Pool } = require('pg');

const pool = new Pool({
	port: 5432,
	host: 'localhost',
	database: '',
	user: '',
	password: '',
});

module.exports = { pool };
