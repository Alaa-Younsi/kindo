-- KINDO — storage buckets: product-images, product-videos
-- Public read (storefront needs no auth to view media), authenticated write.

insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('product-videos', 'product-videos', true)
on conflict (id) do nothing;

create policy "product_images_public_read" on storage.objects
  for select to anon using (bucket_id = 'product-images');

create policy "product_images_admin_write" on storage.objects
  for insert to authenticated with check (bucket_id = 'product-images');

create policy "product_images_admin_update" on storage.objects
  for update to authenticated using (bucket_id = 'product-images')
  with check (bucket_id = 'product-images');

create policy "product_images_admin_delete" on storage.objects
  for delete to authenticated using (bucket_id = 'product-images');

create policy "product_videos_public_read" on storage.objects
  for select to anon using (bucket_id = 'product-videos');

create policy "product_videos_admin_write" on storage.objects
  for insert to authenticated with check (bucket_id = 'product-videos');

create policy "product_videos_admin_update" on storage.objects
  for update to authenticated using (bucket_id = 'product-videos')
  with check (bucket_id = 'product-videos');

create policy "product_videos_admin_delete" on storage.objects
  for delete to authenticated using (bucket_id = 'product-videos');
