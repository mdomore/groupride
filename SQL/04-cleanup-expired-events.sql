-- Function to clean up events that are 24+ hours past their scheduled time
CREATE OR REPLACE FUNCTION cleanup_expired_events()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
    -- Delete events where the event date + time + 24 hours is in the past
    DELETE FROM events 
    WHERE (date + time + INTERVAL '24 hours') < NOW();
    
    -- Log how many events were deleted (optional)
    RAISE NOTICE 'Cleaned up expired events at %', NOW();
END;
$$;

-- Create a scheduled job to run this function every hour
-- Note: This requires pg_cron extension to be enabled
-- You may need to enable it in your Supabase dashboard first

-- Enable pg_cron extension (run this first if not already enabled)
-- CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule the cleanup to run every hour
-- SELECT cron.schedule('cleanup-expired-events', '0 * * * *', 'SELECT cleanup_expired_events();');

-- Alternative: Create a simpler version that can be called manually or via API
-- This function can be called from your app or a webhook
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
