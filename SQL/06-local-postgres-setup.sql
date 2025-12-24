-- GroupRide App - Local PostgreSQL Setup with PostgREST
-- This script sets up the database for local PostgreSQL (without Supabase-specific features)

-- ==============================================
-- 1. CREATE TABLES
-- ==============================================

-- Create events table
CREATE TABLE IF NOT EXISTS events (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    date DATE NOT NULL,
    time TIME NOT NULL,
    password_hash TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create cars table
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

-- Create ride requests table
CREATE TABLE IF NOT EXISTS ride_requests (
    id SERIAL PRIMARY KEY,
    event_id TEXT REFERENCES events(id) ON DELETE CASCADE,
    contact_name TEXT NOT NULL,
    contact_phone TEXT,
    notes TEXT,
    pickup_address TEXT,
    dropoff_address TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create ride request passengers table
CREATE TABLE IF NOT EXISTS ride_request_passengers (
    id SERIAL PRIMARY KEY,
    request_id INTEGER REFERENCES ride_requests(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'waiting',
    assigned_car_id INTEGER REFERENCES cars(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create passengers table
CREATE TABLE IF NOT EXISTS passengers (
    id SERIAL PRIMARY KEY,
    car_id INTEGER REFERENCES cars(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    seat_index INTEGER NOT NULL,
    request_passenger_id INTEGER REFERENCES ride_request_passengers(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==============================================
-- 2. CREATE CLEANUP FUNCTIONS
-- ==============================================

-- Function to clean up events that are 24+ hours past their scheduled time
CREATE OR REPLACE FUNCTION cleanup_expired_events_simple()
RETURNS TABLE(deleted_count bigint)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    deleted_count bigint;
BEGIN
    -- Delete events where the event date + time + 24 hours is in the past
    WITH deleted AS (
        DELETE FROM events 
        WHERE (date + time + INTERVAL '24 hours') < NOW()
        RETURNING id
    )
    SELECT COUNT(*) INTO deleted_count FROM deleted;
    
    -- Return the count of deleted events
    RETURN QUERY SELECT deleted_count;
END;
$$;

-- ==============================================
-- 3. SETUP POSTGREST ACCESS (ANON ROLE)
-- ==============================================

-- Create anon role for PostgREST
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'groupride_anon') THEN
        CREATE ROLE groupride_anon NOLOGIN;
    END IF;
END
$$;

-- Grant usage on schema
GRANT USAGE ON SCHEMA public TO groupride_anon;

-- Grant select, insert, update, delete on all tables
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO groupride_anon;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO groupride_anon;

-- Grant execute on functions
GRANT EXECUTE ON FUNCTION cleanup_expired_events_simple() TO groupride_anon;

-- Set default privileges for future tables
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO groupride_anon;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE, SELECT ON SEQUENCES TO groupride_anon;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT EXECUTE ON FUNCTIONS TO groupride_anon;

-- ==============================================
-- 4. CREATE INDEXES FOR PERFORMANCE
-- ==============================================

CREATE INDEX IF NOT EXISTS idx_cars_event_id ON cars(event_id);
CREATE INDEX IF NOT EXISTS idx_passengers_car_id ON passengers(car_id);
CREATE INDEX IF NOT EXISTS idx_ride_requests_event_id ON ride_requests(event_id);
CREATE INDEX IF NOT EXISTS idx_ride_request_passengers_request_id ON ride_request_passengers(request_id);
CREATE INDEX IF NOT EXISTS idx_ride_request_passengers_assigned_car_id ON ride_request_passengers(assigned_car_id);

-- ==============================================
-- 5. VERIFICATION
-- ==============================================

SELECT 'Local PostgreSQL setup completed successfully!' as status;

