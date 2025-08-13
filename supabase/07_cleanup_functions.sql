-- Function to clean up expired rooms and their data
create or replace function cleanup_expired_rooms()
returns void
language plpgsql
security definer
as $$
declare
  expired_room record;
  media_files text[];
  file_path text;
begin
  -- Loop through expired rooms
  for expired_room in
    select id, host_name, mode, topic, max_minutes, is_pro, created_at, expires_at
    from public.rooms
    where expires_at < now()
  loop
    -- Collect media files to delete from storage
    select array_agg(media_url) into media_files
    from public.messages
    where room_id = expired_room.id and media_url is not null;
    
    -- Insert analytics data before deletion
    insert into public.room_analytics (
      room_id, host_name, mode, topic, max_minutes, is_pro,
      participant_count, message_count, moment_count,
      created_at, expired_at
    )
    select 
      expired_room.id,
      expired_room.host_name,
      expired_room.mode,
      expired_room.topic,
      expired_room.max_minutes,
      expired_room.is_pro,
      (select count(*) from public.participants where room_id = expired_room.id),
      (select count(*) from public.messages where room_id = expired_room.id),
      (select count(*) from public.moments where room_id = expired_room.id),
      expired_room.created_at,
      expired_room.expires_at;
    
    -- Delete the room (cascades to messages, participants, moments)
    delete from public.rooms where id = expired_room.id;
    
    -- Note: Storage files will be cleaned up by a separate process
    -- since we can't directly delete from storage in this function
  end loop;
end;
$$;

-- Function to clean up orphaned storage files
create or replace function cleanup_orphaned_media()
returns void
language plpgsql
security definer
as $$
declare
  orphaned_file record;
begin
  -- This function would be called by a separate process
  -- that has access to storage.delete() API
  -- For now, we just log what would be cleaned up
  raise notice 'Storage cleanup would be handled by external process';
end;
$$; 