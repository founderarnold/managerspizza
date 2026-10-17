-- Online ordering: orders with a status timeline, payments with proof screenshots, the
-- payment methods (QR codes) shown at checkout, and in-app messaging between customers and
-- branches. The website reads and writes these with the service-role key after checking the
-- signed-in user; the policies below only cover direct API access.

create type order_status as enum (
  'pending_payment', 'payment_review', 'paid', 'processing', 'ready', 'shipped', 'delivered', 'completed', 'cancelled'
);
create type payment_status as enum ('submitted', 'confirmed', 'rejected');

create table orders (
  id uuid primary key default gen_random_uuid(),
  reference text unique not null,
  user_id uuid not null references auth.users(id),
  branch_slug text references branches(slug),
  tier price_tier not null,
  status order_status not null default 'pending_payment',
  items jsonb not null, -- [{sheet,row,column,name,option,unit,qty,unit_price,line_total}]
  subtotal numeric(12, 2) not null,
  adjustment numeric(12, 2) not null default 0, -- set by staff, e.g. minimum-order surcharge or discount
  adjustment_note text,
  shipping_fee numeric(12, 2), -- null until the branch quotes it
  delivery_method text not null,
  delivery_address text,
  contact_name text not null,
  contact_mobile text not null,
  notes text,
  courier text,
  tracking_ref text,
  tracking_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index orders_user_idx on orders (user_id, created_at desc);
create index orders_branch_idx on orders (branch_slug, status);

create table order_events (
  id bigserial primary key,
  order_id uuid not null references orders(id) on delete cascade,
  status order_status,
  note text,
  actor uuid references auth.users(id),
  created_at timestamptz not null default now()
);
create index order_events_order_idx on order_events (order_id, created_at);

create table payment_methods (
  id text primary key, -- gcash, bdo, maya, gotyme
  label text not null,
  account_name text,
  account_number text,
  qr_path text, -- object path in the public 'payment-qr' bucket
  instructions text,
  active boolean not null default true,
  sort int not null default 0
);
insert into payment_methods (id, label, sort) values
  ('gcash', 'GCash', 1), ('bdo', 'BDO', 2), ('maya', 'Maya', 3), ('gotyme', 'GoTyme Bank', 4)
on conflict (id) do nothing;

create table payments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  user_id uuid not null references auth.users(id),
  method text not null references payment_methods(id),
  amount numeric(12, 2) not null,
  reference text,
  proof_path text not null, -- object path in the private 'payment-proofs' bucket
  status payment_status not null default 'submitted',
  review_note text,
  reviewed_by uuid references auth.users(id),
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);
create index payments_order_idx on payments (order_id);

create table conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  branch_slug text references branches(slug),
  order_id uuid references orders(id) on delete set null,
  subject text not null,
  status text not null default 'open' check (status in ('open', 'closed')),
  last_message_at timestamptz not null default now(),
  customer_read_at timestamptz not null default now(),
  staff_read_at timestamptz not null default 'epoch',
  created_at timestamptz not null default now()
);
create index conversations_user_idx on conversations (user_id, last_message_at desc);
create index conversations_branch_idx on conversations (branch_slug, last_message_at desc);

create table messages (
  id bigserial primary key,
  conversation_id uuid not null references conversations(id) on delete cascade,
  sender_id uuid references auth.users(id),
  from_staff boolean not null default false,
  body text not null,
  created_at timestamptz not null default now()
);
create index messages_conversation_idx on messages (conversation_id, id);

alter table orders enable row level security;
alter table order_events enable row level security;
alter table payment_methods enable row level security;
alter table payments enable row level security;
alter table conversations enable row level security;
alter table messages enable row level security;

create policy "own orders" on orders for select using (user_id = auth.uid());
create policy "admin all orders" on orders for all using (is_admin()) with check (is_admin());
create policy "own order events" on order_events for select using (exists (select 1 from orders o where o.id = order_id and o.user_id = auth.uid()));
create policy "public payment methods" on payment_methods for select using (active);
create policy "own payments" on payments for select using (user_id = auth.uid());
create policy "own conversations" on conversations for select using (user_id = auth.uid());
create policy "own messages" on messages for select using (exists (select 1 from conversations c where c.id = conversation_id and c.user_id = auth.uid()));

-- Storage: QR codes are public images; payment screenshots are private (viewed through signed links).
insert into storage.buckets (id, name, public) values ('payment-qr', 'payment-qr', true) on conflict (id) do nothing;
insert into storage.buckets (id, name, public) values ('payment-proofs', 'payment-proofs', false) on conflict (id) do nothing;
