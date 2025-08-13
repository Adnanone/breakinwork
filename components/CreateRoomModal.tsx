"use client";

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Badge } from './ui/badge';
import { Card } from './ui/card';
import { Separator } from './ui/separator';
import { Switch } from './ui/switch';
import { Clock, Sparkles, Users, Briefcase, Code, Palette, Globe, Lock, Copy, CheckCircle2, Share2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface CreateRoomModalProps {
  onClose: () => void;
}

const SAMPLE_PROMPTS = [
  "Weirdest client ask",
  "One tool that changed your workflow",
  "Show the weirdest thing on your desk",
  "Best career advice in 10 seconds",
  "Pitch a one-sentence impossible startup",
  "Share your workspace vibe",
  "Most useful Chrome extension"
];

const CATEGORIES = [
  { id: 'design', label: 'Design', icon: Palette },
  { id: 'dev', label: 'Dev', icon: Code },
  { id: 'business', label: 'Business', icon: Briefcase },
  { id: 'random', label: 'Random', icon: Sparkles }
];

export function CreateRoomModal({ onClose }: CreateRoomModalProps) {
  const router = useRouter();
  const [step, setStep] = useState<'setup' | 'created'>('setup');
  const [hostName, setHostName] = useState('');
  const [selectedPrompt, setSelectedPrompt] = useState('');
  const [customPrompt, setCustomPrompt] = useState('');
  const [duration, setDuration] = useState<'5' | '30'>('5');
  const [category, setCategory] = useState('random');
  const [isPublic, setIsPublic] = useState(false);
  const [maxParticipants, setMaxParticipants] = useState('8');
  const [createdRoom, setCreatedRoom] = useState<{
    id: string;
    hostName: string;
    prompt: string;
    duration: number;
    category: string;
    isPro: boolean;
    isPublic: boolean;
    maxParticipants: number;
    createdAt: Date;
    shareLink: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const handleCreate = async () => {
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/rooms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          hostName: hostName || 'Anonymous',
          mode: customPrompt || selectedPrompt || 'Open conversation',
          prompt: customPrompt || selectedPrompt || 'Open conversation',
          minutes: parseInt(duration),
          topic: category,
          isPro: duration === '30',
          maxParticipants: parseInt(maxParticipants)
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create room");
      
      // Persist host identity so the chat page picks it up without re-prompting
      try {
        const persistedName = (hostName || 'Anonymous').trim();
        localStorage.setItem('biw_name', persistedName);
        if (!localStorage.getItem('biw_mood')) {
          localStorage.setItem('biw_mood', '🔥');
        }
      } catch {}

      const roomData = {
        id: data.id,
        hostName: hostName || 'Anonymous',
        prompt: customPrompt || selectedPrompt || 'Open conversation',
        duration: parseInt(duration),
        category,
        isPro: duration === '30',
        isPublic,
        maxParticipants: parseInt(maxParticipants),
        createdAt: new Date(),
        shareLink: `${window.location.origin}/room/${data.id}`
      };
      
      setCreatedRoom(roomData);
      setStep('created');
    } catch {
      alert("Error creating room");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyLink = () => {
    if (createdRoom?.shareLink) {
      navigator.clipboard.writeText(createdRoom.shareLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleStartRoom = () => {
    if (createdRoom) {
      router.push(`/room/${createdRoom.id}`);
    }
  };

  const isValid = hostName.trim().length > 0 && (selectedPrompt || customPrompt.trim().length > 0);

  if (step === 'created' && createdRoom) {
    return (
      <Dialog open onOpenChange={onClose}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-500" />
              Break Room Created!
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* Room Summary */}
            <Card className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">Your Break Room</h4>
                <div className="flex items-center gap-1">
                  {createdRoom.isPublic ? (
                    <>
                      <Globe className="w-4 h-4 text-green-500" />
                      <span className="text-sm text-green-600">Public</span>
                    </>
                  ) : (
                    <>
                      <Lock className="w-4 h-4 text-gray-500" />
                      <span className="text-sm text-gray-600">Private</span>
                    </>
                  )}
                </div>
              </div>
              
              <div className="space-y-2 text-sm">
                <div className="italic">&quot;{createdRoom.prompt}&quot;</div>
                <div className="flex items-center gap-4 text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {createdRoom.duration}m
                  </div>
                  <div className="flex items-center gap-1">
                    <Users className="w-3 h-3" />
                    Max {createdRoom.maxParticipants}
                  </div>
                </div>
              </div>
            </Card>

            {/* Share Link */}
            <div className="space-y-2">
              <Label>Share this link to invite others</Label>
              <div className="flex gap-2">
                <Input 
                  value={createdRoom.shareLink} 
                  readOnly 
                  className="flex-1 text-sm"
                />
                <Button variant="outline" onClick={handleCopyLink}>
                  {copied ? <CheckCircle2 className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
              {copied && (
                <p className="text-xs text-green-600">Copied to clipboard!</p>
              )}
            </div>

            {/* Privacy Info */}
            {createdRoom.isPublic && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <div className="flex items-start gap-2">
                  <Globe className="w-4 h-4 text-blue-500 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium text-blue-700">Public Room</p>
                    <p className="text-blue-600">Others can discover and join this break room on the main page.</p>
                  </div>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3">
              <Button 
                variant="outline" 
                onClick={() => navigator.share?.({ url: createdRoom.shareLink })}
                className="flex-1"
              >
                <Share2 className="w-4 h-4 mr-2" />
                Share
              </Button>
              <Button onClick={handleStartRoom} className="flex-1">
                Start Break
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Host a Break
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Host Name */}
          <div className="space-y-2">
            <Label htmlFor="host-name">Your name</Label>
            <Input
              id="host-name"
              placeholder="How should others see you?"
              value={hostName}
              onChange={(e) => setHostName(e.target.value)}
            />
          </div>

          {/* Duration Selection */}
          <div className="space-y-2">
            <Label>Duration</Label>
            <div className="flex gap-2">
              <Button
                variant={duration === '5' ? 'default' : 'outline'}
                onClick={() => setDuration('5')}
                className="flex-1 flex items-center gap-2"
              >
                <Clock className="w-4 h-4" />
                5 min (Free)
              </Button>
              <Button
                variant={duration === '30' ? 'default' : 'outline'}
                onClick={() => setDuration('30')}
                className="flex-1 flex items-center gap-2"
              >
                <Clock className="w-4 h-4" />
                30 min 
                <Badge variant="secondary" className="text-xs">Pro</Badge>
              </Button>
            </div>
          </div>

          {/* Privacy Settings */}
          <div className="space-y-3">
            <Label>Privacy & Visibility</Label>
            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    {isPublic ? (
                      <Globe className="w-4 h-4 text-green-500" />
                    ) : (
                      <Lock className="w-4 h-4 text-gray-500" />
                    )}
                    <span className="font-medium">
                      {isPublic ? 'Public Room' : 'Private Room'}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {isPublic 
                      ? 'Anyone can discover and join this break'
                      : 'Only people with the link can join'
                    }
                  </p>
                </div>
                <Switch
                  checked={isPublic}
                  onCheckedChange={setIsPublic}
                />
              </div>
            </Card>
          </div>

          {/* Max Participants */}
          <div className="space-y-2">
            <Label htmlFor="max-participants">Maximum participants</Label>
            <Select value={maxParticipants} onValueChange={setMaxParticipants}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="4">4 people</SelectItem>
                <SelectItem value="6">6 people</SelectItem>
                <SelectItem value="8">8 people</SelectItem>
                <SelectItem value="10">10 people</SelectItem>
                <SelectItem value="12">12 people</SelectItem>
                <SelectItem value="15">15 people</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Category */}
          <div className="space-y-2">
            <Label>Category</Label>
            <div className="grid grid-cols-2 gap-2">
              {CATEGORIES.map((cat) => {
                const Icon = cat.icon;
                return (
                  <Button
                    key={cat.id}
                    variant={category === cat.id ? 'default' : 'outline'}
                    onClick={() => setCategory(cat.id)}
                    className="flex items-center gap-2"
                  >
                    <Icon className="w-4 h-4" />
                    {cat.label}
                  </Button>
                );
              })}
            </div>
          </div>

          <Separator />

          {/* Prompt Selection */}
          <div className="space-y-2">
            <Label>Break prompt</Label>
            <div className="space-y-3">
              <div className="grid grid-cols-1 gap-2 max-h-32 overflow-y-auto">
                {SAMPLE_PROMPTS.map((prompt) => (
                  <Button
                    key={prompt}
                    variant={selectedPrompt === prompt ? 'default' : 'outline'}
                    onClick={() => {
                      setSelectedPrompt(selectedPrompt === prompt ? '' : prompt);
                      setCustomPrompt('');
                    }}
                    className="text-left justify-start h-auto py-2 px-3 text-sm"
                  >
                    &quot;{prompt}&quot;
                  </Button>
                ))}
              </div>
              
              <div className="relative">
                <Input
                  placeholder="Or write your own prompt..."
                  value={customPrompt}
                  onChange={(e) => {
                    setCustomPrompt(e.target.value);
                    setSelectedPrompt('');
                  }}
                />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={!isValid || isSubmitting} className="flex-1">
              {isSubmitting ? "Creating..." : "Create Break"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
} 