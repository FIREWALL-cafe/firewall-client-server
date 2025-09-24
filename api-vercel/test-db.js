// Simple database connection test
require('dotenv').config({ path: '.env.local' });

const { query } = require('./lib/db');

async function testDatabaseConnection() {
  try {
    console.log('Testing database connection...');
    console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'Set' : 'Not set');

    const result = await query('SELECT 1 as test, NOW() as current_time');
    console.log('✅ Database connection successful!');
    console.log('Test result:', result.rows[0]);

    // Test a real table
    const searchCount = await query('SELECT COUNT(*) as count FROM searches LIMIT 1');
    console.log('✅ Searches table accessible, count:', searchCount.rows[0].count);

    process.exit(0);
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    console.error('Full error:', error);
    process.exit(1);
  }
}

testDatabaseConnection();