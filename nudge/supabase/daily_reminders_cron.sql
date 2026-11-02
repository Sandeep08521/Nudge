-- Scheduled Daily Reminders via pg_cron & pg_net
-- Enable pg_cron and pg_net extensions in Supabase Dashboard (Database -> Extensions)

create extension if not exists pg_cron;
create extension if not exists pg_net;

-- Schedule daily job to run every morning at 08:00 UTC
-- Replace <YOUR_PROJECT_REF> and <YOUR_ANON_OR_SERVICE_ROLE_KEY>
select
  cron.schedule(
    'daily-subscription-renewal-check',
    '0 8 * * *', -- Every day at 08:00 UTC
    $$
    select
      net.http_post(
        url := 'https://<YOUR_PROJECT_REF>.supabase.co/functions/v1/send-reminders',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer <YOUR_ANON_OR_SERVICE_KEY>'
        ),
        body := '{}'::jsonb
      );
    $$
  );
