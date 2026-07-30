-- Custom per-weekday habit scheduling (e.g. gym on Mon/Wed/Fri).
-- 0 = Sunday ... 6 = Saturday, matching JS Date.getDay() directly.
-- Existing rows default to every day, matching the old "daily" behavior.
alter table habits add column days_of_week integer[] not null default '{0,1,2,3,4,5,6}';
