// Health check endpoint with database connectivity test
const { allowCors } = require('../lib/cors');
const { query } = require('../lib/db');

async function handler(req, res) {
  try {
    // Test database connection
    const start = Date.now();
    const result = await query('SELECT 1 as test');
    const dbResponseTime = Date.now() - start;

    const response = {
      status: 'healthy',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      database: {
        status: 'connected',
        responseTime: `${dbResponseTime}ms`,
        testResult: result.rows[0]?.test === 1 ? 'passed' : 'failed'
      }
    };

    res.status(200).json(response);
  } catch (error) {
    console.error('Health check failed:', error);

    const response = {
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: 'Database connection failed',
      database: {
        status: 'disconnected',
        error: error.message
      }
    };

    res.status(503).json(response);
  }
}

module.exports = allowCors(handler);