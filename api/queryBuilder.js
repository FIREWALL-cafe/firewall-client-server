// Query Builder for dynamic field selection in searches

// Define all available search fields
const SEARCH_FIELDS = {
    // Core fields
    core: [
        'search_id',
        'search_timestamp',
        'search_location',
        'search_term_initial',
        'search_term_translation'
    ],
    // Extended fields
    extended: [
        'search_ip_address',
        'search_client_name',
        'search_engine_initial',
        'search_engine_translation',
        'search_term_initial_language_code',
        'search_term_initial_language_confidence',
        'search_term_initial_language_alternate_code',
        'search_term_translation_language_code',
        'search_term_status_banned',
        'search_term_status_sensitive'
    ],
    // Geographic fields
    geographic: [
        'search_country',
        'search_country_code',
        'search_region',
        'search_city',
        'search_latitude',
        'search_longitude'
    ],
    // WordPress fields - not used but keep around for now
    wordpress: [
        'search_schema_initial',
        'wordpress_search_term_popularity',
        'wordpress_copyright_takedown',
        'wordpress_unflattened',
        'wordpress_regular_post_id',
        'wordpress_search_result_post_id',
        'wordpress_search_result_post_slug'
    ]
};

// Preset field combinations for common use cases
const FIELD_SETS = {
    minimal: ['search_id', 'search_timestamp', 'search_location', 'search_term_initial'],

    basic: ['search_id', 'search_timestamp', 'search_location', 'search_term_initial',
            'search_term_translation', 'search_engine_initial'],

    withVotes: ['search_id', 'search_timestamp', 'search_location', 'search_term_initial',
                'search_term_translation', 'search_engine_initial', 'search_client_name'],

    withGeo: ['search_id', 'search_timestamp', 'search_location', 'search_country',
              'search_country_code', 'search_region', 'search_city', 'search_term_initial',
              'search_term_translation'],

    archive: ['search_id', 'search_timestamp', 'search_location', 'search_country',
              'search_country_code', 'search_region', 'search_city', 'search_latitude',
              'search_longitude', 'search_ip_address', 'search_client_name',
              'search_engine_initial', 'search_term_initial', 'search_term_initial_language_code',
              'search_term_translation', 'search_engine_translation'],

    // For backward compatibility - all fields
    all: [...SEARCH_FIELDS.core, ...SEARCH_FIELDS.extended, ...SEARCH_FIELDS.geographic]
};

// Simple helper to select specific fields
const selectFields = (fields, prefix = 's') => {
    if (!Array.isArray(fields) || fields.length === 0) {
        throw new Error('Fields must be a non-empty array');
    }
    return fields.map(field => `${prefix}.${field}`).join(', ');
};

// Helper to get a predefined field set
const getFieldSet = (setName = 'all', prefix = 's') => {
    const fields = FIELD_SETS[setName];
    if (!fields) {
        throw new Error(`Unknown field set: ${setName}. Available sets: ${Object.keys(FIELD_SETS).join(', ')}`);
    }
    return selectFields(fields, prefix);
};

module.exports = {
    SEARCH_FIELDS,
    FIELD_SETS,
    selectFields,
    getFieldSet
};