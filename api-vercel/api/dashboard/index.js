// Dashboard endpoint - Migration from queries.js getDashboardData
const { allowCors } = require('../../lib/cors');
const { query } = require('../../lib/db');

async function handler(req, res) {
  try {
    console.log('Dashboard endpoint called');

    // This mirrors the getDashboardData function from the original queries.js
    // We'll need to migrate the actual query logic from the original file

    // For now, let's create a basic dashboard response
    const totalSearchesQuery = 'SELECT COUNT(*) as total FROM searches';
    const totalSearchesResult = await query(totalSearchesQuery);
    const totalSearches = parseInt(totalSearchesResult.rows[0]?.total || 0);

    // Get recent searches count (last 30 days)
    const recentSearchesQuery = `
      SELECT COUNT(*) as recent
      FROM searches
      WHERE search_timestamp > $1
    `;
    const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
    const recentSearchesResult = await query(recentSearchesQuery, [thirtyDaysAgo]);
    const recentSearches = parseInt(recentSearchesResult.rows[0]?.recent || 0);

    // Get total images count
    const totalImagesQuery = 'SELECT COUNT(*) as total FROM images';
    const totalImagesResult = await query(totalImagesQuery);
    const totalImages = parseInt(totalImagesResult.rows[0]?.total || 0);

    // Get total votes count
    const totalVotesQuery = 'SELECT COUNT(*) as total FROM have_votes';
    const totalVotesResult = await query(totalVotesQuery);
    const totalVotes = parseInt(totalVotesResult.rows[0]?.total || 0);

    const dashboardData = {
      totalSearches,
      recentSearches,
      totalImages,
      totalVotes,
      lastUpdated: new Date().toISOString()
    };

    console.log('Dashboard data generated:', dashboardData);
    res.status(200).json(dashboardData);

  } catch (error) {
    console.error('Dashboard endpoint error:', error);
    res.status(500).json({
      error: 'Failed to fetch dashboard data',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
}

module.exports = allowCors(handler);