-- GroupRide Database Initialization
-- This script runs automatically when Supabase database starts for the first time
-- It sets up the GroupRide schema and tables

-- Ensure we're using the public schema
SET search_path TO public;

-- Create events table (safe)
CREATE TABLE IF NOT EXISTS events (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    date DATE NOT NULL,
    time TIME NOT NULL,
    password_hash TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ensure description and password_hash columns exist (handles older schemas)
ALTER TABLE events ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE events ADD COLUMN IF NOT EXISTS password_hash TEXT;

-- Create cars table (safe)
CREATE TABLE IF NOT EXISTS cars (
    id SERIAL PRIMARY KEY,
    event_id TEXT REFERENCES events(id) ON DELETE CASCADE,
    driver_name TEXT NOT NULL,
    driver_phone TEXT,
    driver_email TEXT,
    car_model TEXT NOT NULL,
    available_seats INTEGER NOT NULL,
    occupied_seats INTEGER DEFAULT 0,
    requires_pin BOOLEAN DEFAULT false,
    car_pin TEXT,
    pickup_address TEXT,
    dropoff_address TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ensure optional car columns exist (handles older schemas)
ALTER TABLE cars ADD COLUMN IF NOT EXISTS driver_phone TEXT;
ALTER TABLE cars ADD COLUMN IF NOT EXISTS driver_email TEXT;
ALTER TABLE cars ADD COLUMN IF NOT EXISTS requires_pin BOOLEAN DEFAULT false;
ALTER TABLE cars ADD COLUMN IF NOT EXISTS car_pin TEXT;
ALTER TABLE cars ADD COLUMN IF NOT EXISTS pickup_address TEXT;
ALTER TABLE cars ADD COLUMN IF NOT EXISTS dropoff_address TEXT;
ALTER TABLE cars ALTER COLUMN requires_pin SET DEFAULT false;
UPDATE cars SET requires_pin = false WHERE requires_pin IS NULL;

-- Create ride requests table (safe)
CREATE TABLE IF NOT EXISTS ride_requests (
    id SERIAL PRIMARY KEY,
    event_id TEXT REFERENCES events(id) ON DELETE CASCADE,
    contact_name TEXT,
    contact_phone TEXT,
    pickup_address TEXT,
    dropoff_address TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Migrate older ride_requests columns if needed
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'ride_requests' AND column_name = 'rider_name'
    ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'ride_requests' AND column_name = 'contact_name'
    ) THEN
        ALTER TABLE ride_requests RENAME COLUMN rider_name TO contact_name;
    END IF;
EXCEPTION
    WHEN duplicate_column THEN NULL;
END $$;

ALTER TABLE ride_requests ADD COLUMN IF NOT EXISTS contact_name TEXT;
ALTER TABLE ride_requests ADD COLUMN IF NOT EXISTS contact_phone TEXT;
ALTER TABLE ride_requests ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE ride_requests ADD COLUMN IF NOT EXISTS pickup_address TEXT;
ALTER TABLE ride_requests ADD COLUMN IF NOT EXISTS dropoff_address TEXT;

-- Remove deprecated columns if they still exist
ALTER TABLE ride_requests DROP COLUMN IF EXISTS preferred_car_id;
ALTER TABLE ride_requests DROP COLUMN IF EXISTS party_size;

-- Create ride request passengers table (safe)
CREATE TABLE IF NOT EXISTS ride_request_passengers (
    id SERIAL PRIMARY KEY,
    request_id INTEGER REFERENCES ride_requests(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'waiting',
    assigned_car_id INTEGER REFERENCES cars(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create passengers table (safe)
CREATE TABLE IF NOT EXISTS passengers (
    id SERIAL PRIMARY KEY,
    car_id INTEGER REFERENCES cars(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    seat_index INTEGER NOT NULL,
    request_passenger_id INTEGER REFERENCES ride_request_passengers(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE passengers ADD COLUMN IF NOT EXISTS request_passenger_id INTEGER;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'passengers_request_passenger_id_fkey'
    ) THEN
        ALTER TABLE passengers
        ADD CONSTRAINT passengers_request_passenger_id_fkey
        FOREIGN KEY (request_passenger_id) REFERENCES ride_request_passengers(id) ON DELETE SET NULL;
    END IF;
END $$;

-- Enable Row Level Security (idempotent)
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE cars ENABLE ROW LEVEL SECURITY;
ALTER TABLE passengers ENABLE ROW LEVEL SECURITY;
ALTER TABLE ride_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE ride_request_passengers ENABLE ROW LEVEL SECURITY;

-- Helper to create policies only if they are missing
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'events' AND policyname = 'Allow all operations on events') THEN
        EXECUTE 'CREATE POLICY "Allow all operations on events" ON events FOR ALL USING (true)';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'cars' AND policyname = 'Allow all operations on cars') THEN
        EXECUTE 'CREATE POLICY "Allow all operations on cars" ON cars FOR ALL USING (true)';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'passengers' AND policyname = 'Allow all operations on passengers') THEN
        EXECUTE 'CREATE POLICY "Allow all operations on passengers" ON passengers FOR ALL USING (true)';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'ride_requests' AND policyname = 'Allow all operations on ride_requests') THEN
        EXECUTE 'CREATE POLICY "Allow all operations on ride_requests" ON ride_requests FOR ALL USING (true)';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'ride_request_passengers' AND policyname = 'Allow all operations on ride_request_passengers') THEN
        EXECUTE 'CREATE POLICY "Allow all operations on ride_request_passengers" ON ride_request_passengers FOR ALL USING (true)';
    END IF;
END $$;

-- Cleanup function for expired events
CREATE OR REPLACE FUNCTION cleanup_expired_events_simple()
RETURNS TABLE(deleted_count bigint) AS $$
DECLARE
    deleted_rows bigint;
BEGIN
    WITH deleted AS (
        DELETE FROM events
        WHERE (date < CURRENT_DATE) OR (date = CURRENT_DATE AND time < (CURRENT_TIME - INTERVAL '24 hours'))
        RETURNING 1
    )
    SELECT COUNT(*) INTO deleted_rows FROM deleted;

    RETURN QUERY SELECT deleted_rows;
END;
$$ LANGUAGE plpgsql;

