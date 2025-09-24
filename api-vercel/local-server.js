// Simple local server to test Vercel functions
require('dotenv').config({ path: '.env.local' });

const http = require('http');
const url = require('url');

// Import the handlers
const indexHandler = require('./api/index');
const healthHandler = require('./api/health');
const dashboardHandler = require('./api/dashboard/index');
const searchesHandler = require('./api/searches/index');

const PORT = 3001;

// Helper to convert Node.js req/res to Vercel-style
async function handleRequest(req, res, handler) {
  const parsedUrl = url.parse(req.url, true);

  // Add query to req object
  req.query = parsedUrl.query || {};
  req.method = req.method;

  // Parse body for POST requests
  if (req.method === 'POST' || req.method === 'PUT') {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    req.on('end', async () => {
      try {
        req.body = JSON.parse(body);
      } catch (e) {
        req.body = {};
      }
      await handler(req, res);
    });
  } else {
    await handler(req, res);
  }
}

const server = http.createServer(async (req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;

  console.log(`[${req.method}] ${pathname}`);

  // Add json helper
  res.json = (data) => {
    res.statusCode = res.statusCode || 200;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(data));
  };

  res.status = (code) => {
    res.statusCode = code;
    return res;
  };

  // Route to appropriate handler
  try {
    switch (pathname) {
      case '/api':
      case '/api/':
        await handleRequest(req, res, indexHandler);
        break;
      case '/api/health':
        await handleRequest(req, res, healthHandler);
        break;
      case '/api/dashboard':
        await handleRequest(req, res, dashboardHandler);
        break;
      case '/api/searches':
        await handleRequest(req, res, searchesHandler);
        break;
      default:
        res.statusCode = 404;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ error: 'Not Found', path: pathname }));
    }
  } catch (error) {
    console.error('Handler error:', error);
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: error.message }));
  }
});

server.listen(PORT, () => {
  console.log(`🚀 Local server running at http://localhost:${PORT}`);
  console.log('Available endpoints:');
  console.log('  - http://localhost:3001/api');
  console.log('  - http://localhost:3001/api/health');
  console.log('  - http://localhost:3001/api/dashboard');
  console.log('  - http://localhost:3001/api/searches');
});