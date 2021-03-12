'use strict';

const { Pool } = require('pg');

const pool = new Pool({
	port: 5432,
	host: 'localhost',
	database: '',
	user: '',
	password: '',
});
// Digital Ocean Space info
const spaces_config = {
    bucket: "digital-ocean-bucket-name",
    region: "nyc3",
    SPACES_KEY: "",
    SPACES_SECRET: ""
}
const secret = "keep it safe"

module.exports = { pool, spaces_config, secret };
