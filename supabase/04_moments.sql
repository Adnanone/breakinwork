-- Moments table
create table if not exists public.moments (
  id uuid primary key default gen_random_uuid(),
  room_id uuid references public.rooms(id) on delete cascade,
  snapshot_json jsonb,
  download_url text,
  created_by text,
  created_at timestamptz not null default now()
);

-- Enable RLS
alter table public.moments enable row level security;

-- Moments policies: insert/select allowed by room (non-sensitive bundle); no update/delete
create policy "moments_insert_in_room" on public.moments for insert to anon with check (
  exists (select 1 from public.rooms r where r.id = room_id)
);
create policy "moments_select_in_room" on public.moments for select to anon using (
  exists (select 1 from public.rooms r where r.id = room_id)
); 