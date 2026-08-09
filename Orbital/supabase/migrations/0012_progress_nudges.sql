-- send-progress-nudges (below) reads habits/habit_logs as service_role — neither
-- table has that grant yet (only tasks/goals/milestones got it in 0003).
grant select on public.habits, public.habit_logs to service_role;

-- Periodic "you've still got stuff to do" nudge: unlike the once-daily digest
-- (send-daily-reminders), this checks in several times during the day and only
-- fires when something is genuinely still outstanding. No new opt-in — matches
-- send-daily-reminders' existing precedent of firing for anyone with push enabled.
-- Fixed UTC hours, no per-user timezone handling (v1, same simplification as
-- the daily digest) — roughly 9am/12pm/3pm/6pm Eastern.
select cron.schedule(
  'progress-nudges',
  '0 13,16,19,22 * * *',
  $$
  select net.http_post(
    url := 'https://nzekuszwophatjzbkeej.supabase.co/functions/v1/send-progress-nudges',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-cron-secret', (select decrypted_secret from vault.decrypted_secrets where name = 'cron_secret')
    ),
    body := '{}'::jsonb
  );
  $$
);
