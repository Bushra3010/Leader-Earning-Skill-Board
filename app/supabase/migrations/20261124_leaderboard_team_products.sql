-- Adds: product photo + MRP, leaderboard, team snapshot.
-- Safe to run more than once. Run in Supabase → SQL Editor.

-- Product photo and original price (MRP). When mrp > price the app shows a "% OFF" badge.
alter table public.products add column if not exists image_url text;
alter table public.products add column if not exists mrp numeric(10,2);

-- Team list now also says when each member last made a paid sale (for the Active filter).
create or replace view public.my_team as
  select t.id, t.full_name, t.city, t.created_at,
         (select count(*) from orders o where o.partner_id = t.id and o.status = 'paid') as paid_sales,
         (select max(o.created_at) from orders o where o.partner_id = t.id and o.status = 'paid') as last_sale_at
  from profiles t where t.referred_by = auth.uid();
grant select on public.my_team to authenticated;

-- Leaderboard: paid sales this calendar month. p_scope = 'city' (same city as you) or 'india'.
-- Returns the top 50 plus your own row. Exposes only name, city and sales total.
create or replace function public.leaderboard(p_scope text default 'india')
returns table(rank bigint, partner_id uuid, full_name text, city text, sales numeric, is_me boolean)
language sql stable security definer set search_path = public as $$
  with me as (
    select lower(trim(coalesce(pr.city, ''))) as c from profiles pr where pr.id = auth.uid()
  ), s as (
    select p.id as pid, p.full_name as fname, p.city as pcity,
           coalesce((select sum(o.amount) from orders o
                      where o.partner_id = p.id and o.status = 'paid'
                        and o.created_at >= date_trunc('month', now())), 0) as total
    from profiles p
    where p_scope <> 'city' or lower(trim(coalesce(p.city, ''))) = (select me.c from me)
  ), r as (
    select s.*, rank() over (order by s.total desc, s.fname) as rk
    from s where s.total > 0 or s.pid = auth.uid()
  )
  select r.rk, r.pid, r.fname, r.pcity, r.total, r.pid = auth.uid()
  from r where r.rk <= 50 or r.pid = auth.uid()
  order by r.rk;
$$;
revoke all on function public.leaderboard(text) from public, anon;
grant execute on function public.leaderboard(text) to authenticated;

-- Team snapshot for the signed-in partner: direct joins, all levels (up to 10 deep),
-- and the team's activity this month. Partners still earn only from their own link.
create or replace function public.my_team_stats() returns json
language sql stable security definer set search_path = public as $$
  with recursive d as (
    select p.id, 1 as lvl from profiles p where p.referred_by = auth.uid()
    union
    select p.id, d.lvl + 1 from profiles p join d on p.referred_by = d.id where d.lvl < 10
  )
  select json_build_object(
    'direct',       (select count(*) from d where d.lvl = 1),
    'downline',     (select count(distinct d.id) from d),
    'orders_month', (select count(*) from orders o where o.partner_id in (select d.id from d)
                       and o.created_at >= date_trunc('month', now())),
    'sales_month',  (select coalesce(sum(o.amount), 0) from orders o where o.partner_id in (select d.id from d)
                       and o.status = 'paid' and o.created_at >= date_trunc('month', now())),
    'last_order',   (select max(o.created_at) from orders o where o.partner_id in (select d.id from d))
  );
$$;
revoke all on function public.my_team_stats() from public, anon;
grant execute on function public.my_team_stats() to authenticated;
