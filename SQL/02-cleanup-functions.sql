-- GroupRide App Cleanup Functions
-- Run this SQL in your Supabase SQL Editor to create cleanup functions

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
