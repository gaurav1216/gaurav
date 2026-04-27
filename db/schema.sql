-- Mithila Boutique — database schema (Supabase / Postgres)
-- Run this in the Supabase SQL editor (Dashboard → SQL → New query)

-- ─────────────────────────────────────────────
-- products
-- ─────────────────────────────────────────────
create table if not exists products (
  id              text primary key,            -- e.g. 'p-madhubani-saree'
  name            text not null,
  maker           text not null,               -- 'Ranti village · Madhubani'
  price_inr       integer not null,            -- price in rupees
  shape           text not null,               -- gradient key for placeholder
  image_url       text,                        -- optional real product photo
  description     text,
  category        text,                        -- 'saree' | 'dupatta' | 'craft' | 'painting'
  in_stock        boolean default true,
  display_order   integer default 0,
  created_at      timestamptz default now()
);

-- ─────────────────────────────────────────────
-- orders
-- ─────────────────────────────────────────────
create table if not exists orders (
  id              uuid primary key default gen_random_uuid(),
  email           text not null,
  first_name      text not null,
  last_name       text not null,
  address         text not null,
  city            text not null,
  postal          text not null,
  country         text not null,
  items           jsonb not null,              -- [{id, name, price, qty}, ...]
  subtotal_inr    integer not null,
  shipping_inr    integer not null,
  tax_inr         integer not null,
  total_inr       integer not null,
  payment_method  text,                        -- 'card' | 'paypal' | 'apple' | 'demo'
  payment_id      text,                        -- Stripe PaymentIntent ID
  status          text default 'pending',      -- pending | paid | shipped | cancelled
  created_at      timestamptz default now()
);

create index if not exists orders_email_idx on orders (email);
create index if not exists orders_created_idx on orders (created_at desc);

-- ─────────────────────────────────────────────
-- newsletter signups
-- ─────────────────────────────────────────────
create table if not exists newsletter_signups (
  id          uuid primary key default gen_random_uuid(),
  email       text unique not null,
  created_at  timestamptz default now()
);

-- ─────────────────────────────────────────────
-- Row-Level Security
-- The browser uses the anon key, which is public — RLS is what
-- actually keeps the data safe. Policies below let anonymous users
-- browse products and place orders, but never read other people's
-- orders. Admin reads should use the service-role key from a backend.
-- ─────────────────────────────────────────────
alter table products enable row level security;
alter table orders enable row level security;
alter table newsletter_signups enable row level security;

drop policy if exists "products are viewable by everyone" on products;
create policy "products are viewable by everyone"
  on products for select using (true);

drop policy if exists "anyone can place an order" on orders;
create policy "anyone can place an order"
  on orders for insert with check (true);

drop policy if exists "anyone can subscribe" on newsletter_signups;
create policy "anyone can subscribe"
  on newsletter_signups for insert with check (true);

-- ─────────────────────────────────────────────
-- Admin access
-- The admin page (admin.html) signs in via Supabase email magic link.
-- Only emails listed in the admin_emails table can read orders or
-- newsletter subscribers, or update order status.
--
-- After running this file, add yourself:
--   insert into admin_emails (email) values ('you@example.com');
-- ─────────────────────────────────────────────
create table if not exists admin_emails (
  email      text primary key,
  added_at   timestamptz default now()
);

alter table admin_emails enable row level security;
-- No public policies — only the service-role key can read this table.

drop policy if exists "admins read orders" on orders;
create policy "admins read orders"
  on orders for select
  using ((auth.jwt() ->> 'email') in (select email from admin_emails));

drop policy if exists "admins update orders" on orders;
create policy "admins update orders"
  on orders for update
  using ((auth.jwt() ->> 'email') in (select email from admin_emails));

drop policy if exists "admins read subscribers" on newsletter_signups;
create policy "admins read subscribers"
  on newsletter_signups for select
  using ((auth.jwt() ->> 'email') in (select email from admin_emails));

drop policy if exists "admins write products" on products;
create policy "admins write products"
  on products for all
  using ((auth.jwt() ->> 'email') in (select email from admin_emails))
  with check ((auth.jwt() ->> 'email') in (select email from admin_emails));
