-- profiles: one row per auth user
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  created_at timestamptz not null default now()
);

create function public.handle_new_user() returns trigger as $$
begin
  insert into public.profiles (id, display_name) values (new.id, new.email);
  return new;
end;
$$ language plpgsql security definer set search_path = public;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create table tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  description text,
  status text not null default 'todo' check (status in ('todo', 'in_progress', 'done')),
  priority text not null default 'medium' check (priority in ('low', 'medium', 'high')),
  due_date date,
  category text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table habits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  frequency text not null default 'daily' check (frequency in ('daily', 'weekly')),
  target_per_period int not null default 1,
  created_at timestamptz not null default now()
);

-- user_id is denormalized here so RLS is a flat auth.uid() = user_id check
-- instead of a join through habits.
create table habit_logs (
  id uuid primary key default gen_random_uuid(),
  habit_id uuid not null references habits(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  completed_on date not null default current_date,
  created_at timestamptz not null default now(),
  unique (habit_id, completed_on)
);

create table goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  description text,
  period_type text not null check (period_type in ('weekly', 'quarterly', 'yearly')),
  period_start date not null,
  period_end date not null,
  progress numeric not null default 0 check (progress between 0 and 100),
  status text not null default 'active' check (status in ('active', 'completed', 'abandoned')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table profiles enable row level security;
create policy "owner_full_access" on profiles
  for all using (auth.uid() = id) with check (auth.uid() = id);

alter table tasks enable row level security;
create policy "owner_full_access" on tasks
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

alter table habits enable row level security;
create policy "owner_full_access" on habits
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

alter table habit_logs enable row level security;
create policy "owner_full_access" on habit_logs
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

alter table goals enable row level security;
create policy "owner_full_access" on goals
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- RLS policies alone don't grant table access; Postgres still requires
-- these explicit GRANTs for the authenticated role before RLS applies.
grant select, insert, update, delete on public.profiles to authenticated;
grant select, insert, update, delete on public.tasks to authenticated;
grant select, insert, update, delete on public.habits to authenticated;
grant select, insert, update, delete on public.habit_logs to authenticated;
grant select, insert, update, delete on public.goals to authenticated;
