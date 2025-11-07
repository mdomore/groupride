# GroupRide Database Setup

This directory contains all the SQL scripts needed to set up and maintain the GroupRide app database.

## Quick Setup

### 1. Initial Database Setup
You have two options depending on whether you want a clean slate or to patch an existing database:

- **Fresh install (wipes data)**: run `00-complete-setup.sql`. This script drops existing GroupRide tables, recreates the latest schema, and installs the cleanup functions.
- **Safe migration**: run `01-create-tables.sql` followed by `02-cleanup-functions.sql` (and optionally `03-scheduled-cleanup.sql`). The table script only creates missing tables/columns and adjusts policies so it can be re-run without losing data.

### 2. Manual Setup Steps

1. Go to [supabase.com](https://supabase.com)
2. Open your project dashboard
3. Navigate to **SQL Editor**
4. Run each SQL file in order
5. Verify tables are created in **Table Editor**

## File Descriptions

### `00-complete-setup.sql`
- Drops any existing GroupRide tables
- Recreates the full schema (events, cars, ride requests, passengers)
- Installs cleanup helpers
- Intended for brand-new or reset environments

### `01-create-tables.sql`
- Creates the main database schema if it does not exist
- Backfills newer columns (driver contact, car PIN, rider waitlist linkage)
- Renames/drops legacy ride request columns when required
- Ensures Row Level Security (RLS) and policies are present

### `02-cleanup-functions.sql`
- `cleanup_expired_events_simple()` - Main cleanup function used by the app
- `cleanup_expired_events()` - Alternative with detailed logging
- `get_expired_events_count()` - Monitoring function to check expired events

### `03-scheduled-cleanup.sql`
- Optional automatic cleanup using pg_cron
- Runs cleanup every hour automatically
- Requires pg_cron extension to be enabled

## Cleanup Behavior

Events are automatically cleaned up when:
- The app loads (startup cleanup)
- Any event is accessed (background cleanup)
- Manually via the cleanup functions

**Cleanup Rule**: Events are deleted 24 hours after their scheduled date + time.

## Monitoring

Check cleanup activity:
```sql
-- See how many events are currently expired
SELECT * FROM get_expired_events_count();

-- View all events (for debugging)
SELECT * FROM events ORDER BY created_at DESC;

-- Check scheduled jobs (if using pg_cron)
SELECT * FROM cron.job;
```

## Troubleshooting

### Common Issues:
1. **"Function not found"** - Make sure you ran `02-cleanup-functions.sql`
2. **"Table not found"** - Make sure you ran `01-create-tables.sql`
3. **"Permission denied"** - Check RLS policies are set correctly

### Reset Database:
If you need to start over, run `00-complete-setup.sql` (it will drop and recreate all tables). This is safer than manually dropping tables because it replays the full schema and policies in one go.
