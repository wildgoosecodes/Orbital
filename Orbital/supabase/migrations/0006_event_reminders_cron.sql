-- Timed event reminders: scheduled call into the send-event-reminders Edge Function,
-- checked frequently since (unlike the once-daily digest) a reminder needs to fire
-- close to its actual due moment. Reuses the same cron_secret vault entry and
-- pg_cron/pg_net extensions 0003_push_subscriptions.sql already set up.
select cron.schedule(
  'event-reminders',
  '*/5 * * * *',
  $$
  select net.http_post(
    url := 'https://nzekuszwophatjzbkeej.supabase.co/functions/v1/send-event-reminders',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-cron-secret', (select decrypted_secret from vault.decrypted_secrets where name = 'cron_secret')
    ),
    body := '{}'::jsonb
  );
  $$
);
