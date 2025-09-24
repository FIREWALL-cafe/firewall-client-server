#!/usr/bin/env node
// Data migration script from current PostgreSQL to Vercel Postgres
require('dotenv').config({ path: '.env.local' });

const { Pool } = require('pg');

// Source database (current)
const sourcePool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'firewallcafe',
  user: 'firewallcafe',
  password: 'firewallcafe',
});

// Target database (Vercel Postgres)
const targetPool = new Pool({
  connectionString: process.env.POSTGRES_URL_NON_POOLING || process.env.POSTGRES_URL,
  ssl: { rejectUnauthorized: false }
});

const TABLES = [
  { name: 'votes', primaryKey: 'vote_id', order: 1 },
  { name: 'searches', primaryKey: 'search_id', order: 2 },
  { name: 'images', primaryKey: 'image_id', order: 3 },
  { name: 'have_votes', primaryKey: 'vote_serial', order: 4 }
];

class DataMigrator {
  constructor() {
    this.batchSize = 1000;
    this.dryRun = process.argv.includes('--dry-run');
  }

  async validateConnection() {
    console.log('🔍 Validating database connections...');

    try {
      const sourceResult = await sourcePool.query('SELECT version()');
      console.log('✅ Source database connected:', sourceResult.rows[0].version.split(' ')[0]);
    } catch (error) {
      throw new Error(`❌ Source database connection failed: ${error.message}`);
    }

    try {
      const targetResult = await targetPool.query('SELECT version()');
      console.log('✅ Target database connected:', targetResult.rows[0].version.split(' ')[0]);
    } catch (error) {
      throw new Error(`❌ Target database connection failed: ${error.message}`);
    }
  }

  async getTableInfo(tableName) {
    const sourceCount = await sourcePool.query(`SELECT COUNT(*) FROM ${tableName}`);
    const targetCount = await targetPool.query(`SELECT COUNT(*) FROM ${tableName}`);

    return {
      source: parseInt(sourceCount.rows[0].count),
      target: parseInt(targetCount.rows[0].count)
    };
  }

  async clearTable(tableName) {
    if (this.dryRun) {
      console.log(`🔄 [DRY RUN] Would clear table: ${tableName}`);
      return;
    }

    console.log(`🧹 Clearing target table: ${tableName}`);
    await targetPool.query(`TRUNCATE TABLE ${tableName} CASCADE`);
  }

  async migrateTable(table) {
    const { name: tableName, primaryKey } = table;
    console.log(`\n📦 Migrating table: ${tableName}`);

    const { source: totalRows, target: existingRows } = await this.getTableInfo(tableName);

    if (existingRows > 0) {
      console.log(`⚠️  Target table ${tableName} already has ${existingRows} rows`);
      const shouldClear = !this.dryRun; // In real scenario, prompt user
      if (shouldClear) {
        await this.clearTable(tableName);
      }
    }

    console.log(`📊 Total rows to migrate: ${totalRows}`);

    if (totalRows === 0) {
      console.log(`✅ No data to migrate for ${tableName}`);
      return;
    }

    for (let offset = 0; offset < totalRows; offset += this.batchSize) {
      const limit = Math.min(this.batchSize, totalRows - offset);

      // Get batch from source
      const sourceData = await sourcePool.query(
        `SELECT * FROM ${tableName} ORDER BY ${primaryKey} LIMIT $1 OFFSET $2`,
        [limit, offset]
      );

      if (this.dryRun) {
        console.log(`🔄 [DRY RUN] Would migrate batch ${offset + 1}-${offset + sourceData.rows.length} of ${totalRows}`);
        continue;
      }

      // Insert batch into target
      if (sourceData.rows.length > 0) {
        await this.insertBatch(tableName, sourceData.rows);
      }

      const progress = ((offset + sourceData.rows.length) / totalRows * 100).toFixed(1);
      console.log(`📈 Progress: ${offset + sourceData.rows.length}/${totalRows} (${progress}%)`);
    }

    // Update sequence for auto-increment columns
    if (!this.dryRun) {
      await this.updateSequence(tableName, primaryKey);
    }

    console.log(`✅ Completed migration for ${tableName}`);
  }

  async insertBatch(tableName, rows) {
    if (rows.length === 0) return;

    const firstRow = rows[0];
    const columns = Object.keys(firstRow);
    const placeholders = rows.map((_, i) =>
      `(${columns.map((_, j) => `$${i * columns.length + j + 1}`).join(', ')})`
    ).join(', ');

    const values = rows.flatMap(row => columns.map(col => row[col]));

    const query = `
      INSERT INTO ${tableName} (${columns.join(', ')})
      VALUES ${placeholders}
    `;

    try {
      await targetPool.query(query, values);
    } catch (error) {
      console.error(`❌ Batch insert failed for ${tableName}:`, error.message);
      throw error;
    }
  }

  async updateSequence(tableName, primaryKey) {
    try {
      const maxResult = await targetPool.query(`SELECT MAX(${primaryKey}) as max_id FROM ${tableName}`);
      const maxId = maxResult.rows[0].max_id;

      if (maxId) {
        const sequenceName = `${tableName}_${primaryKey}_seq`;
        await targetPool.query(`SELECT setval('${sequenceName}', $1)`, [maxId]);
        console.log(`🔄 Updated sequence ${sequenceName} to ${maxId}`);
      }
    } catch (error) {
      console.warn(`⚠️  Could not update sequence for ${tableName}: ${error.message}`);
    }
  }

  async validateMigration() {
    console.log('\n🔍 Validating migration...');

    for (const table of TABLES) {
      const info = await this.getTableInfo(table.name);
      const status = info.source === info.target ? '✅' : '❌';
      console.log(`${status} ${table.name}: Source=${info.source}, Target=${info.target}`);

      if (info.source !== info.target) {
        console.error(`❌ Row count mismatch for ${table.name}!`);
      }
    }
  }

  async run() {
    try {
      console.log('🚀 Starting data migration...');
      console.log(`Mode: ${this.dryRun ? 'DRY RUN' : 'LIVE MIGRATION'}`);

      await this.validateConnection();

      // Sort tables by dependency order
      const sortedTables = TABLES.sort((a, b) => a.order - b.order);

      for (const table of sortedTables) {
        await this.migrateTable(table);
      }

      await this.validateMigration();

      console.log('\n🎉 Migration completed successfully!');

    } catch (error) {
      console.error('\n❌ Migration failed:', error.message);
      process.exit(1);
    } finally {
      await sourcePool.end();
      await targetPool.end();
    }
  }
}

// Run migration
const migrator = new DataMigrator();
migrator.run();