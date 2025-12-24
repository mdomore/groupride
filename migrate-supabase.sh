#!/bin/bash
# Migration script to set up GroupRide schema on Supabase database
# This script waits for Supabase to be ready, then runs the SQL migrations

set -e

echo "Waiting for Supabase database to be ready..."
until docker exec supabase-db pg_isready -U postgres > /dev/null 2>&1; do
  echo "Database not ready, waiting..."
  sleep 2
done

echo "Database is ready. Running migrations..."

# Run migrations in order
for sql_file in SQL/01-create-tables.sql SQL/02-cleanup-functions.sql SQL/07-add-event-password.sql; do
  if [ -f "$sql_file" ]; then
    echo "Running $sql_file..."
    docker exec -i supabase-db psql -U postgres -d postgres < "$sql_file"
  fi
done

echo "Migrations completed successfully!"

