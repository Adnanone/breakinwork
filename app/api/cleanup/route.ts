import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(request: Request) {
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !anon) return NextResponse.json({ error: "Supabase not configured" }, { status: 500 });

    // Call the cleanup function
    const { error: cleanupError } = await supabase.rpc("cleanup_expired_rooms");
    if (cleanupError) {
      console.error("Cleanup error:", cleanupError);
      return NextResponse.json({ error: "Database cleanup failed" }, { status: 500 });
    }

    // Clean up orphaned storage files
    const { data: expiredRooms } = await supabase
      .from("room_analytics")
      .select("room_id")
      .gte("expired_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()); // Last 24 hours

    if (expiredRooms && expiredRooms.length > 0) {
      const roomIds = expiredRooms.map(r => r.room_id);
      
      // Delete storage files for expired rooms
      for (const roomId of roomIds) {
        try {
          const { data: files, error: listError } = await supabase.storage
            .from("media")
            .list(roomId);
          
          if (!listError && files) {
            const filePaths = files.map(f => `${roomId}/${f.name}`);
            if (filePaths.length > 0) {
              const { error: deleteError } = await supabase.storage
                .from("media")
                .remove(filePaths);
              
              if (deleteError) {
                console.error(`Failed to delete files for room ${roomId}:`, deleteError);
              }
            }
          }
        } catch (e) {
          console.error(`Error cleaning up storage for room ${roomId}:`, e);
        }
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: "Cleanup completed",
      cleanedRooms: expiredRooms?.length || 0
    });
  } catch (e) {
    console.error("Cleanup API error:", e);
    return NextResponse.json({ error: "Cleanup failed" }, { status: 500 });
  }
}

// GET endpoint for manual cleanup trigger
export async function GET() {
  return NextResponse.json({ 
    message: "Use POST to trigger cleanup",
    cron: "0 */6 * * *" // Every 6 hours
  });
} 