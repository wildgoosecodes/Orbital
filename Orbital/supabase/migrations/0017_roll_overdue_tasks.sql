-- roll-overdue-tasks: the first "proactive" agent action — no chat turn involved.
-- Runs daily, before the daily-reminders digest (13:00 UTC), so any task whose
-- due_date has slipped into the past gets pulled forward to today and shows up
-- in that digest instead of silently rotting off-screen. Only touches incomplete
-- tasks (status != 'done'); never mutates a task that's already finished.
grant update on public.tasks to service_role;

select cron.schedule(
  'roll-overdue-tasks',
  '0 11 * * *', -- fixed UTC time for all users (v1 has no per-user timezone handling, same as the other cron jobs)
  $$
  select net.http_post(
    url := 'https://nzekuszwophatjzbkeej.supabase.co/functions/v1/roll-overdue-tasks',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-cron-secret', (select decrypted_secret from vault.decrypted_secrets where name = 'cron_secret')
    ),
    body := '{}'::jsonb
  );
  $$
);
