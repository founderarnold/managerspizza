-- Manager's Pizza: initial schema.
-- RLS is on for every table. The website writes leads with the service-role key from
-- the server only; anonymous visitors can read the public catalog and branches.


create type price_tier as enum ('factory', 'regional', 'provincial', 'city', 'barangay');
create type lead_kind as enum ('quote', 'consultation', 'trial', 'partner');
create type lead_status as enum ('new', 'in_review', 'quoted', 'accepted', 'declined', 'expired', 'closed');

create table branches (
  slug text primary key,
  name text not null,
  city text not null,
  province text not null,
  region text not null,
  address text,
  phones text[],
  lat double precision not null,
  lng double precision not null,
  is_main boolean not null default false,
  status text not null default 'open' check (status in ('open', 'opening_soon', 'closed')),
  created_at timestamptz not null default now()
);

create table price_sheets (
  slug text primary key,
  name text not null,
  category text not null,
  handling text not null check (handling in ('frozen', 'chilled', 'ambient')),
  unit text not null,
  columns jsonb not null, -- [{key,label,sub}]
  terms text[],
  sort int not null default 0
);

create table price_sheet_rows (
  sheet_slug text not null references price_sheets(slug) on delete cascade,
  row_key text not null,
  label text not null,
  sort int not null default 0,
  primary key (sheet_slug, row_key)
);

-- One versioned list per (branch, tier). branch_slug / tier null = applies to all.
create table price_lists (
  id uuid primary key default gen_random_uuid(),
  branch_slug text references branches(slug),
  tier price_tier,
  name text not null,
  effective_from date not null,
  effective_to date,
  reason text not null,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

create table price_list_items (
  price_list_id uuid not null references price_lists(id) on delete cascade,
  sheet_slug text not null,
  row_key text not null,
  column_key text not null,
  amount numeric(12, 2),
  primary key (price_list_id, sheet_slug, row_key, column_key),
  foreign key (sheet_slug, row_key) references price_sheet_rows(sheet_slug, row_key)
);

create table leads (
  id uuid primary key default gen_random_uuid(),
  reference text unique not null,
  kind lead_kind not null,
  status lead_status not null default 'new',
  name text not null,
  mobile text not null,
  email text,
  business_type text,
  province text,
  city text,
  barangay text,
  address text,
  branch_slug text references branches(slug),
  assigned_branch text references branches(slug),
  fulfillment text,
  notes text,
  items jsonb not null default '[]',
  details jsonb not null default '{}',
  marketing_consent boolean not null default false,
  quote jsonb, -- branch, validity, product estimate, shipping estimate, payment terms
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table staff_roles (
  id bigserial primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('founder', 'super_admin', 'admin', 'branch_oic', 'staff', 'finance')),
  branch_slug text references branches(slug),
  unique nulls not distinct (user_id, role, branch_slug)
);

create table audit_log (
  id bigserial primary key,
  actor uuid references auth.users(id),
  action text not null,
  entity text not null,
  entity_id text,
  reason text,
  before jsonb,
  after jsonb,
  at timestamptz not null default now()
);

alter table branches enable row level security;
alter table price_sheets enable row level security;
alter table price_sheet_rows enable row level security;
alter table price_lists enable row level security;
alter table price_list_items enable row level security;
alter table leads enable row level security;
alter table staff_roles enable row level security;
alter table audit_log enable row level security;

create or replace function is_admin() returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from staff_roles where user_id = auth.uid() and role in ('super_admin', 'admin'))
$$;

-- Public catalog
create policy "public read branches" on branches for select using (true);
create policy "public read sheets" on price_sheets for select using (true);
create policy "public read sheet rows" on price_sheet_rows for select using (true);
-- The all-branch, all-tier base list is the published price list; tier lists are not public.
create policy "public read base list" on price_lists for select using (branch_slug is null and tier is null);
create policy "public read base items" on price_list_items for select
  using (exists (select 1 from price_lists l where l.id = price_list_id and l.branch_slug is null and l.tier is null));

-- Admins
create policy "admin all branches" on branches for all using (is_admin()) with check (is_admin());
create policy "admin all sheets" on price_sheets for all using (is_admin()) with check (is_admin());
create policy "admin all sheet rows" on price_sheet_rows for all using (is_admin()) with check (is_admin());
create policy "admin all lists" on price_lists for all using (is_admin()) with check (is_admin());
create policy "admin all items" on price_list_items for all using (is_admin()) with check (is_admin());
create policy "admin all leads" on leads for all using (is_admin()) with check (is_admin());
create policy "oic read branch leads" on leads for select
  using (exists (select 1 from staff_roles r where r.user_id = auth.uid() and r.role = 'branch_oic' and r.branch_slug = leads.assigned_branch));
create policy "admin read roles" on staff_roles for select using (is_admin() or user_id = auth.uid());
create policy "admin read audit" on audit_log for select using (is_admin());

-- Audit every price change
create or replace function log_price_change() returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into audit_log (actor, action, entity, entity_id, before, after)
  values (auth.uid(), tg_op, tg_table_name,
          coalesce(new.price_list_id, old.price_list_id)::text || ':' || coalesce(new.sheet_slug, old.sheet_slug) || ':' || coalesce(new.row_key, old.row_key) || ':' || coalesce(new.column_key, old.column_key),
          to_jsonb(old), to_jsonb(new));
  return coalesce(new, old);
end $$;
create trigger price_list_items_audit after insert or update or delete on price_list_items
  for each row execute function log_price_change();
