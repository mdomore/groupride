# Supabase Setup for GroupRide App

## 1. Create Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Sign up/Login and create a new project
3. Choose a region close to your users
4. Note down your project URL and API key

## 2. Database Schema

Pick the path that matches your situation:

- **Brand-new project / full reset**: run `SQL/00-complete-setup.sql`. It drops any existing GroupRide tables, recreates the latest schema (including ride waitlists and car PIN support), and installs the cleanup helpers in one go.
- **Existing project**: run `SQL/01-create-tables.sql` followed by `SQL/02-cleanup-functions.sql`. The table script is idempotent—it creates missing tables/columns and updates policies without touching existing data. Add `SQL/03-scheduled-cleanup.sql` only if you want the optional cron job.

## 3. Environment Variables

Create a `.env` file in your project root:

```
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## 4. Install Dependencies

```bash
npm install @supabase/supabase-js
```

## 5. Update Your App

The app will be updated to use Supabase instead of localStorage.
