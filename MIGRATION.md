# Migration Guide: Supabase Cloud → Local PostgreSQL

This guide explains how to migrate your GroupRide app from Supabase Cloud to a local PostgreSQL database.

## Why Migrate?

- **Full Control**: Your data stays on your server
- **No Cloud Costs**: No dependency on external services
- **Privacy**: Data never leaves your infrastructure
- **Customization**: Full PostgreSQL access for custom features

## Prerequisites

- Docker and Docker Compose installed
- Node.js and npm installed
- Access to your Supabase project (for data export)

## Step-by-Step Migration

### 1. Start Local PostgreSQL

First, start the PostgreSQL and PostgREST services:

```bash
docker compose up -d postgres postgrest
```

**Note**: PostgreSQL runs on port **5434** externally (to avoid conflicts with other PostgreSQL instances). The internal container port remains 5432.

This will:
- Start PostgreSQL on `localhost:5432`
- Start PostgREST API on `localhost:3001`
- Automatically run the database setup script

### 2. Verify Database Setup

Check that the database is ready:

```bash
docker compose logs postgres
```

You should see messages indicating the database is initialized.

### 3. Migrate Your Data

Run the migration script to copy all data from Supabase:

```bash
node migrate-from-supabase.js
```

This script will:
- Connect to your Supabase project
- Export all events, cars, passengers, and ride requests
- Import everything into local PostgreSQL

**Note**: Make sure your Supabase credentials are set in environment variables or the script will use the defaults.

### 4. Update Application Configuration

Create or update your `.env` file (or set environment variables):

```bash
# For local PostgreSQL
VITE_SUPABASE_URL=http://localhost:3001
VITE_SUPABASE_ANON_KEY=local_postgrest_key
```

### 5. Rebuild and Restart Application

Rebuild the application with the new configuration:

```bash
docker compose down
docker compose build
docker compose up -d
```

### 6. Verify Migration

1. Open your application in a browser
2. Check that existing events are visible
3. Try creating a new event
4. Verify all features work correctly

## Switching Back to Supabase

If you need to switch back to Supabase Cloud:

1. Update `.env`:
   ```bash
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your_anon_key
   ```

2. Rebuild and restart:
   ```bash
   docker compose build
   docker compose up -d
   ```

## Database Management

### Access PostgreSQL Directly

```bash
# Via Docker
docker compose exec postgres psql -U groupride -d groupride

# Or directly from host (port 5434)
psql -h localhost -p 5434 -U groupride -d groupride
```

### Backup Database

```bash
# Via Docker
docker compose exec postgres pg_dump -U groupride groupride > backup.sql

# Or directly from host
pg_dump -h localhost -p 5434 -U groupride groupride > backup.sql
```

### Restore Database

```bash
# Via Docker
docker compose exec -T postgres psql -U groupride groupride < backup.sql

# Or directly from host
psql -h localhost -p 5434 -U groupride groupride < backup.sql
```

### View Logs

```bash
docker compose logs -f postgres
docker compose logs -f postgrest
```

## Security Notes

⚠️ **Important**: The default PostgreSQL password is `groupride_password_change_me`. 

**Change it before production:**

1. Update `docker-compose.prod.yml`:
   ```yaml
   environment:
     POSTGRES_PASSWORD: your_secure_password_here
   ```

2. Update PostgREST connection:
   ```yaml
   PGRST_DB_URI: postgres://groupride:your_secure_password_here@postgres:5432/groupride
   ```

3. Restart services:
   ```bash
   docker compose down -v
   docker compose up -d
   ```

## Troubleshooting

### PostgREST Connection Errors

If PostgREST can't connect to PostgreSQL:
1. Check PostgreSQL is running: `docker compose ps postgres`
2. Check logs: `docker compose logs postgres`
3. Verify password matches in both services
4. Note: PostgREST connects to PostgreSQL internally (port 5432), not externally (port 5434)

### Migration Script Fails

1. Verify Supabase credentials are correct
2. Check network connectivity to Supabase
3. Ensure local PostgreSQL is running
4. Check migration script logs for specific errors

### Application Can't Connect

1. Verify PostgREST is running: `docker compose ps postgrest`
2. Check PostgREST logs: `docker compose logs postgrest`
3. Verify `VITE_SUPABASE_URL` points to `http://localhost:3000`
4. Check browser console for CORS errors (PostgREST should handle this)

## Architecture

```
┌─────────────┐
│   Browser   │
│  (Frontend) │
└──────┬──────┘
       │ HTTP
       │
┌──────▼──────┐
│  PostgREST  │  ← REST API (Supabase-compatible)
│  (Port 3001)│
└──────┬──────┘
       │ SQL
       │
┌──────▼──────┐
│ PostgreSQL  │  ← Database
│  (Port 5432)│
└─────────────┘
```

## Next Steps

- Set up automated backups
- Configure SSL/TLS for production
- Add monitoring and logging
- Consider read replicas for scaling

