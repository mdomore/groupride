-- Add password field to events table for edit protection
-- This allows event creators to optionally set a password to protect event editing

-- Add password column to events table (optional, can be NULL)
ALTER TABLE events ADD COLUMN IF NOT EXISTS password_hash TEXT;

-- Note: password_hash stores a hashed version of the password
-- If NULL, the event can be edited without a password
-- If set, the password must be provided to edit the event

