-- Storage policies for bucket `media`
-- Ensure the bucket exists: in Dashboard > Storage, create bucket `media` (public)

-- Allow read for all objects in `media`
create policy "storage_read_media" on storage.objects for select to anon using (
  bucket_id = 'media'
);

-- Allow insert to `media` for any path under a room folder: '<room_id>/<file>'
create policy "storage_insert_media" on storage.objects for insert to anon with check (
  bucket_id = 'media' and (position('/' in path::text) > 0)
);

-- Allow delete for service role (cleanup)
create policy "storage_delete_media" on storage.objects for delete to service_role using (
  bucket_id = 'media'
); 