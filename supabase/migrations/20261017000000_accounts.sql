-- Manager's Pizza: customer accounts, sign-in and dashboards.
-- Every sign-up gets a profile. An admin approves it and assigns the price tier and home branch;
-- customers can never change their own tier or branch.

create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  mobile text,
  business_name text,
  business_type text,
  province text,
  city text,
  account_type text not null default 'customer' check (account_type in ('customer', 'partner', 'staff')),
  tier price_tier,
  branch_slug text references branches(slug),
  status text not null default 'pending' check (status in ('pending', 'approved', 'suspended')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index profiles_email_idx on profiles (lower(email));
alter table profiles enable row level security;

-- Create the profile from the sign-up form details.
create or replace function handle_new_user() returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into profiles (id, email, full_name, mobile, business_name, business_type, province, city)
  values (
    new.id, new.email,
    nullif(new.raw_user_meta_data->>'full_name', ''),
    nullif(new.raw_user_meta_data->>'mobile', ''),
    nullif(new.raw_user_meta_data->>'business_name', ''),
    nullif(new.raw_user_meta_data->>'business_type', ''),
    nullif(new.raw_user_meta_data->>'province', ''),
    nullif(new.raw_user_meta_data->>'city', '')
  )
  on conflict (id) do nothing;
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function handle_new_user();

-- Profiles for anyone who signed up before this migration.
insert into profiles (id, email) select id, email from auth.users on conflict (id) do nothing;

-- Founders count as admins too.
create or replace function is_admin() returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from staff_roles where user_id = auth.uid() and role in ('founder', 'super_admin', 'admin'))
$$;

create or replace function staff_branch(b text) returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from staff_roles where user_id = auth.uid() and role in ('branch_oic', 'staff') and branch_slug = b)
$$;

create policy "read own profile" on profiles for select using (id = auth.uid());
create policy "admin all profiles" on profiles for all using (is_admin()) with check (is_admin());
create policy "branch staff read branch profiles" on profiles for select using (staff_branch(branch_slug));

-- Link requests to the account that sent them.
alter table leads add column user_id uuid references auth.users(id) on delete set null;
create index leads_user_idx on leads (user_id);
create index leads_branch_idx on leads (coalesce(assigned_branch, branch_slug));

create policy "read own leads" on leads for select using (user_id = auth.uid());
drop policy if exists "oic read branch leads" on leads;
create policy "branch staff read leads" on leads for select using (staff_branch(coalesce(assigned_branch, branch_slug)));
create policy "branch staff update leads" on leads for update
  using (staff_branch(coalesce(assigned_branch, branch_slug)))
  with check (staff_branch(coalesce(assigned_branch, branch_slug)));

-- Signed-in accounts read the price lists for their own tier and branch.
create policy "account read own lists" on price_lists for select using (
  exists (select 1 from profiles p where p.id = auth.uid() and p.status = 'approved'
          and (price_lists.tier is null or price_lists.tier = p.tier)
          and (price_lists.branch_slug is null or price_lists.branch_slug = p.branch_slug))
);

create or replace function touch_updated_at() returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;
create trigger profiles_touch before update on profiles for each row execute function touch_updated_at();
create trigger leads_touch before update on leads for each row execute function touch_updated_at();

-- Account, role and lead changes are written to audit_log by the website's server actions,
-- which record the signed-in staff member as the actor.
