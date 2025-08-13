"use client";

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Clock, Users, ArrowRight, AlertCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface JoinRoomModalProps {
  onClose: () => void;
}

export function JoinRoomModal({ onClose }: JoinRoomModalProps) {
  const router = useRouter();
  const [roomLink, setRoomLink] = useState('');
  const [roomInfo, setRoomInfo] = useState<{
    id: string;
    hostName: string;
    prompt: string;
    duration: number;
    participantCount: number;
    maxParticipants: number;
    timeRemaining: number;
    status: 'live' | 'starting-soon';
  } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const parseRoomId = (input: string) => {
    try {
      const url = new URL(input);
      const parts = url.pathname.split("/").filter(Boolean);
      const idx = parts.findIndex((p) => p === "room");
      if (idx >= 0 && parts[idx + 1]) return parts[idx + 1];
    } catch {}
    return input.trim();
  };

  const handleCheckRoom = async () => {
    const roomId = parseRoomId(roomLink);
    if (!roomId) {
      setError('Please enter a valid room link or ID');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      // In a real app, you'd fetch room info from your API
      // For now, we'll simulate it
      const mockRoomInfo = {
        id: roomId,
        hostName: 'Alex Rivera',
        prompt: 'Best career advice in 10 seconds',
        duration: 5,
        participantCount: 3,
        maxParticipants: 8,
        timeRemaining: 4,
        status: 'live' as const
      };

      setRoomInfo(mockRoomInfo);
    } catch {
      setError('Room not found or has expired');
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoinRoom = () => {
    if (roomInfo) {
      router.push(`/room/${roomInfo.id}`);
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ArrowRight className="w-5 h-5" />
            Join a Break
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Room Link Input */}
          <div className="space-y-2">
            <Label htmlFor="room-link">Room link or ID</Label>
            <div className="flex gap-2">
              <Input
                id="room-link"
                placeholder="https://breakinwork.com/room/abc123 or abc123"
                value={roomLink}
                onChange={(e) => setRoomLink(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCheckRoom()}
              />
              <Button 
                onClick={handleCheckRoom} 
                disabled={!roomLink.trim() || isLoading}
                size="sm"
              >
                {isLoading ? "Checking..." : "Check"}
              </Button>
            </div>
            {error && (
              <div className="flex items-center gap-2 text-sm text-destructive">
                <AlertCircle className="w-4 h-4" />
                {error}
              </div>
            )}
          </div>

          {/* Room Info */}
          {roomInfo && (
            <Card className="p-4 space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="font-medium">Break Room</h4>
                  <p className="text-sm text-muted-foreground">Hosted by {roomInfo.hostName}</p>
                </div>
                <Badge variant={roomInfo.status === 'live' ? 'destructive' : 'secondary'}>
                  {roomInfo.status === 'live' ? 'LIVE' : 'Starting Soon'}
                </Badge>
              </div>
              
              <div className="space-y-2">
                <p className="text-sm italic">&quot;{roomInfo.prompt}&quot;</p>
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {roomInfo.timeRemaining}m left
                  </div>
                  <div className="flex items-center gap-1">
                    <Users className="w-3 h-3" />
                    {roomInfo.participantCount}/{roomInfo.maxParticipants}
                  </div>
                </div>
              </div>
            </Card>
          )}

          {/* Join Button */}
          {roomInfo && (
            <Button onClick={handleJoinRoom} className="w-full">
              Join Break
            </Button>
          )}

          {/* Help Text */}
          <div className="text-center text-sm text-muted-foreground">
            <p>Ask the host for the room link, or enter the room ID directly.</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
} 