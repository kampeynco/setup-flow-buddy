-- Enable the pg_cron extension for scheduled tasks (if not already enabled)
-- Note: This may need to be enabled manually in the Supabase dashboard if not already available

-- Create a cron job to run monthly usage billing daily (to catch any missed billing cycles)
-- This will run every day at 2 AM UTC to process any due billing cycles
SELECT cron.schedule(
  'monthly-usage-billing',
  '0 2 * * *', -- Daily at 2 AM UTC
  $$
  SELECT
    net.http_post(
        url:='https://qnsodkdsjfrfjahnczwn.supabase.co/functions/v1/process-monthly-usage-billing',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFuc29ka2RzamZyZmphaG5jenduIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzg0Njk1NzEsImV4cCI6MjA1NDA0NTU3MX0.mAuJewlJ4ikZ_tyUExpzbsNk_buHKdEtRec87mFHJRE"}'::jsonb,
        body:='{"scheduled": true}'::jsonb
    ) as request_id;
  $$
);