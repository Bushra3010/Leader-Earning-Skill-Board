-- Fix: picture uploads failed with "new row violates row-level security policy".
-- Supabase Storage needs a SELECT policy as well as INSERT for uploads to the bucket.
-- Pictures are public anyway (they appear on posters and link previews).
drop policy if exists "product images read" on storage.objects;
create policy "product images read" on storage.objects for select
  using (bucket_id = 'product-images');
