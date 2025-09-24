const { Pool } = require('pg');

// Create a singleton pool instance for serverless environments
let pool;

if (!pool) {
  pool = new Pool({
    connectionString: process.env.DATABASE_URL || process.env.POSTGRES_URL,
    // Serverless-optimized settings
    max: 1, // Single connection per function instance
    idleTimeoutMillis: 10000, // 10 seconds
    connectionTimeoutMillis: 10000, // 10 seconds
    // SSL configuration for production
    ssl: process.env.NODE_ENV === 'production' ? {
      rejectUnauthorized: false
    } : false
  });

  // Handle connection errors gracefully
  pool.on('error', (err) => {
    console.error('Unexpected database error:', err);
  });
}

// Helper function to execute queries with automatic connection handling
const query = async (text, params) => {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    console.log('Executed query', { text: text.substring(0, 50), duration, rows: res.rowCount });
    return res;
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
};

// Helper function to get a client from the pool
const getClient = async () => {
  try {
    const client = await pool.connect();
    const query = client.query;
    const release = client.release;

    // Monkey patch the query method to log errors
    client.query = (...args) => {
      client.lastQuery = args;
      return query.apply(client, args);
    };

    // Set a timeout of 5 seconds, after which we will log this client's last query
    const timeout = setTimeout(() => {
      console.error('A client has been checked out for more than 5 seconds!');
      console.error(`The last executed query on this client was: ${client.lastQuery}`);
    }, 5000);

    client.release = () => {
      clearTimeout(timeout);
      client.query = query;
      client.release = release;
      return release.apply(client);
    };

    return client;
  } catch (error) {
    console.error('Error getting database client:', error);
    throw error;
  }
};

module.exports = {
  pool,
  query,
  getClient
};