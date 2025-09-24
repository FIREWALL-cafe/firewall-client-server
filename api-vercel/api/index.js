// Root API endpoint - Health check and basic info
const { allowCors } = require('../lib/cors');

async function handler(req, res) {
  try {
    const response = {
      info: 'Firewall-Cafe API (Vercel)',
      status: 'healthy',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      version: '0.1.0'
    };

    res.status(200).json(response);
  } catch (error) {
    console.error('Health check error:', error);
    res.status(500).json({
      error: 'Internal server error',
      timestamp: new Date().toISOString()
    });
  }
}

module.exports = allowCors(handler);