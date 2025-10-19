-- GroupRide App Complete Database Setup
-- Run this single file to set up everything at once
-- This combines all the individual setup files

-- ==============================================
-- 1. CREATE TABLES
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
    car_model TEXT NOT NULL,
    available_seats INTEGER NOT NULL,
    occupied_seats INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create passengers table
CREATE TABLE passengers (
    id SERIAL PRIMARY KEY,
    car_id INTEGER REFERENCES cars(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    seat_index INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==============================================
-- 2. ENABLE ROW LEVEL SECURITY
-- ==============================================

ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE cars ENABLE ROW LEVEL SECURITY;
ALTER TABLE passengers ENABLE ROW LEVEL SECURITY;

-- ==============================================
-- 3. CREATE POLICIES
-- ==============================================

-- Create policies (allow all operations for now - you can restrict later)
CREATE POLICY "Allow all operations on events" ON events FOR ALL USING (true);
CREATE POLICY "Allow all operations on cars" ON cars FOR ALL USING (true);
CREATE POLICY "Allow all operations on passengers" ON passengers FOR ALL USING (true);

-- ==============================================
-- 4. CREATE CLEANUP FUNCTIONS
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
-- 5. VERIFICATION
-- ==============================================

-- Test the cleanup function (should return 0 for new database)
SELECT 'Cleanup function test:' as test, * FROM cleanup_expired_events_simple();

-- Show table structure
SELECT 'Tables created successfully!' as status;
