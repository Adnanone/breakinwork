-- Participants table
create table if not exists public.participants (
  id uuid primary key default gen_random_uuid(),
  room_id uuid references public.rooms(id) on delete cascade,
  display_name text not null,
  mood_emoji text default '☕️',
  joined_at timestamptz not null default now()
);

-- Enable RLS
alter table public.participants enable row level security;

-- Participants policies: insert/select for room
create policy "participants_insert_in_room" on public.participants for insert to anon with check (
  exists (select 1 from public.rooms r where r.id = room_id)
);
create policy "participants_select_in_room" on public.participants for select to anon using (
  exists (select 1 from public.rooms r where r.id = room_id)
); 

-- Realtime
alter publication supabase_realtime add table public.participants;