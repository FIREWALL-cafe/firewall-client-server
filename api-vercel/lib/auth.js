// Authentication middleware for protected endpoints

const checkSecret = (handler) => {
  return async (req, res) => {
    // Check for secret in various places
    const secret = req.body?.secret ||
                  req.query?.secret ||
                  req.headers?.['x-api-secret'];

    const validSecret = process.env.API_SECRET || process.env.SECRET;

    if (!validSecret) {
      console.error('API_SECRET environment variable not configured');
      return res.status(500).json({
        error: 'Server configuration error',
        message: 'API secret not configured'
      });
    }

    if (!secret) {
      return res.status(401).json({
        error: 'Authentication required',
        message: 'Please provide API secret'
      });
    }

    if (secret !== validSecret) {
      return res.status(403).json({
        error: 'Authentication failed',
        message: 'Invalid API secret'
      });
    }

    // Secret is valid, proceed with the handler
    return handler(req, res);
  };
};

// Helper to check if request is authenticated without blocking
const isAuthenticated = (req) => {
  const secret = req.body?.secret ||
                req.query?.secret ||
                req.headers?.['x-api-secret'];

  const validSecret = process.env.API_SECRET || process.env.SECRET;

  return secret === validSecret;
};

module.exports = {
  checkSecret,
  isAuthenticated
};