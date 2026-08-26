alter table events add column priority text not null default 'medium'
  check (priority in ('low', 'medium', 'high'));
