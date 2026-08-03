-- Habits gain an optional category, matching tasks.category, so both can be
-- grouped/colored consistently in the new Timeblock drawer (categoryColor.ts
-- already hashes any free-text string to a stable color).
alter table habits add column category text;

-- Timeblocks: a scheduled slot on a specific day, distinct from `events`
-- (appointments) — a block always has a duration and optionally wraps an
-- existing task or habit rather than being its own freestanding commitment.
create table time_blocks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  category text,
  start_at timestamptz not null,
  end_at timestamptz not null,
  is_completed boolean not null default false,
  task_id uuid references tasks(id) on delete set null,
  habit_id uuid references habits(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint time_blocks_end_after_start check (end_at > start_at),
  constraint time_blocks_single_link check (task_id is null or habit_id is null)
);

alter table time_blocks enable row level security;
create policy "owner_full_access" on time_blocks
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

grant select, insert, update, delete on public.time_blocks to authenticated;
