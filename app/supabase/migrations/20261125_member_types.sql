-- Member types (Admin / Partner / Associate), admin approval of new sign-ups,
-- per-type menu settings, leaderboard pins and the admin Members list.
-- Run once in Supabase → SQL Editor (safe to run again).

begin;

-- ---------- 1. Member types ----------
-- partner   = paid the partner fee (₹999 kit) → can build a team
-- associate = free member, sells products through their own link, no team
alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles add constraint profiles_role_check check (role in ('admin', 'partner', 'associate'));
alter table public.profiles alter column role set default 'associate';

-- ---------- 2. Approval + leaderboard pin ----------
alter table public.profiles add column if not exists approval_status text not null default 'pending';
alter table public.profiles drop constraint if exists profiles_approval_status_check;
alter table public.profiles add constraint profiles_approval_status_check check (approval_status in ('pending', 'approved', 'rejected'));
alter table public.profiles add column if not exists leaderboard_pin smallint;
alter table public.profiles drop constraint if exists profiles_leaderboard_pin_check;
alter table public.profiles add constraint profiles_leaderboard_pin_check check (leaderboard_pin between 1 and 10);

-- Existing members keep their access. Partners who never paid the fee become Associates.
select set_config('app.trusted', 'on', true);
update public.profiles set approval_status = 'approved' where approval_status = 'pending' and created_at < now() - interval '1 second';
update public.profiles set role = 'associate' where role = 'partner' and kit_status <> 'paid';
select set_config('app.trusted', 'off', true);

-- Members cannot change their own type, approval or pin.
create or replace function public.protect_profile_fields() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() and coalesce(current_setting('app.trusted', true), '') <> 'on' then
    new.role := old.role; new.points := old.points; new.referral_code := old.referral_code;
    new.referred_by := old.referred_by; new.kit_status := old.kit_status;
    new.approval_status := old.approval_status; new.leaderboard_pin := old.leaderboard_pin;
    if new.kyc_status not in ('not_submitted', 'submitted') then new.kyc_status := old.kyc_status; end if;
  end if;
  return new;
end $$;

-- When the partner fee is marked paid, an Associate becomes a Partner automatically.
create or replace function public.upgrade_on_kit_paid() returns trigger
language plpgsql set search_path = public as $$
begin
  if new.kit_status = 'paid' and old.kit_status is distinct from 'paid' and new.role = 'associate' then
    new.role := 'partner';
  end if;
  return new;
end $$;
drop trigger if exists profiles_upgrade_on_kit on public.profiles;
create trigger profiles_upgrade_on_kit before update of kit_status on public.profiles
  for each row execute function public.upgrade_on_kit_paid();

create or replace function public.is_approved() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from profiles where id = auth.uid() and (approval_status = 'approved' or role = 'admin'));
$$;
grant execute on function public.is_approved() to authenticated;

-- Unapproved members can't read lessons or request withdrawals.
drop policy if exists "lessons read" on public.lessons;
create policy "lessons read" on public.lessons for select using (public.is_approved());

create or replace function public.request_withdrawal(p_amount numeric) returns uuid
language plpgsql security definer set search_path = public as $$
declare v_bal numeric; v_min numeric; v_id uuid; v_upi text;
begin
  if not public.is_approved() then raise exception 'Your account is waiting for approval'; end if;
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

-- ---------- 3. Menu settings per member type ----------
alter table public.app_settings add column if not exists role_features jsonb not null
  default '{"partner": ["team", "leaderboard", "posters", "cards", "learn"], "associate": ["leaderboard", "posters", "cards", "learn"]}'::jsonb;

-- ---------- 4. Leaderboard: admin pins first, then by paid sales ----------
drop function if exists public.leaderboard(text);
create function public.leaderboard(p_scope text default 'india')
returns table(rank bigint, partner_id uuid, full_name text, city text, sales numeric, is_me boolean, pinned boolean)
language sql stable security definer set search_path = public as $$
  with me as (
    select lower(trim(coalesce(pr.city, ''))) as c from profiles pr where pr.id = auth.uid()
  ), s as (
    select p.id as pid, p.full_name as fname, p.city as pcity, p.leaderboard_pin as pin,
           coalesce((select sum(o.amount) from orders o
                      where o.partner_id = p.id and o.status = 'paid'
                        and o.created_at >= date_trunc('month', now())), 0) as total
    from profiles p
    where p.approval_status = 'approved'
      and (p_scope <> 'city' or lower(trim(coalesce(p.city, ''))) = (select me.c from me))
  ), r as (
    select s.*, rank() over (order by (s.pin is null), s.pin, s.total desc, s.fname) as rk
    from s where s.total > 0 or s.pid = auth.uid() or s.pin is not null
  )
  select r.rk, r.pid, r.fname, r.pcity, r.total, r.pid = auth.uid(), r.pin is not null
  from r where public.is_approved() and (r.rk <= 50 or r.pid = auth.uid())
  order by r.rk;
$$;
revoke all on function public.leaderboard(text) from public, anon;
grant execute on function public.leaderboard(text) to authenticated;

create or replace function public.my_team_stats() returns json
language sql stable security definer set search_path = public as $$
  with recursive d as (
    select p.id, 1 as lvl from profiles p where p.referred_by = auth.uid()
    union
    select p.id, d.lvl + 1 from profiles p join d on p.referred_by = d.id where d.lvl < 10
  )
  select case when not public.is_approved() then null else json_build_object(
    'direct',       (select count(*) from d where d.lvl = 1),
    'downline',     (select count(distinct d.id) from d),
    'orders_month', (select count(*) from orders o where o.partner_id in (select d.id from d)
                       and o.created_at >= date_trunc('month', now())),
    'sales_month',  (select coalesce(sum(o.amount), 0) from orders o where o.partner_id in (select d.id from d)
                       and o.status = 'paid' and o.created_at >= date_trunc('month', now())),
    'last_order',   (select max(o.created_at) from orders o where o.partner_id in (select d.id from d))
  ) end;
$$;

-- ---------- 5. Admin: every member with sales, incentive and payouts ----------
create or replace view public.admin_member_stats as
  select p.id, p.full_name, p.email, p.phone, p.city, p.referral_code, p.role, p.kit_status, p.kyc_status,
         p.approval_status, p.leaderboard_pin, p.created_at,
         up.full_name as upline_name, up.referral_code as upline_code,
         (select count(*) from profiles t where t.referred_by = p.id) as team_size,
         (select count(*) from orders o where o.partner_id = p.id and o.status = 'paid') as paid_orders,
         (select coalesce(sum(o.amount), 0) from orders o where o.partner_id = p.id and o.status = 'paid') as sales_amount,
         (select coalesce(sum(w.amount), 0) from wallet_transactions w where w.partner_id = p.id and w.kind in ('commission', 'bonus', 'reversal')) as incentive_earned,
         (select coalesce(sum(x.amount), 0) from withdrawals x where x.partner_id = p.id and x.status = 'paid') as paid_out,
         (select coalesce(sum(x.amount), 0) from withdrawals x where x.partner_id = p.id and x.status in ('requested', 'approved')) as pending_payout,
         (select coalesce(sum(w.amount), 0) from wallet_transactions w where w.partner_id = p.id) as wallet_balance
  from profiles p left join profiles up on up.id = p.referred_by
  where public.is_admin();
revoke all on public.admin_member_stats from anon;
grant select on public.admin_member_stats to authenticated;

commit;
