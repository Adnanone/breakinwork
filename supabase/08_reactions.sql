create table if not exists public.message_reactions (
  id uuid primary key default gen_random_uuid(),
  room_id uuid references public.rooms(id) on delete cascade,
  message_id uuid references public.messages(id) on delete cascade,
  emoji text not null,
  reactor_id uuid references public.participants(id) on delete cascade,
  created_at timestamptz not null default now()
);

-- Prevent duplicate reactions from the same participant for the same emoji on the same message
do $$ begin
  create unique index if not exists uq_message_reactions_unique
  on public.message_reactions(room_id, message_id, emoji, reactor_id);
exception when others then null; end $$;

create index if not exists idx_message_reactions_room on public.message_reactions(room_id);
create index if not exists idx_message_reactions_message on public.message_reactions(message_id);

alter table public.message_reactions enable row level security;

create policy "message_reactions_insert_in_room" on public.message_reactions
for insert to anon with check (
  exists (select 1 from public.rooms r where r.id = room_id)
);

create policy "message_reactions_select_in_room" on public.message_reactions
for select to anon using (
  exists (select 1 from public.rooms r where r.id = room_id)
);

create policy "message_reactions_delete_in_room" on public.message_reactions
for delete to anon using (
  exists (select 1 from public.rooms r where r.id = room_id)
);

alter publication supabase_realtime add table public.message_reactions; 

-- Ensure delete payloads include old row data
alter table public.message_reactions replica identity full;