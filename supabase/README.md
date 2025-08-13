# Supabase setup

Execute these SQL files in order:

1. `01_rooms.sql` - Creates rooms table and policies
2. `02_participants.sql` - Creates participants table and policies  
3. `03_messages.sql` - Creates messages table, policies, and realtime
4. `04_moments.sql` - Creates moments table and policies
5. `05_analytics.sql` - Creates analytics table and policies
6. `06_storage_policies.sql` - Creates storage bucket policies
7. `07_cleanup_functions.sql` - Creates cleanup functions

## Storage Bucket Setup

1. Go to Storage in your Supabase dashboard
2. Create a new bucket called `media`
3. Set it to "Public" (or use RLS policies for private)
4. The bucket will store:
   - Images: `{room_id}/{timestamp}-{random}.jpg/png/etc`
   - Audio: `{room_id}/{timestamp}-{random}.webm`

## Environment Variables

Copy your Project URL and anon key into `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=your_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

## Automatic Cleanup

The app includes automatic cleanup of expired room data:
- Messages are deleted when room expires
- Media files are deleted from storage
- Participants and moments are cleaned up
- Only minimal analytics data is kept

Run the cleanup function periodically or set up a cron job. 