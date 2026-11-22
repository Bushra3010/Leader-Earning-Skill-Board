-- =====================================================================
-- Leaders Earning and Skill Board — Supabase schema
-- Run once in Supabase Dashboard → SQL Editor → New query → Run.
-- Safe to re-run: uses IF NOT EXISTS / OR REPLACE where possible.
-- =====================================================================

create extension if not exists pgcrypto;

-- ---------- Types ----------
do $$ begin
  create type app_mode as enum ('pre_school', 'pro_school', 'school');
exception when duplicate_object then null; end $$;
do $$ begin
  create type order_status as enum ('pending', 'paid', 'cancelled', 'halted', 'failed', 'refunded');
exception when duplicate_object then null; end $$;
do $$ begin
  create type delivery_status as enum ('not_applicable', 'pending', 'shipped', 'delivered');
exception when duplicate_object then null; end $$;

-- ---------- Profiles (one row per partner) ----------
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  phone text,
  email text,
  city text,
  referral_code text unique not null,
  referred_by uuid references public.profiles(id),
  role text not null default 'partner' check (role in ('partner', 'admin')),
  kit_status text not null default 'not_paid' check (kit_status in ('not_paid', 'pending', 'paid')),
  points integer not null default 0,
  upi_id text,
  bank_account_name text,
  bank_account_number text,
  bank_ifsc text,
  pan_number text,
  kyc_status text not null default 'not_submitted' check (kyc_status in ('not_submitted', 'submitted', 'verified', 'rejected')),
  created_at timestamptz not null default now()
);

-- ---------- Products ----------
create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  mode app_mode not null,
  title text not null,
  subtitle text,
  emoji text default '📘',
  price numeric(10,2) not null,
  billing text not null default 'one_time' check (billing in ('one_time', 'monthly')),
  duration text,
  commission_pct numeric(5,2) not null default 10,   -- shown publicly to partners (audit fix: no hidden "as per slab")
  best_for text,
  description text,
  features jsonb not null default '[]'::jsonb,
  pitch text,                                        -- copy-paste selling pitch
  is_physical boolean not null default false,        -- needs delivery tracking
  requires_partner_kit boolean not null default false,
  is_featured boolean not null default false,
  banner_gradient text,
  active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

-- ---------- Orders (created by buyers through partner links) ----------
create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  order_code text unique not null default ('LE' || to_char(now(), 'YYMMDD') || upper(substr(md5(random()::text), 1, 5))),
  product_id uuid not null references public.products(id),
  partner_id uuid references public.profiles(id),
  buyer_name text not null,
  buyer_phone text not null,
  buyer_email text,
  buyer_address text,
  amount numeric(10,2) not null,
  kind text not null default 'order' check (kind in ('order', 'enrollment', 'subscription')),
  status order_status not null default 'pending',
  delivery delivery_status not null default 'not_applicable',
  commission_amount numeric(10,2) not null default 0,
  payment_ref text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists orders_partner_idx on public.orders(partner_id, created_at desc);

-- ---------- Wallet ledger ----------
create table if not exists public.wallet_transactions (
  id uuid primary key default gen_random_uuid(),
  partner_id uuid not null references public.profiles(id),
  order_id uuid references public.orders(id),
  amount numeric(10,2) not null,          -- + credit, - debit
  kind text not null check (kind in ('commission', 'withdrawal', 'reversal', 'bonus')),
  note text,
  created_at timestamptz not null default now()
);
create index if not exists wallet_partner_idx on public.wallet_transactions(partner_id, created_at desc);
create unique index if not exists wallet_one_commission_per_order on public.wallet_transactions(order_id) where kind = 'commission';

-- ---------- Withdrawals ----------
create table if not exists public.withdrawals (
  id uuid primary key default gen_random_uuid(),
  partner_id uuid not null references public.profiles(id),
  amount numeric(10,2) not null check (amount > 0),
  method text not null default 'upi',
  status text not null default 'requested' check (status in ('requested', 'approved', 'paid', 'rejected')),
  admin_note text,
  created_at timestamptz not null default now()
);

-- ---------- Notifications ----------
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id),   -- null = broadcast to all partners
  title text not null,
  body text,
  created_at timestamptz not null default now()
);
create table if not exists public.notification_reads (
  notification_id uuid references public.notifications(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete cascade,
  primary key (notification_id, user_id)
);

-- ---------- Support tickets (SOS button) ----------
create table if not exists public.support_tickets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id),
  subject text not null,
  message text not null,
  status text not null default 'open' check (status in ('open', 'closed')),
  created_at timestamptz not null default now()
);

-- ---------- Learn & Grow lessons ----------
create table if not exists public.lessons (
  id uuid primary key default gen_random_uuid(),
  product_id uuid references public.products(id) on delete cascade,
  category text not null check (category in ('about', 'how_to_sell', 'branding')),
  level text not null default 'beginner',
  title text not null,
  body text not null,
  sort_order integer not null default 0
);

-- ---------- App settings (single row) ----------
create table if not exists public.app_settings (
  id integer primary key default 1 check (id = 1),
  min_withdrawal numeric(10,2) not null default 500,
  payout_days text not null default 'Every Monday, within 7 working days of request',
  require_partner_kit boolean not null default false,  -- if true, Pre-School partners must buy the kit (price shown upfront)
  partner_kit_price numeric(10,2) not null default 999,
  support_phone text default '',
  support_email text default '',
  whatsapp_number text default ''
);
insert into public.app_settings (id) values (1) on conflict do nothing;

-- =====================================================================
-- Helper functions
-- =====================================================================
create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from profiles where id = auth.uid() and role = 'admin');
$$;

create or replace function public.mask_phone(p text) returns text
language sql immutable as $$
  select case when p is null or length(p) < 6 then p
    else left(p, length(p) - 7) || 'xxx' || 'xx' || right(p, 2) end;
$$;

-- Create profile automatically on sign-up. Pass full_name, phone, ref_code in user metadata.
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  v_code text;
  v_ref uuid;
begin
  loop
    v_code := 'LE' || upper(substr(md5(random()::text), 1, 6));
    exit when not exists (select 1 from profiles where referral_code = v_code);
  end loop;
  select id into v_ref from profiles where referral_code = upper(coalesce(new.raw_user_meta_data->>'ref_code', ''));
  insert into profiles (id, full_name, phone, email, city, referral_code, referred_by)
  values (new.id,
          coalesce(new.raw_user_meta_data->>'full_name', ''),
          new.raw_user_meta_data->>'phone',
          new.email,
          new.raw_user_meta_data->>'city',
          v_code, v_ref);
  return new;
end $$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- Credit commission when an order becomes paid; reverse it on cancel/refund.
create or replace function public.handle_order_status() returns trigger
language plpgsql security definer set search_path = public as $$
declare v_pct numeric;
begin
  new.updated_at := now();
  if new.partner_id is null then return new; end if;
  if new.status = 'paid' and (tg_op = 'INSERT' or old.status <> 'paid') then
    select commission_pct into v_pct from products where id = new.product_id;
    new.commission_amount := round(new.amount * coalesce(v_pct, 0) / 100, 2);
  end if;
  return new;
end $$;
drop trigger if exists orders_status_before on public.orders;
create trigger orders_status_before before insert or update on public.orders
  for each row execute function public.handle_order_status();

create or replace function public.handle_order_ledger() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.partner_id is null then return new; end if;
  if new.status = 'paid' and (tg_op = 'INSERT' or old.status <> 'paid') then
    insert into wallet_transactions (partner_id, order_id, amount, kind, note)
    values (new.partner_id, new.id, new.commission_amount, 'commission', 'Commission for ' || new.order_code)
    on conflict do nothing;
    perform set_config('app.trusted', 'on', true);
    update profiles set points = points + 10 where id = new.partner_id;
    insert into notifications (user_id, title, body)
    values (new.partner_id, 'Commission earned 🎉', '₹' || new.commission_amount || ' credited for order ' || new.order_code);
  elsif tg_op = 'UPDATE' and old.status = 'paid' and new.status in ('cancelled', 'refunded') then
    insert into wallet_transactions (partner_id, order_id, amount, kind, note)
    values (new.partner_id, new.id, -old.commission_amount, 'reversal', 'Reversal for ' || new.order_code);
  end if;
  return new;
end $$;
drop trigger if exists orders_status_after on public.orders;
create trigger orders_status_after after insert or update on public.orders
  for each row execute function public.handle_order_ledger();

-- Public: buyer enrolls through a partner link (no login needed).
create or replace function public.create_order(
  p_product_slug text, p_ref_code text, p_name text, p_phone text,
  p_email text default null, p_address text default null
) returns text
language plpgsql security definer set search_path = public as $$
declare v_prod products; v_partner uuid; v_code text;
begin
  select * into v_prod from products where slug = p_product_slug and active;
  if v_prod.id is null then raise exception 'Product not found'; end if;
  if length(coalesce(p_name, '')) < 2 or length(regexp_replace(coalesce(p_phone, ''), '\D', '', 'g')) < 10 then
    raise exception 'Valid name and 10-digit phone are required';
  end if;
  select id into v_partner from profiles where referral_code = upper(p_ref_code);
  insert into orders (product_id, partner_id, buyer_name, buyer_phone, buyer_email, buyer_address, amount, kind, delivery)
  values (v_prod.id, v_partner, p_name, p_phone, p_email, p_address, v_prod.price,
          case when v_prod.billing = 'monthly' then 'subscription'
               when v_prod.mode = 'pro_school' then 'enrollment' else 'order' end,
          case when v_prod.is_physical then 'pending'::delivery_status else 'not_applicable'::delivery_status end)
  returning order_code into v_code;
  return v_code;
end $$;
grant execute on function public.create_order to anon, authenticated;

-- Partner requests a payout; checks balance and minimum.
create or replace function public.request_withdrawal(p_amount numeric) returns uuid
language plpgsql security definer set search_path = public as $$
declare v_bal numeric; v_min numeric; v_id uuid; v_upi text;
begin
  select coalesce(sum(amount), 0) into v_bal from wallet_transactions where partner_id = auth.uid();
  select min_withdrawal into v_min from app_settings where id = 1;
  select upi_id into v_upi from profiles where id = auth.uid();
  if v_upi is null and not exists (select 1 from profiles where id = auth.uid() and bank_account_number is not null) then
    raise exception 'Add UPI or bank details in Profile first';
  end if;
  if p_amount < v_min then raise exception 'Minimum withdrawal is ₹%', v_min; end if;
  if p_amount > v_bal then raise exception 'Amount exceeds wallet balance'; end if;
  insert into withdrawals (partner_id, amount, method) values (auth.uid(), p_amount, case when v_upi is null then 'bank' else 'upi' end)
  returning id into v_id;
  insert into wallet_transactions (partner_id, amount, kind, note) values (auth.uid(), -p_amount, 'withdrawal', 'Withdrawal request');
  return v_id;
end $$;
grant execute on function public.request_withdrawal to authenticated;

-- Partner says they paid for the kit → admin verifies and sets kit_status = 'paid'.
create or replace function public.request_partner_kit(p_payment_ref text) returns void
language plpgsql security definer set search_path = public as $$
begin
  perform set_config('app.trusted', 'on', true);
  update profiles set kit_status = 'pending' where id = auth.uid() and kit_status = 'not_paid';
  insert into support_tickets (user_id, subject, message) values (auth.uid(), 'Partner kit payment', 'Payment reference: ' || coalesce(p_payment_ref, '-'));
end $$;
grant execute on function public.request_partner_kit to authenticated;

-- Admin rejects a withdrawal → refund the hold.
create or replace function public.handle_withdrawal_reject() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.status = 'rejected' and old.status <> 'rejected' then
    insert into wallet_transactions (partner_id, amount, kind, note) values (new.partner_id, new.amount, 'reversal', 'Withdrawal rejected — refunded');
  end if;
  return new;
end $$;
drop trigger if exists withdrawals_reject on public.withdrawals;
create trigger withdrawals_reject after update on public.withdrawals
  for each row execute function public.handle_withdrawal_reject();

-- =====================================================================
-- Views partners read (buyer phone is MASKED — audit recommendation)
-- =====================================================================
create or replace view public.my_orders as
  select o.id, o.order_code, o.product_id, p.title as product_title, p.mode, o.buyer_name,
         public.mask_phone(o.buyer_phone) as buyer_phone_masked, o.amount, o.kind, o.status,
         o.delivery, o.commission_amount, o.created_at
  from orders o join products p on p.id = o.product_id
  where o.partner_id = auth.uid();
grant select on public.my_orders to authenticated;

-- Team = people who joined with your code. Income comes ONLY from your own sales (no recruitment income).
create or replace view public.my_team as
  select t.id, t.full_name, t.city, t.created_at,
         (select count(*) from orders o where o.partner_id = t.id and o.status = 'paid') as paid_sales
  from profiles t where t.referred_by = auth.uid();
grant select on public.my_team to authenticated;

-- =====================================================================
-- Row Level Security
-- =====================================================================
alter table public.profiles enable row level security;
alter table public.products enable row level security;
alter table public.orders enable row level security;
alter table public.wallet_transactions enable row level security;
alter table public.withdrawals enable row level security;
alter table public.notifications enable row level security;
alter table public.notification_reads enable row level security;
alter table public.support_tickets enable row level security;
alter table public.lessons enable row level security;
alter table public.app_settings enable row level security;

drop policy if exists "own profile read" on public.profiles;
create policy "own profile read" on public.profiles for select using (id = auth.uid() or public.is_admin());
drop policy if exists "own profile update" on public.profiles;
create policy "own profile update" on public.profiles for update using (id = auth.uid() or public.is_admin());
-- prevent partners from promoting themselves / editing protected fields
create or replace function public.protect_profile_fields() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() and coalesce(current_setting('app.trusted', true), '') <> 'on' then
    new.role := old.role; new.points := old.points; new.referral_code := old.referral_code;
    new.referred_by := old.referred_by; new.kit_status := old.kit_status;
    if new.kyc_status not in ('not_submitted', 'submitted') then new.kyc_status := old.kyc_status; end if;
  end if;
  return new;
end $$;
drop trigger if exists profiles_protect on public.profiles;
create trigger profiles_protect before update on public.profiles for each row execute function public.protect_profile_fields();

drop policy if exists "products public read" on public.products;
create policy "products public read" on public.products for select using (active or public.is_admin());
drop policy if exists "products admin write" on public.products;
create policy "products admin write" on public.products for all using (public.is_admin()) with check (public.is_admin());

-- Partners read orders only through my_orders view (masked); admins see everything.
drop policy if exists "orders admin" on public.orders;
create policy "orders admin" on public.orders for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "wallet own read" on public.wallet_transactions;
create policy "wallet own read" on public.wallet_transactions for select using (partner_id = auth.uid() or public.is_admin());

drop policy if exists "withdrawals own read" on public.withdrawals;
create policy "withdrawals own read" on public.withdrawals for select using (partner_id = auth.uid() or public.is_admin());
drop policy if exists "withdrawals admin update" on public.withdrawals;
create policy "withdrawals admin update" on public.withdrawals for update using (public.is_admin());

drop policy if exists "notifications read" on public.notifications;
create policy "notifications read" on public.notifications for select using (user_id is null or user_id = auth.uid() or public.is_admin());
drop policy if exists "notifications admin write" on public.notifications;
create policy "notifications admin write" on public.notifications for insert with check (public.is_admin());
drop policy if exists "reads own" on public.notification_reads;
create policy "reads own" on public.notification_reads for all using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "tickets own" on public.support_tickets;
create policy "tickets own" on public.support_tickets for select using (user_id = auth.uid() or public.is_admin());
drop policy if exists "tickets insert" on public.support_tickets;
create policy "tickets insert" on public.support_tickets for insert with check (user_id = auth.uid());

drop policy if exists "lessons read" on public.lessons;
create policy "lessons read" on public.lessons for select using (auth.role() = 'authenticated');
drop policy if exists "lessons admin" on public.lessons;
create policy "lessons admin" on public.lessons for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "settings read" on public.app_settings;
create policy "settings read" on public.app_settings for select using (true);
drop policy if exists "settings admin" on public.app_settings;
create policy "settings admin" on public.app_settings for update using (public.is_admin());

-- To make yourself admin after signing up once (the set_config line is required,
-- otherwise profiles_protect silently keeps the old role):
--   begin;
--   select set_config('app.trusted', 'on', true);
--   update public.profiles set role = 'admin' where email = 'you@example.com';
--   commit;
