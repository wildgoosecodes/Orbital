alter table goals add column year_goal_id uuid references year_goals(id) on delete set null;
