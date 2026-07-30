-- Calendar events: distinct from tasks — a specific point (or span) in time
-- (meetings, appointments, reminders), rather than a to-do with just a due date.
create table events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  description text,
  location text,
  start_at timestamptz not null,
  end_at timestamptz,
  all_day boolean not null default false,
  reminder_minutes_before int,
  reminder_sent_at timestamptz,
  -- Set when imported from Google Calendar, so re-running an import is a
  -- no-op instead of creating duplicates (nulls don't collide on a unique
  -- constraint, so manually-created events are unaffected).
  google_event_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, google_event_id)
);

alter table events enable row level security;
create policy "owner_full_access" on events
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

grant select, insert, update, delete on public.events to authenticated;

-- send-event-reminders runs as service_role (cron-triggered, no per-user JWT),
-- which bypasses RLS but still needs these explicit grants — same gotcha
-- documented in 0003_push_subscriptions.sql for send-daily-reminders.
grant select, update on public.events to service_role;
