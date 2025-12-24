-- Add password_hash column to events table
ALTER TABLE events ADD COLUMN IF NOT EXISTS password_hash TEXT;

-- Reload schema cache (optional, but good practice for PostgREST)
NOTIFY pgrst, 'reload config';

