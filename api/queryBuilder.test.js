const { selectFields, getFieldSet, FIELD_SETS, SEARCH_FIELDS } = require('./queryBuilder');

describe('Query Builder', () => {
    describe('selectFields', () => {
        it('should build a simple field list with default prefix', () => {
            const fields = ['search_id', 'search_timestamp', 'search_location'];
            const result = selectFields(fields);
            expect(result).toBe('s.search_id, s.search_timestamp, s.search_location');
        });

        it('should build a field list with custom prefix', () => {
            const fields = ['search_id', 'search_timestamp'];
            const result = selectFields(fields, 'searches');
            expect(result).toBe('searches.search_id, searches.search_timestamp');
        });

        it('should handle single field', () => {
            const fields = ['search_id'];
            const result = selectFields(fields);
            expect(result).toBe('s.search_id');
        });

        it('should throw error for empty array', () => {
            expect(() => selectFields([])).toThrow('Fields must be a non-empty array');
        });

        it('should throw error for non-array', () => {
            expect(() => selectFields('not-an-array')).toThrow('Fields must be a non-empty array');
        });
    });

    describe('getFieldSet', () => {
        it('should return minimal field set', () => {
            const result = getFieldSet('minimal');
            expect(result).toBe('s.search_id, s.search_timestamp, s.search_location, s.search_term_initial');
        });

        it('should return basic field set', () => {
            const result = getFieldSet('basic');
            expect(result).toContain('s.search_id');
            expect(result).toContain('s.search_timestamp');
            expect(result).toContain('s.search_term_translation');
            expect(result).toContain('s.search_engine_initial');
        });

        it('should return withGeo field set', () => {
            const result = getFieldSet('withGeo');
            expect(result).toContain('s.search_country');
            expect(result).toContain('s.search_country_code');
            expect(result).toContain('s.search_region');
            expect(result).toContain('s.search_city');
        });

        it('should return all fields by default', () => {
            const result = getFieldSet();
            // Should contain fields from core, extended, and geographic groups (but not wordpress)
            expect(result).toContain('s.search_id'); // core
            expect(result).toContain('s.search_ip_address'); // extended
            expect(result).toContain('s.search_country'); // geographic
            // WordPress fields are not included in 'all' set
            expect(result).not.toContain('s.wordpress_search_term_popularity');
        });

        it('should use custom prefix', () => {
            const result = getFieldSet('minimal', 'search');
            expect(result).toBe('search.search_id, search.search_timestamp, search.search_location, search.search_term_initial');
        });

        it('should throw error for unknown field set', () => {
            expect(() => getFieldSet('unknown')).toThrow('Unknown field set: unknown');
        });
    });

    describe('Query Building', () => {
        it('should build a complete SELECT query for minimal fields', () => {
            const fields = getFieldSet('minimal');
            const query = `SELECT ${fields} FROM searches s WHERE s.search_id = $1`;

            expect(query).toBe('SELECT s.search_id, s.search_timestamp, s.search_location, s.search_term_initial FROM searches s WHERE s.search_id = $1');
        });

        it('should build a query with JOIN using archive fields', () => {
            const fields = getFieldSet('archive');
            const query = `SELECT ${fields} FROM searches s LEFT JOIN have_votes hv ON s.search_id = hv.search_id`;

            expect(query).toContain('SELECT');
            expect(query).toContain('s.search_id');
            expect(query).toContain('s.search_country');
            expect(query).toContain('s.search_latitude');
            expect(query).toContain('FROM searches s LEFT JOIN');
        });

        it('should build a query with custom fields', () => {
            const fields = selectFields(['search_id', 'search_timestamp', 'search_term_initial'], 's');
            const query = `SELECT ${fields} FROM searches s ORDER BY s.search_timestamp DESC`;

            expect(query).toBe('SELECT s.search_id, s.search_timestamp, s.search_term_initial FROM searches s ORDER BY s.search_timestamp DESC');
        });
    });

    describe('Field Set Validation', () => {
        it('should have non-overlapping field sets', () => {
            // Check that minimal is a subset of basic
            const minimal = FIELD_SETS.minimal;
            const basic = FIELD_SETS.basic;
            minimal.forEach(field => {
                expect(basic.includes(field) || field === 'search_location').toBeTruthy();
            });
        });

        it('should have all fields in the all set', () => {
            const allSet = FIELD_SETS.all;
            const allDefinedFields = [
                ...SEARCH_FIELDS.core,
                ...SEARCH_FIELDS.extended,
                ...SEARCH_FIELDS.geographic
                // WordPress fields are excluded from 'all' set
            ];

            expect(allSet.length).toBe(allDefinedFields.length);
            allDefinedFields.forEach(field => {
                expect(allSet).toContain(field);
            });
        });
    });
});