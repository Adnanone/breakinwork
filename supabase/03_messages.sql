-- Messages table
create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  room_id uuid references public.rooms(id) on delete cascade,
  sender_name text not null,
  text text,
  media_url text,
  media_type text,
  created_at timestamptz not null default now()
);

-- Index for performance
create index if not exists idx_messages_room_created on public.messages(room_id, created_at);

-- Enable RLS
alter table public.messages enable row level security;

-- Messages policies: insert/select limited to a valid room (basic check). No update/delete.
create policy "messages_insert_in_room" on public.messages for insert to anon with check (
  exists (select 1 from public.rooms r where r.id = room_id)
);
create policy "messages_select_in_room" on public.messages for select to anon using (
  exists (select 1 from public.rooms r where r.id = room_id)
);

-- Add to realtime publication
alter publication supabase_realtime add table public.messages; 