"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";

export default function StartBreakPage() {
  const router = useRouter();
  const [hostName, setHostName] = useState("");
  const [mode, setMode] = useState("Prompt-of-the-day");
  const [prompt, setPrompt] = useState("");
  const [minutes, setMinutes] = useState<5 | 30>(5);
  const [topic, setTopic] = useState("Random");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/rooms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hostName, mode, prompt, minutes, topic, isPro: minutes === 30 }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create room");
      router.push(`/room/${data.id}`);
    } catch {
      alert("Error creating room");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="container mx-auto w-full py-10">
      <h2 className="text-2xl font-semibold mb-6">Create a Break</h2>
      <Card className="p-6 max-w-xl">
        <form onSubmit={onSubmit} className="space-y-5">
          <div>
            <Label>Your name</Label>
            <Input value={hostName} onChange={(e) => setHostName(e.target.value)} required />
          </div>
          <div>
            <Label>Mode</Label>
            <Select value={mode} onValueChange={setMode}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Prompt-of-the-day">Prompt-of-the-day</SelectItem>
                <SelectItem value="Micro-idea sprint">Micro-idea sprint</SelectItem>
                <SelectItem value="Weird client stories">Weird client stories</SelectItem>
                <SelectItem value="Silent sharing">Silent sharing</SelectItem>
                <SelectItem value="Custom">Custom</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Prompt (optional)</Label>
            <Input
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="e.g., Show the weirdest thing on your desk"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Button 
              type="button" 
              variant={minutes === 5 ? "default" : "outline"} 
              onClick={() => setMinutes(5)}
            >
              Free: 5 minutes
            </Button>
            <Button 
              type="button" 
              variant={minutes === 30 ? "default" : "outline"} 
              onClick={() => setMinutes(30)}
            >
              Pro: 30 minutes
            </Button>
          </div>
          <div>
            <Label>Topic</Label>
            <Select value={topic} onValueChange={setTopic}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Design">Design</SelectItem>
                <SelectItem value="Dev">Dev</SelectItem>
                <SelectItem value="Writer">Writer</SelectItem>
                <SelectItem value="Random">Random</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? "Creating..." : "Create Break"}
          </Button>
        </form>
      </Card>
    </div>
  );
} 