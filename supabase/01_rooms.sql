-- Rooms table
create table if not exists public.rooms (
  id uuid primary key default gen_random_uuid(),
  host_name text not null,
  prompt text,
  mode text,
  topic text,
  max_minutes int not null default 5,
  is_pro boolean not null default false,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null
);

-- Index for room expiry queries
create index if not exists idx_rooms_expires_at on public.rooms(expires_at);

-- Enable RLS
alter table public.rooms enable row level security;

-- Rooms policies: anyone can insert and read (non-sensitive), no update/delete
create policy "rooms_insert_any" on public.rooms for insert to anon with check (true);
create policy "rooms_select_all" on public.rooms for select to anon using (true); 