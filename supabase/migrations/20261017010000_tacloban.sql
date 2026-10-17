-- Replace the Tangub City branch with Tacloban City, Leyte.
-- Moves anything linked to Tangub (requests, accounts, staff, price lists) to Tacloban, then removes Tangub.
-- Safe to run more than once.

insert into branches (slug, name, city, province, region, lat, lng, status)
values ('tacloban-city', 'Manager''s Pizza Tacloban', 'Tacloban City', 'Leyte', 'Visayas', 11.2443, 125.0039, 'open')
on conflict (slug) do nothing;

update leads set branch_slug = 'tacloban-city' where branch_slug = 'tangub-city';
update leads set assigned_branch = 'tacloban-city' where assigned_branch = 'tangub-city';
update profiles set branch_slug = 'tacloban-city' where branch_slug = 'tangub-city';
update staff_roles set branch_slug = 'tacloban-city' where branch_slug = 'tangub-city';
update price_lists set branch_slug = 'tacloban-city' where branch_slug = 'tangub-city';

delete from branches where slug = 'tangub-city';

select slug, city, province, status from branches order by city;
