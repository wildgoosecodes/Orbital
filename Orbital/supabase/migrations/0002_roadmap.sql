-- Roadmap hierarchy: year_goals -> milestones -> goals -> tasks.
-- Additive only: existing goals/tasks rows keep working with the new FK columns null.

alter table profiles add column onboarding_completed_at timestamptz;

create table year_goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  description text,
  year int not null,
  status text not null default 'active' check (status in ('active', 'completed', 'abandoned')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table milestones (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  year_goal_id uuid not null references year_goals(id) on delete cascade,
  title text not null,
  description text,
  target_date date,
  status text not null default 'pending' check (status in ('pending', 'active', 'completed')),
  position int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table goals add column milestone_id uuid references milestones(id) on delete set null;
alter table tasks add column goal_id uuid references goals(id) on delete set null;

alter table year_goals enable row level security;
create policy "owner_full_access" on year_goals
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

alter table milestones enable row level security;
create policy "owner_full_access" on milestones
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

grant select, insert, update, delete on public.year_goals to authenticated;
grant select, insert, update, delete on public.milestones to authenticated;
