-- GroupRide App Complete Database Setup
-- WARNING: This script DROPS existing tables before recreating them.
-- Only run this when you want a clean reset of the database schema and data.

-- ==============================================
-- 1. DROP EXISTING TABLES (with confirmation)
-- ==============================================

DO $$
BEGIN
    RAISE NOTICE 'Dropping existing GroupRide tables...';
END $$;

DROP TABLE IF EXISTS passengers CASCADE;
DROP TABLE IF EXISTS ride_request_passengers CASCADE;
DROP TABLE IF EXISTS ride_requests CASCADE;
DROP TABLE IF EXISTS cars CASCADE;
DROP TABLE IF EXISTS events CASCADE;

-- ==============================================
-- 2. CREATE TABLES FROM SCRATCH
-- ==============================================

-- Create events table
CREATE TABLE events (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    date DATE NOT NULL,
    time TIME NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create cars table
CREATE TABLE cars (
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
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create ride requests table
CREATE TABLE ride_requests (
    id SERIAL PRIMARY KEY,
    event_id TEXT REFERENCES events(id) ON DELETE CASCADE,
    contact_name TEXT NOT NULL,
    contact_phone TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create riders table linked to requests
CREATE TABLE ride_request_passengers (
    id SERIAL PRIMARY KEY,
    request_id INTEGER REFERENCES ride_requests(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'waiting',
    assigned_car_id INTEGER REFERENCES cars(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create passengers table
CREATE TABLE passengers (
    id SERIAL PRIMARY KEY,
    car_id INTEGER REFERENCES cars(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    seat_index INTEGER NOT NULL,
    request_passenger_id INTEGER REFERENCES ride_request_passengers(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==============================================
-- 3. ENABLE ROW LEVEL SECURITY
-- ==============================================

ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE cars ENABLE ROW LEVEL SECURITY;
ALTER TABLE passengers ENABLE ROW LEVEL SECURITY;
ALTER TABLE ride_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE ride_request_passengers ENABLE ROW LEVEL SECURITY;

-- ==============================================
-- 4. CREATE POLICIES
-- ==============================================

CREATE POLICY "Allow all operations on events" ON events FOR ALL USING (true);
CREATE POLICY "Allow all operations on cars" ON cars FOR ALL USING (true);
CREATE POLICY "Allow all operations on passengers" ON passengers FOR ALL USING (true);
CREATE POLICY "Allow all operations on ride_requests" ON ride_requests FOR ALL USING (true);
CREATE POLICY "Allow all operations on ride_request_passengers" ON ride_request_passengers FOR ALL USING (true);

-- ==============================================
-- 5. CREATE CLEANUP FUNCTIONS
-- ==============================================

-- Function to clean up events that are 24+ hours past their scheduled time
CREATE OR REPLACE FUNCTION cleanup_expired_events_simple()
RETURNS TABLE(deleted_count bigint)
LANGUAGE plpgsql
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

-- Alternative function for manual cleanup (more detailed logging)
CREATE OR REPLACE FUNCTION cleanup_expired_events()
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
    deleted_count integer;
BEGIN
    -- Delete events where the event date + time + 24 hours is in the past
    WITH deleted AS (
        DELETE FROM events 
        WHERE (date + time + INTERVAL '24 hours') < NOW()
        RETURNING id
    )
    SELECT COUNT(*) INTO deleted_count FROM deleted;
    
    -- Log how many events were deleted
    RAISE NOTICE 'Cleaned up % expired events at %', deleted_count, NOW();
END;
$$;

-- Function to get expired events count (for monitoring)
CREATE OR REPLACE FUNCTION get_expired_events_count()
RETURNS TABLE(expired_count bigint)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY 
    SELECT COUNT(*) as expired_count
    FROM events 
    WHERE (date + time + INTERVAL '24 hours') < NOW();
END;
$$;

-- ==============================================
-- 6. VERIFICATION
-- ==============================================

-- Test the cleanup function (should return 0 for new database)
SELECT 'Cleanup function test:' as test, * FROM cleanup_expired_events_simple();

-- Show table structure
SELECT 'Tables created successfully!' as status;
