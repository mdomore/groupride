-- GroupRide App Scheduled Cleanup (Optional)
-- This requires pg_cron extension to be enabled in Supabase
-- Run this SQL only if you want automatic hourly cleanup

-- Enable pg_cron extension (run this first if not already enabled)
-- Note: This may require enabling the extension in your Supabase dashboard
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule the cleanup to run every hour at minute 0
-- This will automatically clean up expired events every hour
SELECT cron.schedule(
    'cleanup-expired-events', 
    '0 * * * *', 
    'SELECT cleanup_expired_events();'
);

-- To view scheduled jobs:
-- SELECT * FROM cron.job;

-- To remove the scheduled job:
-- SELECT cron.unschedule('cleanup-expired-events');

-- Alternative: Schedule cleanup every 6 hours instead of every hour
-- SELECT cron.schedule(
--     'cleanup-expired-events-6h', 
--     '0 */6 * * *', 
--     'SELECT cleanup_expired_events();'
-- );
