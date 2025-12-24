# Migration Summary: PostgreSQL + PostgREST → Supabase

## What Changed

### Removed Services
- ❌ `postgres` (standalone PostgreSQL container)
- ❌ `postgrest` (standalone PostgREST container)

### Added Services
- ✅ `db` (Supabase PostgreSQL with extensions)
- ✅ `kong` (API Gateway - routes to all Supabase services)
- ✅ `rest` (PostgREST - via Kong)
- ✅ `auth` (GoTrue - authentication service)
- ✅ `realtime` (Realtime subscriptions)
- ✅ `meta` (Postgres Meta - for Studio)
- ✅ `studio` (Supabase Studio - database management UI)

## Configuration Changes

### docker-compose.yml
- Integrated all Supabase services
- Removed old PostgreSQL and PostgREST services
- Updated network configuration
- Added volume for Supabase database

### nginx.conf
- Updated to proxy to Kong Gateway instead of direct PostgREST
- Added `/realtime/v1/` proxy for realtime subscriptions
- Improved Authorization header handling

### supabase.js
- Added missing `import` statement
- Updated comments to reflect Supabase usage

## Benefits

1. **Full Supabase Feature Set**: Auth, Realtime, Storage (if needed)
2. **Better API Gateway**: Kong handles routing, CORS, rate limiting
3. **Database Management UI**: Supabase Studio for easy database management
4. **Consistent with Supabase Cloud**: Same API, easy to migrate to/from cloud
5. **Better Security**: Built-in JWT handling, role-based access

## Migration Steps

1. **Stop old services** (if running):
   ```bash
   docker compose down postgres postgrest
   ```

2. **Start Supabase**:
   ```bash
   docker compose up -d
   ```

3. **Run database migrations**:
   ```bash
   ./migrate-supabase.sh
   ```

4. **Verify setup**:
   - Check Supabase Studio: http://localhost:3000
   - Test frontend: http://localhost:8001
   - Check Kong Gateway: http://localhost:8000

## Data Migration

If you have existing data in the old PostgreSQL:

1. **Export from old database**:
   ```bash
   docker exec -it groupride-postgres pg_dump -U groupride groupride > backup.sql
   ```

2. **Import to Supabase**:
   ```bash
   docker exec -i supabase-db psql -U postgres -d postgres < backup.sql
   ```

## API Endpoints

All API calls now go through Kong Gateway at `http://localhost:8000`:

- `/rest/v1/*` → PostgREST (database queries)
- `/auth/v1/*` → GoTrue (authentication)
- `/realtime/v1/*` → Realtime (subscriptions)

The frontend automatically uses these endpoints via the Supabase JS client.

## Troubleshooting

See `SUPABASE-SETUP.md` for detailed troubleshooting steps.

