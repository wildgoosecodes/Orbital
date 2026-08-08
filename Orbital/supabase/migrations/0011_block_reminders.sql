-- Global opt-in for the block notification engine — separate from the push-enable
-- bell (NotificationToggle), which controls the browser subscription itself. A user
-- can be subscribed to push in general but still have block reminders off.
alter table profiles add column block_reminders_enabled boolean not null default false;

-- Three independent stamps so each of the three lifecycle triggers fires at most
-- once per block, mirroring events.reminder_sent_at.
alter table time_blocks add column transition_warning_sent_at timestamptz;
alter table time_blocks add column start_checkin_sent_at timestamptz;
alter table time_blocks add column end_review_sent_at timestamptz;

-- send-block-reminders runs as service_role (cron-triggered, no per-user JWT),
-- which bypasses RLS but still needs these explicit grants — same gotcha
-- documented in 0003_push_subscriptions.sql for send-daily-reminders.
grant select, update on public.time_blocks to service_role;
grant select on public.profiles to service_role;

-- Checked frequently since a trigger needs to fire close to its actual due moment —
-- same cadence and cron_secret vault entry as event-reminders.
select cron.schedule(
  'block-reminders',
  '*/5 * * * *',
  $$
  select net.http_post(
    url := 'https://nzekuszwophatjzbkeej.supabase.co/functions/v1/send-block-reminders',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-cron-secret', (select decrypted_secret from vault.decrypted_secrets where name = 'cron_secret')
    ),
    body := '{}'::jsonb
  );
  $$
);
