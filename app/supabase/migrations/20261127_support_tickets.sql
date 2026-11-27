-- Support requests: admin can read, reply to and close them; members see the reply.
alter table public.support_tickets add column if not exists admin_reply text;
alter table public.support_tickets add column if not exists replied_at timestamptz;

drop policy if exists "tickets admin update" on public.support_tickets;
create policy "tickets admin update" on public.support_tickets for update
  using (public.is_admin()) with check (public.is_admin());
