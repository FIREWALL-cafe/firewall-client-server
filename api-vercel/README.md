# Firewall Cafe API - Vercel Serverless Functions

This is the Vercel serverless functions version of the Firewall Cafe API, migrated from the Express.js server.

## Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Environment Variables
Copy `.env.example` to `.env.local` and fill in your values:
```bash
cp .env.example .env.local
```

Required environment variables:
- `DATABASE_URL` - PostgreSQL connection string
- `API_SECRET` - Secret key for authenticated endpoints
- `DIGITAL_OCEAN_SPACES_KEY` - Digital Ocean Spaces access key
- `DIGITAL_OCEAN_SPACES_SECRET` - Digital Ocean Spaces secret key

### 3. Local Development
```bash
npm run dev
```

This will start the Vercel development server at `http://localhost:3000`

### 4. Test the API
```bash
# Health check
curl http://localhost:3000/api/health

# Basic info
curl http://localhost:3000/api

# Dashboard data
curl http://localhost:3000/api/dashboard

# Searches
curl http://localhost:3000/api/searches?page=1&page_size=10
```

## Deployment

### 1. Install Vercel CLI
```bash
npm install -g vercel
```

### 2. Login to Vercel
```bash
vercel login
```

### 3. Set Environment Variables
```bash
vercel env add DATABASE_URL
vercel env add API_SECRET
# ... add other environment variables
```

### 4. Deploy
```bash
npm run deploy
```

## API Endpoints

### Health & Info
- `GET /api` - Basic API information
- `GET /api/health` - Health check with database connectivity test

### Dashboard
- `GET /api/dashboard` - Dashboard statistics

### Searches
- `GET /api/searches` - Get all searches (paginated)
- `GET /api/searches/[search_id]` - Get specific search (TODO)
- `GET /api/searches/filter` - Filter searches (TODO)

### Images (TODO)
- `GET /api/images` - Get all images
- `GET /api/images/[image_id]` - Get specific image

### Votes (TODO)
- `GET /api/votes` - Get all votes
- `POST /api/votes` - Create vote

## Migration Status

### ✅ Completed
- [x] Project structure setup
- [x] Database connection with serverless pooling
- [x] CORS and authentication middleware
- [x] Basic health check endpoint
- [x] Dashboard endpoint
- [x] Basic searches endpoint
- [x] Environment variables configuration

### 🚧 In Progress
- [ ] All read-only endpoints migration
- [ ] Authentication for protected endpoints
- [ ] File upload handling
- [ ] Worker thread refactoring

### ⏳ Todo
- [ ] Write operation endpoints (POST/PUT)
- [ ] Image processing functions
- [ ] Error handling and logging
- [ ] Performance optimization
- [ ] Load testing

## Differences from Express Version

1. **Serverless Architecture** - Each endpoint is a separate function
2. **Connection Pooling** - Optimized for serverless with single connections
3. **File Structure** - API endpoints organized in `/api` directory
4. **Environment** - Uses Vercel's environment variable system
5. **CORS** - Handled via middleware wrapper functions

## Development Notes

- Each function has a 10-second timeout (30s max on Pro plan)
- Database connections are pooled with max 1 connection per function
- File uploads will need to use Vercel Blob or external storage
- Worker threads have been replaced with async/await patterns

## Troubleshooting

### Database Connection Issues
1. Check `DATABASE_URL` environment variable
2. Ensure database accepts connections from Vercel IPs
3. Check network settings and SSL configuration

### Function Timeouts
1. Optimize database queries
2. Add proper indexing
3. Consider breaking large operations into smaller functions

### CORS Issues
1. Check `vercel.json` headers configuration
2. Ensure middleware is properly applied
3. Test with different request methods