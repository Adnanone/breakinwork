import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Download, Share2, Copy, CheckCircle2, Clock, Users, Sparkles } from 'lucide-react';

interface SaveMomentModalProps {
  room: any;
  messages: any[];
  onClose: () => void;
  onSave: () => void;
}

export function SaveMomentModal({ room, messages, onClose, onSave }: SaveMomentModalProps) {
  const [momentTitle, setMomentTitle] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [shareLink] = useState(`https://breakinwork.com/moment/${Math.random().toString(36).substr(2, 9)}`);
  const [copied, setCopied] = useState(false);

  // Get the best messages for the moment
  const topMessages = messages.slice(-3).filter(msg => msg.text.length > 0);
  
  const handleSave = async () => {
    setIsSaving(true);
    
    // Simulate saving process
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    setSaved(true);
    setIsSaving(false);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    // In real app, this would generate and download a moment bundle
    const momentData = {
      title: momentTitle || `Break: ${room.prompt}`,
      room: room.prompt,
      participants: 2,
      duration: room.duration,
      messages: topMessages,
      createdAt: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(momentData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `break-moment-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (saved) {
    return (
      <Dialog open onOpenChange={onClose}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-500" />
              Moment Saved!
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <Card className="p-4">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-purple-500" />
                  <span className="font-medium">{momentTitle || `Break: ${room.prompt}`}</span>
                </div>
                
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {room.duration} min
                  </div>
                  <div className="flex items-center gap-1">
                    <Users className="w-3 h-3" />
                    2 participants
                  </div>
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
              {copied && (
                <p className="text-xs text-green-600">Copied to clipboard!</p>
              )}
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={handleDownload} className="flex-1">
                <Download className="w-4 h-4 mr-2" />
                Download
              </Button>
              <Button variant="outline" onClick={() => navigator.share?.({ url: shareLink })} className="flex-1">
                <Share2 className="w-4 h-4 mr-2" />
                Share
              </Button>
            </div>

            <Button onClick={onSave} className="w-full">
              Back to Home
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Good break. Save a Moment?</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Capture the highlights from your break to keep or share with others.
          </p>

          {/* Moment Title */}
          <div className="space-y-2">
            <Label htmlFor="moment-title">Moment title (optional)</Label>
            <Input
              id="moment-title"
              placeholder={`Break: ${room.prompt}`}
              value={momentTitle}
              onChange={(e) => setMomentTitle(e.target.value)}
            />
          </div>

          {/* Preview */}
          <Card className="p-4">
            <h4 className="font-medium mb-3">What will be saved:</h4>
            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs">Room</Badge>
                <span>"{room.prompt}"</span>
              </div>
              
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs">Messages</Badge>
                <span>Top {topMessages.length} messages</span>
              </div>
              
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs">Duration</Badge>
                <span>{room.duration} minutes</span>
              </div>

              {topMessages.length > 0 && (
                <div className="mt-3 p-2 bg-muted/50 rounded text-xs">
                  <p className="font-medium mb-1">Preview:</p>
                  {topMessages.slice(0, 2).map((msg, i) => (
                    <p key={i} className="truncate">
                      <span className="font-medium">{msg.sender}:</span> {msg.text}
                    </p>
                  ))}
                  {topMessages.length > 2 && (
                    <p className="text-muted-foreground">...and {topMessages.length - 2} more</p>
                  )}
                </div>
              )}
            </div>
          </Card>

          {/* Actions */}
          <div className="flex gap-3">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Skip
            </Button>
            <Button 
              onClick={handleSave} 
              disabled={isSaving}
              className="flex-1"
            >
              {isSaving ? 'Saving...' : 'Save Moment'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}