-- Enable net and pg_cron extensions if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_net;
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Unschedule if it exists to replace it
SELECT cron.unschedule('odoo-polling-cron');

-- Schedule the cron job to run every 5 minutes
SELECT cron.schedule(
  'odoo-polling-cron',
  '*/5 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://bqfkqnnostzaqueujdms.supabase.co/functions/v1/odoo-polling',
    headers := '{"Content-Type": "application/json"}'::jsonb
  );
  $$
);
