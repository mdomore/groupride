# Supabase Local Setup Guide

This guide explains how to set up and run GroupRide with a local dockerized Supabase instance.

## Prerequisites

- Docker and Docker Compose installed
- At least 4GB of available RAM (Supabase services require resources)

## Quick Start

### 1. Environment Configuration

Create a `.env` file in the project root (or use the defaults in `supabase/env.supabase`):

```bash
# Postgres
POSTGRES_PASSWORD=your-super-secret-and-long-postgres-password

# JWT
JWT_SECRET=super-secret-jwt-token-with-at-least-32-characters-long
JWT_EXPIRY=3600

# Supabase Public URL (where your app is accessible)
SUPABASE_PUBLIC_URL=http://localhost:8000

# API Keys (generate these or use the defaults)
ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImlzcyI6InN1cGFiYXNlIiwiaWF0IjoxNzY2NDAxMjQzLCJleHAiOjQ5MjAwMDEyNDN9.78P6V5-MMzcpeshykLDxnkK3FVWMc7obVqxX5JcXn40
SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoic2VydmljZV9yb2xlIiwiaXNzIjoic3VwYWJhc2UiLCJpYXQiOjE3NjY0MDEyNDMsImV4cCI6NDkyMDAwMTI0M30.6-hsvUb01GLHUoI2ivJ8-_S1hyc3B0Uu1zLQEqI066k

# Kong Gateway
KONG_HTTP_PORT=8000
KONG_HTTPS_PORT=8443

# Studio
STUDIO_PORT=3000
```

### 2. Start All Services

```bash
# Start Supabase and application services
docker compose up -d

# Check service status
docker compose ps

# View logs
docker compose logs -f
```

### 3. Initialize Database Schema

After Supabase services are running, run the migration script:

```bash
# Run the migration script (waits for DB to be ready, then runs all migrations)
./migrate-supabase.sh
```

Or run migrations manually:

```bash
# Wait for database to be ready
docker compose ps db

# Run migrations in order
docker exec -i supabase-db psql -U postgres -d postgres < SQL/01-create-tables.sql
docker exec -i supabase-db psql -U postgres -d postgres < SQL/02-cleanup-functions.sql
docker exec -i supabase-db psql -U postgres -d postgres < SQL/07-add-event-password.sql
```

### 4. Access Services

- **Frontend App**: http://localhost:8001
- **Supabase Studio** (Database UI): http://localhost:3000
- **Kong API Gateway**: http://localhost:8000
- **Backend API**: http://localhost:8002

### 5. Verify Setup

1. Open Supabase Studio at http://localhost:3000
2. Check that tables are created (events, cars, passengers, etc.)
3. Test the frontend at http://localhost:8001
4. Try creating an event to verify database connectivity

## Service Architecture

```
┌─────────────────────────────────────────┐
│         Frontend (Nginx)                │
│         Port: 8001                       │
└──────────────┬──────────────────────────┘
               │
               ├──> /rest/v1/* → Kong → PostgREST
               ├──> /auth/v1/* → Kong → GoTrue
               └──> /api/* → FastAPI Backend
                        │
                        └──> Kong → PostgREST
                                 │
                                 └──> PostgreSQL (Supabase DB)
```

## Troubleshooting

### Database not initializing

```bash
# Check database logs
docker compose logs db

# Check if migrations ran
docker exec -it supabase-db psql -U postgres -d postgres -c "\dt"
```

### Kong Gateway not routing

```bash
# Check Kong logs
docker compose logs kong

# Verify Kong configuration
docker exec -it supabase-kong cat /var/lib/kong/kong.yml
```

### Services can't connect to database

```bash
# Verify network connectivity
docker network inspect groupride_groupride-network

# Check database is healthy
docker compose ps db
```

### Reset Everything

```bash
# Stop all services
docker compose down

# Remove volumes (WARNING: This deletes all data!)
docker volume rm groupride_supabase_db_data

# Start fresh
docker compose up -d
```

## Migration from Old Setup

If you were using the old PostgreSQL + PostgREST setup:

1. **Export data** (if needed):
   ```bash
   docker exec -it groupride-postgres pg_dump -U groupride groupride > backup.sql
   ```

2. **Stop old services**:
   ```bash
   docker compose down postgres postgrest
   ```

3. **Start Supabase**:
   ```bash
   docker compose up -d
   ```

4. **Import data** (if needed):
   ```bash
   docker exec -i supabase-db psql -U postgres -d postgres < backup.sql
   ```

## Security Notes

- Change default passwords in production
- Use strong JWT secrets (at least 32 characters)
- Restrict network access (services are currently bound to localhost)
- Regularly backup the database volume

