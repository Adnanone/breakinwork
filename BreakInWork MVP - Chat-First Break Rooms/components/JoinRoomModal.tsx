import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { Card } from './ui/card';
import { Clock, Users, Sparkles, Link2, Globe, Lock, Zap } from 'lucide-react';

interface JoinRoomModalProps {
  onClose: () => void;
  onJoin: (roomData: any) => void;
}

export function JoinRoomModal({ onClose, onJoin }: JoinRoomModalProps) {
  const [joinName, setJoinName] = useState('');
  const [roomLink, setRoomLink] = useState('');
  const [previewRoom, setPreviewRoom] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Mock room lookup - in real app this would query the backend
  const handleLookupRoom = async () => {
    if (!roomLink.trim()) return;
    
    setIsLoading(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500));
    
    if (roomLink.includes('demo') || roomLink.includes('breakinwork.com')) {
      setPreviewRoom({
        id: 'demo123',
        hostName: 'Alex Chen',
        prompt: 'Weirdest client ask',
        duration: 5,
        category: 'business',
        participantCount: 3,
        maxParticipants: 8,
        timeRemaining: 3.5,
        isPublic: roomLink.includes('public'),
        isPro: false,
        status: 'live'
      });
    } else {
      // Show error for invalid links
      setPreviewRoom(null);
    }
    
    setIsLoading(false);
  };

  const handleJoin = () => {
    if (!previewRoom) return;
    
    const roomData = {
      ...previewRoom,
      isJoining: true,
      userName: joinName || 'Anonymous'
    };
    
    onJoin(roomData);
  };

  const formatTimeRemaining = (minutes: number) => {
    return `${Math.floor(minutes)}:${String(Math.floor((minutes % 1) * 60)).padStart(2, '0')}`;
  };

  const isValid = joinName.trim().length > 0 && previewRoom;

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Link2 className="w-5 h-5" />
            Join a Break
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Your Name */}
          <div className="space-y-2">
            <Label htmlFor="join-name">Your name</Label>
            <Input
              id="join-name"
              placeholder="How should others see you?"
              value={joinName}
              onChange={(e) => setJoinName(e.target.value)}
            />
          </div>

          {/* Room Link */}
          <div className="space-y-2">
            <Label htmlFor="room-link">Break room link</Label>
            <div className="flex gap-2">
              <Input
                id="room-link"
                placeholder="https://breakinwork.com/join/..."
                value={roomLink}
                onChange={(e) => setRoomLink(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleLookupRoom()}
              />
              <Button 
                variant="outline" 
                onClick={handleLookupRoom}
                disabled={!roomLink.trim() || isLoading}
              >
                {isLoading ? '...' : 'Preview'}
              </Button>
            </div>
          </div>

          {/* Room Preview */}
          {previewRoom && (
            <Card className="border-2 border-primary/20">
              <div className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">Break Preview</h4>
                  <div className="flex items-center gap-2">
                    {previewRoom.status === 'live' && (
                      <Badge variant="destructive" className="text-xs animate-pulse">
                        <Zap className="w-2 h-2 mr-1" />
                        LIVE
                      </Badge>
                    )}
                    
                    {previewRoom.isPublic ? (
                      <div className="flex items-center gap-1 text-green-600">
                        <Globe className="w-3 h-3" />
                        <span className="text-xs">Public</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 text-gray-500">
                        <Lock className="w-3 h-3" />
                        <span className="text-xs">Private</span>
                      </div>
                    )}
                    
                    {previewRoom.isPro && (
                      <Badge variant="secondary" className="text-xs">Pro</Badge>
                    )}
                  </div>
                </div>
                
                <div className="space-y-2 text-sm">
                  <div className="flex items-start gap-2">
                    <Sparkles className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                    <span className="italic">"{previewRoom.prompt}"</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        <span>{previewRoom.participantCount}/{previewRoom.maxParticipants}</span>
                      </div>
                      
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>{previewRoom.duration}m</span>
                      </div>
                    </div>
                    
                    {previewRoom.timeRemaining && (
                      <div className="flex items-center gap-1 text-red-500">
                        <Clock className="w-3 h-3" />
                        <span>{formatTimeRemaining(previewRoom.timeRemaining)} left</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="text-muted-foreground">
                    Hosted by <span className="font-medium text-foreground">{previewRoom.hostName}</span>
                  </div>
                </div>

                {/* Participant Progress */}
                <div className="space-y-1">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Participants</span>
                    <span>{previewRoom.participantCount}/{previewRoom.maxParticipants}</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-1.5">
                    <div 
                      className="bg-primary h-1.5 rounded-full transition-all"
                      style={{ width: `${(previewRoom.participantCount / previewRoom.maxParticipants) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            </Card>
          )}

          {/* Demo Link Helper */}
          {!previewRoom && !isLoading && (
            <div className="text-center py-4">
              <p className="text-sm text-muted-foreground mb-2">
                Don't have a link? Try these demos:
              </p>
              <div className="flex flex-col gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setRoomLink('https://breakinwork.com/join/demo123')}
                >
                  Demo: Private Room
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setRoomLink('https://breakinwork.com/join/public456')}
                >
                  Demo: Public Room
                </Button>
              </div>
            </div>
          )}

          {/* Error State */}
          {!previewRoom && roomLink && !isLoading && roomLink.length > 10 && (
            <div className="text-center py-4">
              <p className="text-sm text-destructive">
                Room not found. Check the link and try again.
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button 
              onClick={handleJoin} 
              disabled={!isValid}
              className="flex-1"
            >
              {previewRoom ? 
                (previewRoom.participantCount >= previewRoom.maxParticipants 
                  ? 'Room Full' 
                  : 'Join Now'
                ) 
                : 'Join Break'
              }
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}