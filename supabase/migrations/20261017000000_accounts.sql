-- Accounts and dashboards.
-- Customers register on the website (the server creates the auth user, already confirmed,
-- so no email is needed), start as 'pending', and an admin approves them and assigns their
-- price level (tier) and home branch. Staff are ordinary accounts with rows in staff_roles.
-- The website reads and writes these tables with the service-role key from the server only,
-- after checking the signed-in user's role; the policies below cover direct API access.

create type account_status as enum ('pending', 'approved', 'suspended');

create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text not null,
  mobile text not null,
  business_name text,
  business_type text,
  province text,
  city text,
  barangay text,
  address text,
  branch_slug text references branches(slug),
  tier price_tier not null default 'barangay',
  status account_status not null default 'pending',
  admin_notes text,
  approved_at timestamptz,
  approved_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index profiles_branch_idx on profiles (branch_slug);
create index profiles_status_idx on profiles (status);

alter table profiles enable row level security;
create policy "own profile" on profiles for select using (id = auth.uid());
create policy "admin all profiles" on profiles for all using (is_admin()) with check (is_admin());
create policy "oic read branch profiles" on profiles for select
  using (exists (select 1 from staff_roles r where r.user_id = auth.uid() and r.role = 'branch_oic' and r.branch_slug = profiles.branch_slug));

-- Link requests to the account that sent them, and give staff a place for notes.
alter table leads add column user_id uuid references auth.users(id) on delete set null;
alter table leads add column staff_notes text;
create index leads_user_idx on leads (user_id);
create index leads_branch_idx on leads (coalesce(assigned_branch, branch_slug));
create policy "own leads" on leads for select using (user_id = auth.uid());

-- Branch staff (not only OICs) can read their branch's requests.
drop policy "oic read branch leads" on leads;
create policy "staff read branch leads" on leads for select
  using (exists (select 1 from staff_roles r where r.user_id = auth.uid() and r.role in ('branch_oic', 'staff')
                 and r.branch_slug = coalesce(leads.assigned_branch, leads.branch_slug)));

-- Founders count as admins.
create or replace function is_admin() returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from staff_roles where user_id = auth.uid() and role in ('founder', 'super_admin', 'admin'))
$$;

-- Price lists: one current list per (branch, tier). The seed copied the base list into every
-- tier list; those copies are identical to the base list, so they are cleared and each tier
-- now inherits the base price until a tier price is actually set.
delete from price_list_items i
using price_lists l, price_lists b, price_list_items bi
where i.price_list_id = l.id
  and l.branch_slug is null and l.tier is not null
  and b.branch_slug is null and b.tier is null
  and bi.price_list_id = b.id and bi.sheet_slug = i.sheet_slug and bi.row_key = i.row_key and bi.column_key = i.column_key
  and bi.amount is not distinct from i.amount;
