import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { hostName, mode, prompt, minutes = 5, topic, isPro = false, startsAt } = body || {};
    if (!hostName) return NextResponse.json({ error: "Missing hostName" }, { status: 400 });

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !anon) return NextResponse.json({ error: "Supabase not configured" }, { status: 500 });

    const supabase = createClient(url, anon);

    const now = new Date();
    const starts = startsAt ? new Date(startsAt) : now;
    const expires = new Date(starts.getTime() + minutes * 60 * 1000);

    const { data, error } = await supabase
      .from("rooms")
      .insert({
        host_name: hostName,
        mode,
        prompt,
        max_minutes: minutes,
        is_pro: !!isPro,
        topic,
        starts_at: starts.toISOString(),
        expires_at: expires.toISOString(),
      })
      .select("id")
      .single();

    if (error) throw error;

    return NextResponse.json({ id: data.id });
  } catch {
    return NextResponse.json({ error: "Failed to create room" }, { status: 500 });
  }
} 