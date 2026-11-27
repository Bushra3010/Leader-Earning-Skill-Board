-- Per-member menu overrides, e.g. {"cards": true, "learn": false}.
-- Missing keys follow the member type's settings (Admin → Settings).
alter table public.profiles add column if not exists feature_overrides jsonb not null default '{}'::jsonb;

-- Members cannot change their own overrides.
create or replace function public.protect_profile_fields() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() and coalesce(current_setting('app.trusted', true), '') <> 'on' then
    new.role := old.role; new.points := old.points; new.referral_code := old.referral_code;
    new.referred_by := old.referred_by; new.kit_status := old.kit_status;
    new.approval_status := old.approval_status; new.leaderboard_pin := old.leaderboard_pin;
    new.feature_overrides := old.feature_overrides;
    if new.kyc_status not in ('not_submitted', 'submitted') then new.kyc_status := old.kyc_status; end if;
  end if;
  return new;
end $$;

-- Members list also returns the overrides (new column added at the end).
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
         (select coalesce(sum(w.amount), 0) from wallet_transactions w where w.partner_id = p.id) as wallet_balance,
         p.feature_overrides
  from profiles p left join profiles up on up.id = p.referred_by
  where public.is_admin();
