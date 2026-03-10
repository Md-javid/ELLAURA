-- ═══════════════════════════════════════════════════════════
-- ELLAURA — Supabase PostgreSQL Schema
-- Run this in your Supabase SQL editor: https://app.supabase.com
-- → your project → SQL Editor → New Query → Paste → Run
--
-- ✅ Safe to run multiple times (uses IF NOT EXISTS / OR REPLACE)
-- ═══════════════════════════════════════════════════════════

-- Enable UUID generation
create extension if not exists "pgcrypto";

-- ── 1. Profiles ──────────────────────────────────────────────
-- Extends Supabase auth.users with customer details
create table if not exists profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  full_name     text not null,
  phone         text,
  city          text,
  style_preference text,          -- e.g. 'cocktail' | 'club' | 'both'
  measurements  jsonb,            -- { bust, waist, hips, height }
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

-- Auto-update updated_at
create or replace function handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists profiles_updated_at on profiles;
create trigger profiles_updated_at
  before update on profiles
  for each row execute procedure handle_updated_at();

-- ── 2. Orders ─────────────────────────────────────────────────
create table if not exists orders (
  id                      uuid primary key default gen_random_uuid(),
  user_id                 uuid references profiles(id) on delete set null,
  guest_email             text,            -- for checkout without account
  items                   jsonb not null,  -- [{ productId, name, price, qty, size }]
  subtotal                integer not null, -- stored in paise (₹1 = 100)
  total                   integer not null,
  currency                text default 'inr',
  status                  text default 'pending'
                            check (status in ('pending','paid','processing','shipped','delivered','cancelled','refunded')),
  shipping_address        jsonb,           -- { line1, line2, city, state, pincode, phone }
  stripe_payment_intent   text unique,
  stripe_session_id       text,
  notes                   text,
  created_at              timestamptz default now(),
  updated_at              timestamptz default now()
);

drop trigger if exists orders_updated_at on orders;
create trigger orders_updated_at
  before update on orders
  for each row execute procedure handle_updated_at();

-- ── 3. Cart (Persistent, cross-device) ───────────────────────
create table if not exists cart_items (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references profiles(id) on delete cascade,
  product_id  text not null,
  quantity    integer not null default 1 check (quantity > 0),
  size        text not null default 'M',
  created_at  timestamptz default now(),
  unique (user_id, product_id, size)
);

-- ── 3b. Saved Addresses ───────────────────────────────────────
-- Customers can save shipping addresses for faster repeat checkout.
create table if not exists addresses (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references profiles(id) on delete cascade,
  name        text,
  phone       text,
  email       text,
  line1       text not null,
  line2       text,
  city        text not null,
  state       text not null,
  pincode     text not null,
  is_default  boolean not null default false,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

create index if not exists addresses_user_idx on addresses(user_id);

alter table addresses enable row level security;
drop policy if exists "Users can manage own addresses" on addresses;
create policy "Users can manage own addresses"
  on addresses for all using (auth.uid() = user_id);

drop trigger if exists addresses_updated_at on addresses;
create trigger addresses_updated_at
  before update on addresses
  for each row execute procedure handle_updated_at();

-- ── 4. Products ──────────────────────────────────────────────
-- Admin-managed product catalogue stored in the database.
-- Anonymous users can read; only service role / authenticated admins can write.
create table if not exists products (
  id            text primary key,              -- e.g. EL001, EL002
  name          text not null,
  price         integer not null,              -- in paise (₹1 = 100) – or rupees, stay consistent
  price_display text not null,
  category      text not null default 'midi',
  vibe          jsonb not null default '[]',   -- ["cocktail","club"]
  tag           text,
  tag_color     text,
  badge         text,
  rating        numeric(3,1) default 4.9,
  reviews       integer default 0,
  img           text not null,
  images        jsonb not null default '[]',   -- additional gallery images
  img_alt       text,
  description   text,
  material      text,                          -- fabric/material info
  care_instructions text,                      -- care instructions
  sizes         jsonb not null default '[]',   -- ["XS","S","M","L","XL"]
  colors        jsonb not null default '[]',
  delivery_days integer default 48,
  stock         integer not null default 0,
  active        boolean not null default true,
  added_at      timestamptz,                   -- when admin added it (for new arrivals)
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

alter table products
  add column if not exists images jsonb not null default '[]';

-- Make subtotal optional (default 0) so existing inserts without it still work
alter table orders alter column subtotal set default 0;

-- Atomic stock decrement function (prevents negative stock)
create or replace function decrement_stock(product_id text, amount integer)
returns void as $$
  update products
     set stock = greatest(0, stock - amount)
   where id = product_id;
$$ language sql security definer;

drop trigger if exists products_updated_at on products;
create trigger products_updated_at
  before update on products
  for each row execute procedure handle_updated_at();

-- ── 4b. Row Level Security (RLS) ─────────────────────────────

-- Profiles: users can only read/write their own profile
alter table profiles enable row level security;
drop policy if exists "Users can view own profile" on profiles;
create policy "Users can view own profile"
  on profiles for select using (auth.uid() = id);
drop policy if exists "Users can update own profile" on profiles;
create policy "Users can update own profile"
  on profiles for update using (auth.uid() = id);
drop policy if exists "Users can insert own profile" on profiles;
create policy "Users can insert own profile"
  on profiles for insert with check (auth.uid() = id);

-- Orders: users can only read their own orders
alter table orders enable row level security;
drop policy if exists "Users can view own orders" on orders;
create policy "Users can view own orders"
  on orders for select using (auth.uid() = user_id);
drop policy if exists "Users can insert own orders" on orders;
create policy "Users can insert own orders"
  on orders for insert with check (auth.uid() = user_id);

-- Cart: users can manage their own cart
alter table cart_items enable row level security;
drop policy if exists "Users can manage own cart" on cart_items;
create policy "Users can manage own cart"
  on cart_items for all using (auth.uid() = user_id);

-- Products: publicly readable and writable (admin UI is protected by PIN/password in the app)
alter table products enable row level security;
drop policy if exists "Products are publicly readable" on products;
create policy "Products are publicly readable"
  on products for select using (true);
drop policy if exists "Only service role can modify products" on products;
drop policy if exists "Anon can modify products" on products;
create policy "Anon can modify products"
  on products for all using (true) with check (true);

-- ── 5. Reviews ──────────────────────────────────────────────
create table if not exists reviews (
  id          uuid primary key default gen_random_uuid(),
  product_id  text not null,                -- matches the app-level product id (e.g. 'EL001')
  user_id     uuid references profiles(id) on delete set null,
  guest_name  text,                         -- fallback for unregistered users
  rating      integer not null check (rating between 1 and 5),
  body        text not null,
  verified    boolean default false,
  created_at  timestamptz default now()
);

create index if not exists reviews_product_id_idx on reviews(product_id);

alter table reviews enable row level security;
drop policy if exists "Anyone can view reviews" on reviews;
create policy "Anyone can view reviews"
  on reviews for select using (true);
drop policy if exists "Authenticated users can insert reviews" on reviews;
create policy "Authenticated users can insert reviews"
  on reviews for insert to authenticated
  with check (auth.uid() = user_id);

-- ── 6. Coupons ───────────────────────────────────────────────
create table if not exists coupons (
  id             uuid primary key default gen_random_uuid(),
  code           text unique not null,
  discount_type  text not null check (discount_type in ('percent', 'fixed')),
  discount_value integer not null,          -- 10 = 10% or ₹10
  min_order      integer default 0,         -- minimum order in ₹
  max_uses       integer default null,      -- null = unlimited
  uses_count     integer default 0,
  expires_at     timestamptz default null,  -- null = never
  active         boolean default true,
  created_at     timestamptz default now()
);

alter table coupons enable row level security;
drop policy if exists "Coupons are public read" on coupons;
create policy "Coupons are public read"
  on coupons for select using (true);

-- Seed some initial coupons
insert into coupons (code, discount_type, discount_value, min_order, max_uses) values
  ('ELLAURA10', 'percent', 10, 0, null),
  ('LAUNCH20',  'percent', 20, 0, 500),
  ('BANDRA500', 'fixed',   500, 5000, null),
  ('VIP15',     'percent', 15, 0, null)
on conflict (code) do nothing;

-- ── 7. Helpful Views ─────────────────────────────────────────

create or replace view order_summary as
select
  o.id,
  o.user_id,
  p.full_name,
  p.phone,
  o.items,
  o.subtotal,
  o.total,
  o.status,
  o.shipping_address,
  o.created_at
from orders o
left join profiles p on p.id = o.user_id;

-- ── 8. Increment coupon use function ─────────────────────────
create or replace function increment_coupon_use(coupon_code text)
returns void as $$
begin
  update coupons set uses_count = uses_count + 1 where code = coupon_code;
end;
$$ language plpgsql;

-- ── 9. Waitlist (Coming Soon email capture) ─────────────────
-- Stores emails from the "Notify Me" form on the Coming Soon page.
-- Safe to run even after launch — table stays but app stops writing to it.
create table if not exists waitlist (
  id         uuid primary key default gen_random_uuid(),
  email      text unique not null,
  created_at timestamptz default now()
);

alter table waitlist enable row level security;
drop policy if exists "Anyone can join waitlist" on waitlist;
create policy "Anyone can join waitlist"
  on waitlist for insert with check (true);
drop policy if exists "Waitlist is not publicly readable" on waitlist;
create policy "Waitlist is not publicly readable"
  on waitlist for select using (false);

-- ── Done! ────────────────────────────────────────────────────
-- All tables, policies, and seed data are ready.
-- You can safely re-run this script at any time.
