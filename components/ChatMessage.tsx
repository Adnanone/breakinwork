"use client";

import React, { useMemo, useState } from "react";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Heart, Laugh, Sparkles, Play, Pause, Volume2 } from "lucide-react";

export type NormalizedMessage = {
  id: string;
  sender: string;
  text?: string;
  mediaUrl?: string;
  type: "text" | "image" | "audio";
  timestamp: Date;
  durationSec?: number;
};

interface ChatMessageProps {
  message: NormalizedMessage;
  isOwn: boolean;
  onReaction?: (reaction: string) => void;
  reactionCounts?: Record<string, number>;
}

const REACTIONS = [
  { icon: Heart, emoji: "❤️", label: "love" },
  { icon: Laugh, emoji: "😂", label: "laugh" },
  { icon: Sparkles, emoji: "✨", label: "spark" },
];

export function ChatMessage({ message, isOwn, onReaction, reactionCounts }: ChatMessageProps) {
  const [isPlaying, setIsPlaying] = useState(false);

  const formatTime = (date: Date) => date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  // Precompute stable waveform bar heights to avoid hydration mismatches and layout shifts
  const waveformHeights = useMemo(() => {
    const count = 20;
    const heights: number[] = [];
    // Simple seeded PRNG based on message id to keep values stable
    let seed = 0;
    for (let i = 0; i < message.id.length; i++) seed = (seed * 31 + message.id.charCodeAt(i)) >>> 0;
    const rnd = () => {
      seed = (1103515245 * seed + 12345) % 0x80000000;
      return seed / 0x80000000;
    };
    for (let i = 0; i < count; i++) {
      const v = 4 + Math.floor(rnd() * 16); // 4..20 px
      heights.push(v);
    }
    return heights;
  }, [message.id]);

  return (
    <div className={`flex gap-3 group ${isOwn ? "flex-row-reverse" : ""}`}>
      <Avatar className="w-8 h-8">
        <AvatarFallback className="text-xs">{message.sender.charAt(0)}</AvatarFallback>
      </Avatar>

      <div className={`flex-1 max-w-md space-y-1 ${isOwn ? "items-end" : "items-start"} flex flex-col`}>
        <div className={`flex items-center gap-2 ${isOwn ? "flex-row-reverse" : ""}`}>
          <span className="text-sm font-medium">{message.sender}</span>
          <span className="text-xs text-muted-foreground">{formatTime(message.timestamp)}</span>
        </div>

        <div
          className={`rounded-lg px-3 py-2 relative ${isOwn ? "bg-primary text-primary-foreground" : "bg-muted"}`}
        >
          {message.type === "text" && <p className="text-sm">{message.text}</p>}

          {message.type === "image" && (
            <div className="space-y-2">
              {message.text && <p className="text-sm">{message.text}</p>}
              {message.mediaUrl && (
                // Using img to keep it simple (can be swapped to next/image later)
                <img src={message.mediaUrl} alt="Shared image" className="max-w-full h-auto rounded border" />
              )}
            </div>
          )}

          {message.type === "audio" && (
            <div className="flex items-center gap-3 min-w-48">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsPlaying(!isPlaying)}
                className="w-8 h-8 p-0 rounded-full"
              >
                {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              </Button>

              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <Volume2 className="w-3 h-3 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">{message.durationSec ?? 12}s</span>
                </div>
                <div className="flex items-center gap-0.5 h-4">
                  {waveformHeights.map((h, i) => (
                    <div
                      key={i}
                      className={`w-0.5 bg-current transition-all ${isPlaying && i % 3 === 0 ? "opacity-100" : "opacity-40"}`}
                      style={{ height: `${h}px` }}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Reactions row: always visible */}
        <div className={`flex items-center gap-2 ${isOwn ? "flex-row-reverse" : ""}`}>
          {/* Counts */}
          <div className="flex gap-1">
            {Object.entries(reactionCounts || {}).map(([emoji, count]) => (
              <Badge key={emoji} variant="secondary" className="text-xs px-2 py-0">
                {emoji} {count}
              </Badge>
            ))}
          </div>
          {/* Action buttons */}
          <div className="flex gap-1">
            {REACTIONS.map((r) => (
              <Button
                key={r.label}
                variant="ghost"
                size="sm"
                onClick={() => onReaction?.(r.emoji)}
                className="w-6 h-6 p-0 rounded-full"
                title={r.label}
              >
                <r.icon className="w-3 h-3" />
              </Button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
} 