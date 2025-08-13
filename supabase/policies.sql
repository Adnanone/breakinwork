-- Enable RLS
alter table public.rooms enable row level security;
alter table public.participants enable row level security;
alter table public.messages enable row level security;
alter table public.moments enable row level security;
alter table public.room_analytics enable row level security;

-- Rooms: anyone can insert and read (non-sensitive), no update/delete
create policy "rooms_insert_any" on public.rooms for insert to anon with check (true);
create policy "rooms_select_all" on public.rooms for select to anon using (true);

-- Messages: insert/select limited to a valid room (basic check). No update/delete.
create policy "messages_insert_in_room" on public.messages for insert to anon with check (
  exists (select 1 from public.rooms r where r.id = room_id)
);
create policy "messages_select_in_room" on public.messages for select to anon using (
  exists (select 1 from public.rooms r where r.id = room_id)
);

-- Participants: insert/select for room
create policy "participants_insert_in_room" on public.participants for insert to anon with check (
  exists (select 1 from public.rooms r where r.id = room_id)
);
create policy "participants_select_in_room" on public.participants for select to anon using (
  exists (select 1 from public.rooms r where r.id = room_id)
);

-- Moments: insert/select allowed by room (non-sensitive bundle); no update/delete
create policy "moments_insert_in_room" on public.moments for insert to anon with check (
  exists (select 1 from public.rooms r where r.id = room_id)
);
create policy "moments_select_in_room" on public.moments for select to anon using (
  exists (select 1 from public.rooms r where r.id = room_id)
);

-- Analytics: read-only for service role (cleanup function), no anon access
create policy "analytics_insert_service" on public.room_analytics for insert to service_role with check (true);
create policy "analytics_select_service" on public.room_analytics for select to service_role using (true);

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