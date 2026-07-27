-- Link habits to a roadmap goal, same relationship tasks already have.
alter table habits add column goal_id uuid references goals(id) on delete set null;
