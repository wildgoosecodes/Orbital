alter table tasks add column next_action text;
alter table tasks add column estimated_minutes integer;
alter table tasks add column pinned_now boolean not null default false;

-- At most one manually-pinned NOW task per user.
create unique index tasks_one_pinned_now_per_user on tasks (user_id) where pinned_now;

create table focus_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  task_id uuid references tasks(id) on delete set null,
  planned_minutes integer not null,
  started_at timestamptz not null,
  ended_at timestamptz not null default now(),
  actual_minutes integer not null,
  status text not null check (status in ('completed', 'abandoned')),
  created_at timestamptz not null default now()
);

alter table focus_sessions enable row level security;
create policy "owner_full_access" on focus_sessions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
grant select, insert, update, delete on public.focus_sessions to authenticated;
