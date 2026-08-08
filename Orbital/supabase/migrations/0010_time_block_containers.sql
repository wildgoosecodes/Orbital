-- Time blocks become containers that can hold multiple tasks/habits (e.g. a
-- "School 3-5pm" block holding several tasks), replacing the old one-task-or-
-- one-habit link. Ownership flips: instead of the block pointing at its
-- single child, each task/habit now points at the block it's scheduled into,
-- so many can share one.
alter table tasks add column time_block_id uuid references time_blocks(id) on delete set null;
alter table habits add column time_block_id uuid references time_blocks(id) on delete set null;

alter table time_blocks drop constraint time_blocks_single_link;
alter table time_blocks drop column task_id;
alter table time_blocks drop column habit_id;
