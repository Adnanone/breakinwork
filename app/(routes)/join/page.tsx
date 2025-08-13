"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function JoinPage() {
  const router = useRouter();
  const [value, setValue] = useState("");

  function parseRoomId(input: string) {
    try {
      const url = new URL(input);
      const parts = url.pathname.split("/").filter(Boolean);
      const idx = parts.findIndex((p) => p === "room");
      if (idx >= 0 && parts[idx + 1]) return parts[idx + 1];
    } catch {}
    return input.trim();
  }

  function onJoin(e: React.FormEvent) {
    e.preventDefault();
    const id = parseRoomId(value);
    if (!id) return;
    router.push(`/room/${id}`);
  }

  return (
    <div className="container mx-auto w-full py-10">
      <h2 className="text-2xl font-semibold mb-6">Join a Break</h2>
      <Card className="p-6 max-w-xl">
        <form onSubmit={onJoin} className="space-y-5">
          <div>
            <Label>Paste link or enter Room ID</Label>
            <Input
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="e.g., https://your.host/room/abcd1234"
              required
            />
          </div>
          <Button type="submit" className="w-full">
            Join now
          </Button>
        </form>
      </Card>
    </div>
  );
} 