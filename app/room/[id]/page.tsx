"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Clock, Send, Image as ImageIcon, Mic, Square, X } from "lucide-react";
import { ChatMessage, NormalizedMessage } from "@/components/ChatMessage";
import { SaveMomentModal } from "@/components/SaveMomentModal";

type Message = {
  id: string;
  room_id: string;
  sender_name: string;
  text: string | null;
  media_url: string | null;
  media_type: string | null;
  created_at: string;
};

// Removed unused RoomHeader type

export default function RoomPage() {
  const { id } = useParams<{ id: string }>();
  const [name, setName] = useState("");
  const [mood, setMood] = useState("🔥");
  const [prompt, setPrompt] = useState<string | null>(null);
  const [endsAt, setEndsAt] = useState<Date | null>(null);
  const [durationMinutes, setDurationMinutes] = useState<number>(5);
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState("");
  const [participants, setParticipants] = useState<{ name: string; mood: string; isHost?: boolean }[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<BlobPart[]>([]);
  const [showIntro, setShowIntro] = useState(false);
  const [reactionsByMessage, setReactionsByMessage] = useState<Record<string, Record<string, number>>>({});
  const [participantId, setParticipantId] = useState<string | null>(null);
  const [showSaveMoment, setShowSaveMoment] = useState(false);

  useEffect(() => {
    const storedName = localStorage.getItem("biw_name") || "";
    const storedMood = localStorage.getItem("biw_mood") || "🔥";
    setName(storedName || "");
    setMood(storedMood);
    if (!storedName) setShowIntro(true);
  }, []);

  const recordParticipant = useCallback(async (displayName: string, currentMood: string) => {
    const key = `biw_participant_${id}`;
    const existing = localStorage.getItem(key);
    if (existing) {
      setParticipantId(existing);
      return;
    }
    const { data, error } = await supabase
      .from("participants")
      .insert({ room_id: id, display_name: displayName || "Guest", mood_emoji: currentMood })
      .select("id")
      .single();
    if (!error && data?.id) {
      localStorage.setItem(key, data.id);
      setParticipantId(data.id);
    }
  }, [id]);

  useEffect(() => {
    if (!name) return;
    recordParticipant(name, mood);
  }, [name, mood, recordParticipant]);

  useEffect(() => {
    let isMounted = true;

    async function bootstrap() {
      const [roomRes, msgsRes, partsRes] = await Promise.all([
        supabase.from("rooms").select("prompt, expires_at, max_minutes, starts_at, created_at").eq("id", id).maybeSingle(),
        supabase
          .from("messages")
          .select("id, room_id, sender_name, text, media_url, media_type, created_at")
          .eq("room_id", id)
          .order("created_at", { ascending: true }),
        supabase
          .from("participants")
          .select("display_name, mood_emoji, joined_at")
          .eq("room_id", id)
          .order("joined_at", { ascending: true }),
      ]);

      if (!isMounted) return;

      type RoomRow = {
        prompt: string | null;
        expires_at: string | null;
        starts_at?: string | null;
        created_at?: string | null;
        max_minutes?: number | null;
      } | null;
      const r = (roomRes.data as RoomRow) || null;
      setPrompt(r?.prompt ?? null);
      const expiresAtDate: Date | null = r?.expires_at ? new Date(r.expires_at) : null;
      const startsAtDate: Date | null = r?.starts_at ? new Date(r.starts_at) : (r?.created_at ? new Date(r.created_at) : null);
      const computedDuration: number = typeof r?.max_minutes === 'number' && r.max_minutes > 0
        ? r.max_minutes
        : (startsAtDate && expiresAtDate ? Math.max(1, Math.round((expiresAtDate.getTime() - startsAtDate.getTime()) / 60000)) : 5);
      setDurationMinutes(computedDuration);
      const computedEndsAt: Date | null = expiresAtDate || (startsAtDate ? new Date(startsAtDate.getTime() + computedDuration * 60000) : null);
      setEndsAt(computedEndsAt);

      setMessages(Array.isArray(msgsRes.data) ? (msgsRes.data as Message[]) : []);
      setParticipants(
        Array.isArray(partsRes.data)
          ? (partsRes.data as { display_name: string; mood_emoji: string }[]).map((p) => ({ name: p.display_name, mood: p.mood_emoji }))
          : []
      );

      const channel = supabase
        .channel(`room:${id}`, { config: { broadcast: { ack: true } } })
        .on(
          "postgres_changes",
          { event: "INSERT", schema: "public", table: "messages", filter: `room_id=eq.${id}` },
          (payload) => {
            setMessages((prev) => [...prev, payload.new as Message]);
          }
        )
        .on(
          "postgres_changes",
          { event: "INSERT", schema: "public", table: "participants", filter: `room_id=eq.${id}` },
          (payload) => {
            const p = payload.new as { display_name: string; mood_emoji: string };
            setParticipants((prev) => [...prev, { name: p.display_name, mood: p.mood_emoji }]);
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }

    bootstrap();
    return () => {
      isMounted = false;
    };
  }, [id]);

  useEffect(() => {
    // Load reactions for this room
    (async () => {
      const { data } = await supabase
        .from("message_reactions")
        .select("message_id, emoji")
        .eq("room_id", id);
      if (data) {
        type Row = { message_id: string; emoji: string };
        const agg: Record<string, Record<string, number>> = {};
        for (const r of data as Row[]) {
          agg[r.message_id] ||= {};
          agg[r.message_id][r.emoji] = (agg[r.message_id][r.emoji] || 0) + 1;
        }
        setReactionsByMessage(agg);
      }
    })();

    // Helper to recompute counts for a single message id
    const recomputeMessageCounts = async (messageId: string) => {
      const { data } = await supabase
        .from('message_reactions')
        .select('emoji')
        .eq('room_id', id)
        .eq('message_id', messageId);
      const counts: Record<string, number> = {};
      for (const row of (data as { emoji: string }[] | null) || []) {
        counts[row.emoji] = (counts[row.emoji] || 0) + 1;
      }
      setReactionsByMessage((prev) => ({ ...prev, [messageId]: counts }));
    };

    // Subscribe to new reactions and deletes
    const channel = supabase
      .channel(`reactions-${id}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'message_reactions', filter: `room_id=eq.${id}` },
        (payload) => {
          const r = payload.new as { message_id: string };
          if (!r?.message_id) return;
          recomputeMessageCounts(r.message_id);
        }
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'message_reactions', filter: `room_id=eq.${id}` },
        (payload) => {
          const r = payload.old as { message_id: string };
          if (!r?.message_id) return;
          recomputeMessageCounts(r.message_id);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [id]);

  async function sendText() {
    const trimmed = text.trim();
    if (!trimmed) return;
    if (!name.trim()) {
      setShowIntro(true);
      return;
    }
    setText("");
    await supabase.from("messages").insert({ room_id: id, sender_name: name || "Guest", text: trimmed });
  }

  async function uploadFile(file: Blob, contentType: string): Promise<string | null> {
    const inferExtension = (type: string): string => {
      if (type.startsWith("image/")) {
        const subtype = type.split("/")[1] || "bin";
        return (subtype.split("+")[0] || "bin").toLowerCase();
      }
      if (type.startsWith("audio/")) {
        const subtype = (type.split("/")[1] || "webm").toLowerCase();
        if (subtype.includes("ogg")) return "ogg";
        if (subtype.includes("mpeg")) return "mp3";
        if (subtype.includes("wav")) return "wav";
        if (subtype.includes("mp4")) return "m4a";
        return "webm";
      }
      return "bin";
    };

    const ext = inferExtension(contentType);
    const path = `${id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const { error } = await supabase.storage.from("media").upload(path, file, { contentType, upsert: false });
    if (error) {
      console.error("Upload failed:", error);
      alert(`Upload failed: ${error.message || "Unknown error"}`);
      return null;
    }
    const { data } = supabase.storage.from("media").getPublicUrl(path);
    return data.publicUrl || null;
  }

  async function onSelectImage(e: React.ChangeEvent<HTMLInputElement>) {
    const inputEl = e.currentTarget;
    const file = inputEl.files?.[0] || null;
    inputEl.value = "";
    if (!file) return;
    if (!name.trim()) {
      setShowIntro(true);
      return;
    }
    const url = await uploadFile(file, file.type);
    if (url) {
      await supabase
        .from("messages")
        .insert({ room_id: id, sender_name: name || "Guest", media_url: url, media_type: file.type });
    }
  }

  async function startRecording() {
    if (isRecording) return;
    if (!name.trim()) {
      setShowIntro(true);
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream, { mimeType: "audio/webm" });
      audioChunksRef.current = [];
      recorder.ondataavailable = (evt) => {
        if (evt.data.size > 0) audioChunksRef.current.push(evt.data);
      };
      recorder.onstop = async () => {
        const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        const url = await uploadFile(blob, "audio/webm");
        if (url) {
          await supabase
            .from("messages")
            .insert({ room_id: id, sender_name: name || "Guest", media_url: url, media_type: "audio/webm" });
        }
        stream.getTracks().forEach((t) => t.stop());
        setIsRecording(false);
      };
      mediaRecorderRef.current = recorder;
      recorder.start();
      setIsRecording(true);
      setTimeout(() => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
          mediaRecorderRef.current.stop();
        }
      }, 20000);
    } catch {
      alert("Microphone permission denied");
    }
  }

  function stopRecording() {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.stop();
    }
  }

  const remainingMs = useRemainingMs(endsAt);
  const isOver = !!endsAt && remainingMs <= 0;
  const remainingLabel = formatMs(remainingMs);

  useEffect(() => {
    if (endsAt && isOver) {
      // Only show the Save Moment modal here; defer cleanup until user chooses save or skip
      setShowSaveMoment(true);
    }
  }, [endsAt, isOver]);

  const normalizedMessages: NormalizedMessage[] = messages.map((m) => ({
    id: m.id,
    sender: m.sender_name || "?",
    text: m.text || undefined,
    mediaUrl: m.media_url || undefined,
    type: m.media_url ? (m.media_type?.startsWith("audio/") ? "audio" : "image") : "text",
    timestamp: new Date(m.created_at),
  }));

  const MOOD_EMOJIS = ["🔥", "☕️", "😅", "🎯", "🌟"];

  const handleReaction = async (messageId: string, emoji: string) => {
    const pidKey = `biw_participant_${id}`;
    const pid = participantId || localStorage.getItem(pidKey);
    if (!pid) {
      setShowIntro(true);
      return;
    }
    // Toggle: if exists for this participant, delete; otherwise insert
    const { data: existing, error } = await supabase
      .from('message_reactions')
      .select('id')
      .eq('room_id', id)
      .eq('message_id', messageId)
      .eq('emoji', emoji)
      .eq('reactor_id', pid)
      .maybeSingle();
    if (!error && existing?.id) {
      await supabase.from('message_reactions').delete().eq('id', existing.id);
    } else {
      await supabase.from('message_reactions').insert({ room_id: id, message_id: messageId, emoji, reactor_id: pid });
    }
  };

  return (
    <div className="h-screen overflow-hidden flex flex-col bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => history.back()}>
              <X className="w-4 h-4" />
            </Button>
            <div>
              <h2 className="font-medium">Break Room</h2>
              <p className="text-sm text-muted-foreground italic">&quot;{prompt || "Prompt-of-the-day"}&quot;</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Badge 
              variant={remainingMs > 60_000 ? 'default' : 'destructive'} 
              className="flex items-center gap-1"
            >
              <Clock className="w-3 h-3" />
              <span suppressHydrationWarning>{remainingLabel}</span>
            </Badge>
            <Button
              variant="secondary"
              size="sm"
              onClick={async () => {
                const url = window.location.href;
                const title = 'Break Room';
                const text = prompt ? `Join: "${prompt}"` : 'Join my break';
                try {
                  if (navigator.share) {
                    await navigator.share({ url, title, text });
                    return;
                  }
                } catch {}
                try {
                  await navigator.clipboard.writeText(url);
                  alert('Link copied to clipboard');
                  return;
                } catch {}
                try {
                  const el = document.createElement('textarea');
                  el.value = url;
                  document.body.appendChild(el);
                  el.select();
                  document.execCommand('copy');
                  document.body.removeChild(el);
                  alert('Link copied to clipboard');
                } catch {
                  // As a last resort, navigate to the URL so user can copy
                  window.prompt('Copy this link', url);
                }
              }}
            >
              Share
            </Button>
          </div>
        </div>
      </header>

      <div className="flex-1 flex min-h-0">
        {/* Sidebar - Participants */}
        <aside className="w-64 border-r bg-muted/20 p-4 h-full overflow-hidden">
          <div className="space-y-4">
            <div>
              <h3 className="font-medium mb-3">In this break ({participants.length})</h3>
              <div className="space-y-2">
                {participants.map((p, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <Avatar className="w-8 h-8">
                      <AvatarFallback className="text-xs">{p.name?.charAt(0) || "?"}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="text-sm font-medium flex items-center gap-1">
                        {p.name}
                        {p.isHost && <Badge variant="secondary" className="text-xs">Host</Badge>}
                      </div>
                    </div>
                    <span className="text-lg">{p.mood || "☕️"}</span>
                  </div>
                ))}
              </div>
            </div>

            <Separator />

            {/* Mood Selector */}
            <div>
              <h4 className="text-sm font-medium mb-2">Your mood</h4>
              <div className="grid grid-cols-3 gap-1">
                {MOOD_EMOJIS.map((m) => (
                  <Button
                    key={m}
                    variant={mood === m ? "default" : "ghost"}
                    size="sm"
                    onClick={() => {
                      setMood(m);
                      localStorage.setItem("biw_mood", m);
                      recordParticipant(name || "Guest", m);
                    }}
                    className="text-lg p-1"
                    title={m}
                  >
                    {m}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </aside>

        {/* Main Chat Area */}
        <main className="flex-1 flex flex-col min-h-0">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
            {normalizedMessages.length === 0 && (
              <div className="text-center text-muted-foreground text-sm py-8">
                No messages yet — drop a pic, a thought, or a voice clip.
              </div>
            )}
            {normalizedMessages.map((msg) => (
              <ChatMessage
                key={msg.id}
                message={msg}
                isOwn={msg.sender === (name || "Guest")}
                onReaction={(emoji) => handleReaction(msg.id, emoji)}
                reactionCounts={reactionsByMessage[msg.id]}
              />
            ))}
          </div>

          {/* Composer */}
          <div className="border-t p-4">
            <div className="flex items-center gap-2">
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  title="Upload image"
                  disabled={isOver}
                >
                  <ImageIcon className="w-4 h-4" />
                </Button>
                <Button
                  variant={isRecording ? "destructive" : "ghost"}
                  size="sm"
                  onClick={isRecording ? stopRecording : startRecording}
                  title={isRecording ? "Stop recording" : "Record voice"}
                  disabled={isOver}
                >
                  {isRecording ? <Square className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                </Button>
              </div>

              <Input
                ref={inputRef}
                placeholder={isOver ? "Break has ended" : "Share something..."}
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && sendText()}
                disabled={isOver}
                className="flex-1"
              />

              <Button onClick={sendText} disabled={!text.trim() || isOver} size="sm">
                <Send className="w-4 h-4" />
              </Button>

              <input ref={fileInputRef} type="file" accept="image/*" onChange={onSelectImage} className="hidden" />
            </div>
          </div>
        </main>
      </div>

      {/* Intro modal */}
      {showIntro && (
        <div className="fixed inset-0 bg-black/70 grid place-items-center p-4">
          <div className="w-full max-w-md rounded-2xl bg-card border p-6 space-y-4">
            <div className="text-lg font-semibold">You’re about to join</div>
            <div className="text-sm text-muted-foreground">Set a display name and mood.</div>
            <div className="flex items-center gap-2">
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" />
              <select
                className="rounded-lg bg-card border px-2 py-2 text-sm"
                value={mood}
                onChange={(e) => setMood(e.target.value)}
              >
                {MOOD_EMOJIS.map((m) => (
                  <option key={m}>{m}</option>
                ))}
              </select>
            </div>
            <Button
              onClick={() => {
                if (!name.trim()) return;
                localStorage.setItem("biw_name", name.trim());
                localStorage.setItem("biw_mood", mood);
                setShowIntro(false);
              }}
              className="w-full"
            >
              Join now
            </Button>
          </div>
        </div>
      )}
      {showSaveMoment && (
        <SaveMomentModal
          open={showSaveMoment}
          onClose={() => {
            setShowSaveMoment(false);
            fetch("/api/cleanup", { method: "POST" }).catch(console.error);
            // Navigate home once the break ended and user dismissed the modal
            try { window.location.href = "/"; } catch {}
          }}
          onSaved={() => {
            fetch("/api/cleanup", { method: "POST" }).catch(console.error);
            try { window.location.href = "/"; } catch {}
          }}
          roomId={id}
          prompt={prompt || ""}
          durationMinutes={durationMinutes}
          participantsCount={participants.length}
          messages={normalizedMessages}
          createdBy={name || "Guest"}
        />
      )}
    </div>
  );
}

function useRemainingMs(endsAt: Date | null) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(t);
  }, []);
  return useMemo(() => {
    if (!endsAt) return 0;
    return Math.max(0, endsAt.getTime() - now);
  }, [endsAt, now]);
}

function formatMs(ms: number) {
  const totalSec = Math.floor(ms / 1000);
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
} 