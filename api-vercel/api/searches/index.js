// Searches endpoint - Migration from queries.js getAllSearches
const { allowCors } = require('../../lib/cors');
const { query } = require('../../lib/db');

// Import the query builder from the original API
// For now, we'll inline a simplified version
const getFieldSet = (setName = 'all') => {
  const FIELD_SETS = {
    minimal: ['search_id', 'search_timestamp', 'search_location', 'search_term_initial'],
    basic: ['search_id', 'search_timestamp', 'search_location', 'search_term_initial',
            'search_term_translation', 'search_engine_initial'],
    all: [
      'search_id', 'search_timestamp', 'search_location', 'search_term_initial',
      'search_term_translation', 'search_ip_address', 'search_client_name',
      'search_engine_initial', 'search_engine_translation', 'search_term_initial_language_code',
      'search_term_initial_language_confidence', 'search_term_initial_language_alternate_code',
      'search_term_translation_language_code', 'search_term_status_banned',
      'search_term_status_sensitive', 'search_country', 'search_country_code',
      'search_region', 'search_city', 'search_latitude', 'search_longitude'
    ]
  };

  const fields = FIELD_SETS[setName] || FIELD_SETS.all;
  return fields.map(field => `s.${field}`).join(', ');
};

async function handler(req, res) {
  try {
    console.log('Searches endpoint called with query:', req.query);

    const page = parseInt(req.query.page) || 1;
    const page_size = parseInt(req.query.page_size) || 100;
    const offset = (page - 1) * page_size;

    // Use our query builder for field selection
    const fields = getFieldSet('all');

    // Get total count
    const countQuery = 'SELECT COUNT(*) FROM searches s';
    const countResult = await query(countQuery);
    const total = parseInt(countResult.rows[0]?.count || 0);

    // Get paginated data
    const dataQuery = `
      SELECT ${fields}
      FROM searches s
      ORDER BY s.search_timestamp DESC
      LIMIT $1 OFFSET $2
    `;

    const dataResult = await query(dataQuery, [page_size, offset]);

    const response = {
      total,
      page,
      page_size,
      data: dataResult.rows
    };

    console.log(`Returning ${dataResult.rows.length} searches out of ${total} total`);
    res.status(200).json(response);

  } catch (error) {
    console.error('Searches endpoint error:', error);
    res.status(500).json({
      error: 'Failed to fetch searches',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
}

module.exports = allowCors(handler);