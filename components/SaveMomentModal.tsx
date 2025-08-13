"use client";

import React, { useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Download, Share2, Copy, CheckCircle2, Clock, Users, Sparkles } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";

export type MomentMessage = { id: string; sender: string; text?: string; mediaUrl?: string; type: "text" | "image" | "audio" };

interface SaveMomentModalProps {
  roomId: string;
  prompt: string;
  durationMinutes: number;
  participantsCount: number;
  messages: MomentMessage[];
  createdBy?: string;
  open: boolean;
  onClose: () => void;
  onSaved?: () => void;
}

export function SaveMomentModal({ roomId, prompt, durationMinutes, participantsCount, messages, createdBy, open, onClose, onSaved }: SaveMomentModalProps) {
  const [momentTitle, setMomentTitle] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [savedId, setSavedId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const topTextMessages = useMemo(() => messages.filter(m => m.text && m.type === "text").slice(-3), [messages]);
  const latestImage = useMemo(() => messages.filter(m => m.type === "image" && m.mediaUrl).slice(-1)[0], [messages]);
  const latestAudio = useMemo(() => messages.filter(m => m.type === "audio" && m.mediaUrl).slice(-1)[0], [messages]);

  const shareLink = savedId ? `${typeof window !== 'undefined' ? window.location.origin : ''}/moment/${savedId}` : "";

  const handleCopyLink = () => {
    if (!shareLink) return;
    navigator.clipboard.writeText(shareLink).then(() => setCopied(true));
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = async () => {
    // Generate a shareable image (PNG) representing the moment summary
    const title = momentTitle || `Break: ${prompt}`;
    const width = 1200;
    const height = 675; // 16:9
    const dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));

    const canvas = document.createElement('canvas');
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.scale(dpr, dpr);

    // Background gradient
    const gradient = ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, '#0f172a'); // slate-900
    gradient.addColorStop(1, '#1e293b'); // slate-800
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    // Card backdrop
    const cardMargin = 48;
    const cardRadius = 24;
    const cardX = cardMargin;
    const cardY = cardMargin;
    const cardW = width - cardMargin * 2;
    const cardH = height - cardMargin * 2;

    const drawRoundedRect = (x: number, y: number, w: number, h: number, r: number) => {
      ctx.beginPath();
      ctx.moveTo(x + r, y);
      ctx.lineTo(x + w - r, y);
      ctx.quadraticCurveTo(x + w, y, x + w, y + r);
      ctx.lineTo(x + w, y + h - r);
      ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
      ctx.lineTo(x + r, y + h);
      ctx.quadraticCurveTo(x, y + h, x, y + h - r);
      ctx.lineTo(x, y + r);
      ctx.quadraticCurveTo(x, y, x + r, y);
      ctx.closePath();
    };

    drawRoundedRect(cardX, cardY, cardW, cardH, cardRadius);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.06)';
    ctx.fill();

    // Header text
    const pad = 40;
    let cursorY = cardY + pad + 8;
    ctx.fillStyle = '#ffffff';
    ctx.font = '700 40px Inter, ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto';
    ctx.textBaseline = 'top';

    const drawWrapped = (text: string, x: number, y: number, maxWidth: number, lineHeight: number, maxLines = 3) => {
      const words = text.split(' ');
      let line = '';
      let linesDrawn = 0;
      for (let n = 0; n < words.length; n++) {
        const testLine = line ? line + ' ' + words[n] : words[n];
        const metrics = ctx.measureText(testLine);
        if (metrics.width > maxWidth && n > 0) {
          ctx.fillText(line, x, y);
          y += lineHeight;
          linesDrawn++;
          line = words[n];
          if (linesDrawn >= maxLines - 1) {
            // Truncate remaining
            let final = line;
            while (ctx.measureText(final + '…').width > maxWidth && final.length > 0) {
              final = final.slice(0, -1);
            }
            ctx.fillText(final + '…', x, y);
            return y + lineHeight;
          }
        } else {
          line = testLine;
        }
      }
      ctx.fillText(line, x, y);
      return y + lineHeight;
    };

    cursorY = drawWrapped(title, cardX + pad, cursorY, cardW - pad * 2, 48, 2);

    // Meta row
    ctx.font = '500 22px Inter, ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto';
    ctx.fillStyle = '#cbd5e1';
    const meta = `${durationMinutes} min · ${participantsCount} participants${createdBy ? ` · by ${createdBy}` : ''}`;
    ctx.fillText(meta, cardX + pad, cursorY + 4);
    cursorY += 44;

    // Divider
    ctx.strokeStyle = 'rgba(255,255,255,0.1)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(cardX + pad, cursorY);
    ctx.lineTo(cardX + cardW - pad, cursorY);
    ctx.stroke();
    cursorY += 24;

    // Top messages
    ctx.font = '600 24px Inter, ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto';
    ctx.fillStyle = '#ffffff';
    ctx.fillText('Highlights', cardX + pad, cursorY);
    cursorY += 32;

    const messageBoxWidth = cardW - pad * 2;
    ctx.font = '400 22px Inter, ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto';
    ctx.fillStyle = '#e2e8f0';

    const preview = topTextMessages.slice(-3);
    if (preview.length === 0) {
      ctx.fillText('No text messages shared.', cardX + pad, cursorY);
      cursorY += 32;
    } else {
      for (const m of preview) {
        const label = `${m.sender}: `;
        // Bold sender
        ctx.font = '700 22px Inter, ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto';
        ctx.fillStyle = '#ffffff';
        ctx.fillText(label, cardX + pad, cursorY);
        const labelWidth = ctx.measureText(label).width;
        ctx.font = '400 22px Inter, ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto';
        ctx.fillStyle = '#e2e8f0';
        const remainingWidth = messageBoxWidth - labelWidth;
        const afterLabelY = drawWrapped(m.text || '', cardX + pad + labelWidth, cursorY, remainingWidth, 30, 2);
        cursorY = afterLabelY + 10;
      }
    }

    // Footer branding
    ctx.font = '500 20px Inter, ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto';
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    const footer = 'breakinwork.com';
    ctx.fillText(footer, cardX + pad, cardY + cardH - pad);

    // Try to place the latest image thumbnail on the right side if available
    if (latestImage?.mediaUrl) {
      try {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.src = latestImage.mediaUrl;
    await new Promise<void>((resolve) => {
      img.onload = () => resolve();
      img.onerror = () => resolve(); // ignore CORS failures silently
    });
        const thumbW = 280;
        const thumbH = 180;
        const thumbX = cardX + cardW - pad - thumbW;
        const thumbY = cardY + pad;
        drawRoundedRect(thumbX, thumbY, thumbW, thumbH, 16);
        ctx.clip();
        ctx.drawImage(img, thumbX, thumbY, thumbW, thumbH);
        ctx.restore();
      } catch {}
    }

    const dataUrl = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = `break-moment-${Date.now()}.png`;
    a.click();
  };

  const handleSave = async () => {
    setIsSaving(true);
    const snapshot = {
      title: momentTitle || `Break: ${prompt}`,
      prompt,
      durationMinutes,
      participantsCount,
      imageUrl: latestImage?.mediaUrl || null,
      audioUrl: latestAudio?.mediaUrl || null,
      topMessages: topTextMessages.map(m => ({ id: m.id, sender: m.sender, text: m.text })),
    };
    const { data, error } = await supabase
      .from("moments")
      .insert({ room_id: roomId, snapshot_json: snapshot, created_by: createdBy || "" })
      .select("id")
      .single();
    if (!error && data) setSavedId(data.id);
    setIsSaving(false);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{savedId ? "Moment saved!" : "Good break. Save a Moment?"}</DialogTitle>
          {!savedId && <DialogDescription>Capture the highlights from your break to keep or share with others.</DialogDescription>}
        </DialogHeader>

        {savedId ? (
          <div className="space-y-4">
            <Card className="p-4">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-purple-500" />
                  <span className="font-medium">{momentTitle || `Break: ${prompt}`}</span>
                </div>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1"><Clock className="w-3 h-3" />{durationMinutes} min</div>
                  <div className="flex items-center gap-1"><Users className="w-3 h-3" />{participantsCount} participants</div>
                </div>
              </div>
            </Card>

            <div className="space-y-2">
              <Label>Share this moment</Label>
              <div className="flex gap-2">
                <Input value={shareLink} readOnly className="flex-1" />
                <Button variant="outline" onClick={handleCopyLink}>
                  {copied ? <CheckCircle2 className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={handleDownload} className="flex-1">
                <Download className="w-4 h-4 mr-2" />Download
              </Button>
              <Button variant="outline" onClick={() => navigator.share?.({ url: shareLink })} className="flex-1">
                <Share2 className="w-4 h-4 mr-2" />Share
              </Button>
            </div>

            <Button onClick={onClose} className="w-full">Back</Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="moment-title">Moment title (optional)</Label>
              <Input id="moment-title" placeholder={`Break: ${prompt}`} value={momentTitle} onChange={(e) => setMomentTitle(e.target.value)} />
            </div>
            <Card className="p-4">
              <h4 className="font-medium mb-3">What will be saved:</h4>
              <div className="space-y-3 text-sm">
                <div className="flex items-center gap-2"><Badge variant="outline" className="text-xs">Room</Badge><span>&quot;{prompt}&quot;</span></div>
                <div className="flex items-center gap-2"><Badge variant="outline" className="text-xs">Messages</Badge><span>Top {topTextMessages.length} messages</span></div>
                <div className="flex items-center gap-2"><Badge variant="outline" className="text-xs">Duration</Badge><span>{durationMinutes} minutes</span></div>
              </div>
            </Card>
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  onClose();
                }}
                className="flex-1"
              >
                Skip
              </Button>
              <Button onClick={handleSave} disabled={isSaving} className="flex-1">{isSaving ? "Saving..." : "Save Moment"}</Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
} 