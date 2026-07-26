-- Web Push subscriptions, one row per browser/device a user has enabled notifications on.
create table push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  created_at timestamptz not null default now()
);

alter table push_subscriptions enable row level security;
create policy "owner_full_access" on push_subscriptions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
grant select, insert, update, delete on public.push_subscriptions to authenticated;

-- send-daily-reminders runs as service_role (no per-user JWT, since it's cron-triggered),
-- which bypasses RLS but still needs the underlying table grants Postgres always requires.
grant select, insert, update, delete on public.push_subscriptions to service_role;
grant select on public.tasks, public.goals, public.milestones to service_role;

-- Daily reminder digest: scheduled call into the send-daily-reminders Edge Function.
-- The cron job itself only *looks up* the shared secret via Vault — the real value is
-- inserted separately, directly against the DB, and is never committed to this file:
--   select vault.create_secret('<random-value>', 'cron_secret');
create extension if not exists pg_cron;
create extension if not exists pg_net;

select cron.schedule(
  'daily-reminders',
  '0 13 * * *', -- fixed UTC time for all users (v1 has no per-user timezone handling)
  $$
  select net.http_post(
    url := 'https://nzekuszwophatjzbkeej.supabase.co/functions/v1/send-daily-reminders',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-cron-secret', (select decrypted_secret from vault.decrypted_secrets where name = 'cron_secret')
    ),
    body := '{}'::jsonb
  );
  $$
);
