-- Short demo videos (30–60 sec) shown on Home and on product pages. Admin uploads them.
create table if not exists public.demo_videos (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  video_url text not null,
  product_id uuid references public.products(id) on delete set null,
  sort_order integer not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now()
);
alter table public.demo_videos enable row level security;
drop policy if exists "videos read" on public.demo_videos;
create policy "videos read" on public.demo_videos for select using ((active and public.is_approved()) or public.is_admin());
drop policy if exists "videos admin" on public.demo_videos;
create policy "videos admin" on public.demo_videos for all using (public.is_admin()) with check (public.is_admin());

-- Video files: public bucket (so they play anywhere), only admins can upload/change/delete. 50 MB each.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('demo-videos', 'demo-videos', true, 52428800, array['video/mp4', 'video/webm', 'video/quicktime', 'video/3gpp'])
on conflict (id) do update set public = true, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;
drop policy if exists "demo videos read" on storage.objects;
create policy "demo videos read" on storage.objects for select using (bucket_id = 'demo-videos');
drop policy if exists "demo videos admin insert" on storage.objects;
create policy "demo videos admin insert" on storage.objects for insert to authenticated with check (bucket_id = 'demo-videos' and public.is_admin());
drop policy if exists "demo videos admin update" on storage.objects;
create policy "demo videos admin update" on storage.objects for update to authenticated using (bucket_id = 'demo-videos' and public.is_admin());
drop policy if exists "demo videos admin delete" on storage.objects;
create policy "demo videos admin delete" on storage.objects for delete to authenticated using (bucket_id = 'demo-videos' and public.is_admin());
