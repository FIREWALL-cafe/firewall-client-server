# Vercel Postgres Setup Guide

## Step 1: Create Vercel Postgres Database

### Via Vercel Dashboard
1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project
3. Go to "Storage" tab
4. Click "Create Database"
5. Choose "Postgres"
6. Select region (recommend: US East - iad1)
7. Choose plan (Pro recommended for production)

### Via Vercel CLI
```bash
# Install Vercel CLI if not already installed
npm i -g vercel

# Login to Vercel
vercel login

# Create Postgres database
vercel storage create postgres --name firewall-cafe-db
```

## Step 2: Get Connection Details

After creation, you'll get these environment variables:
```env
POSTGRES_URL="postgres://..."
POSTGRES_PRISMA_URL="postgres://..."
POSTGRES_URL_NON_POOLING="postgres://..."
POSTGRES_USER="..."
POSTGRES_HOST="..."
POSTGRES_PASSWORD="..."
POSTGRES_DATABASE="..."
```

## Step 3: Add to Vercel Environment Variables

```bash
# Set environment variables in Vercel
vercel env add POSTGRES_URL
vercel env add POSTGRES_PRISMA_URL
vercel env add POSTGRES_URL_NON_POOLING

# Or use the dashboard to add them manually
```

## Step 4: Update Local Environment

Update `.env.local`:
```env
# Vercel Postgres (development)
POSTGRES_URL="postgres://..."
DATABASE_URL="postgres://..."  # For backward compatibility
```

## Step 5: Test Connection

```bash
# Test connection with our existing test script
node test-db.js
```

## Step 6: Schema Migration

```bash
# Export current schema
pg_dump -h localhost -U firewallcafe -d firewallcafe --schema-only > current_schema.sql

# Connect to Vercel Postgres and create schema
psql $POSTGRES_URL_NON_POOLING -f current_schema.sql
```

## Step 7: Data Migration

```bash
# Export data from current database
pg_dump -h localhost -U firewallcafe -d firewallcafe --data-only --inserts > current_data.sql

# Import data to Vercel Postgres
psql $POSTGRES_URL_NON_POOLING -f current_data.sql
```

## Verification Checklist

- [ ] Database created in Vercel
- [ ] Environment variables set
- [ ] Local connection test passes
- [ ] Schema migrated successfully
- [ ] Data migrated successfully
- [ ] Row counts match between databases
- [ ] Primary key sequences updated
- [ ] Indexes and constraints working

## Troubleshooting

### Connection Issues
```bash
# Test connection directly
psql $POSTGRES_URL_NON_POOLING -c "SELECT version();"
```

### Permission Issues
- Ensure POSTGRES_URL_NON_POOLING is used for schema changes
- Use POSTGRES_URL for application queries

### Data Validation
```sql
-- Check row counts
SELECT 'searches' as table_name, COUNT(*) as count FROM searches
UNION ALL
SELECT 'images', COUNT(*) FROM images
UNION ALL
SELECT 'votes', COUNT(*) FROM votes
UNION ALL
SELECT 'have_votes', COUNT(*) FROM have_votes;
```

## Next Steps

1. Update `lib/db.js` to use Vercel Postgres
2. Test all API endpoints
3. Setup monitoring for the new database
4. Plan production cutover strategy