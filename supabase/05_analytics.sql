-- Analytics table to keep minimal data after cleanup
create table if not exists public.room_analytics (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null, -- no foreign key to allow keeping after room deletion
  host_name text not null,
  mode text,
  topic text,
  max_minutes int not null,
  is_pro boolean not null,
  participant_count int default 0,
  message_count int default 0,
  moment_count int default 0,
  created_at timestamptz not null default now(),
  expired_at timestamptz not null
);

-- Index for analytics queries
create index if not exists idx_room_analytics_created_at on public.room_analytics(created_at);

-- Enable RLS
alter table public.room_analytics enable row level security;

-- Analytics policies: read-only for service role (cleanup function), no anon access
create policy "analytics_insert_service" on public.room_analytics for insert to service_role with check (true);
create policy "analytics_select_service" on public.room_analytics for select to service_role using (true); 