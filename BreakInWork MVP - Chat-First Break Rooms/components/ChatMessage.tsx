import React, { useState } from 'react';
import { Avatar, AvatarFallback } from './ui/avatar';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Heart, Laugh, Sparkles, Play, Pause, Volume2 } from 'lucide-react';
import { ImageWithFallback } from './figma/ImageWithFallback';

interface ChatMessageProps {
  message: {
    id: string;
    sender: string;
    text: string;
    timestamp: Date;
    type: 'text' | 'image' | 'audio';
    mediaUrl?: string;
    duration?: number;
  };
  isOwn: boolean;
  onReaction: (reaction: string) => void;
}

const REACTIONS = [
  { icon: Heart, emoji: '❤️', label: 'love' },
  { icon: Laugh, emoji: '😂', label: 'laugh' },
  { icon: Sparkles, emoji: '✨', label: 'spark' }
];

export function ChatMessage({ message, isOwn, onReaction }: ChatMessageProps) {
  const [showReactions, setShowReactions] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const handleReaction = (reaction: string) => {
    onReaction(reaction);
    setShowReactions(false);
  };

  return (
    <div className={`flex gap-3 group ${isOwn ? 'flex-row-reverse' : ''}`}>
      <Avatar className="w-8 h-8">
        <AvatarFallback className="text-xs">
          {message.sender.charAt(0)}
        </AvatarFallback>
      </Avatar>
      
      <div className={`flex-1 max-w-md space-y-1 ${isOwn ? 'items-end' : 'items-start'} flex flex-col`}>
        <div className={`flex items-center gap-2 ${isOwn ? 'flex-row-reverse' : ''}`}>
          <span className="text-sm font-medium">{message.sender}</span>
          <span className="text-xs text-muted-foreground">{formatTime(message.timestamp)}</span>
        </div>
        
        <div 
          className={`rounded-lg px-3 py-2 relative ${
            isOwn 
              ? 'bg-primary text-primary-foreground' 
              : 'bg-muted'
          }`}
          onMouseEnter={() => setShowReactions(true)}
          onMouseLeave={() => setShowReactions(false)}
        >
          {/* Message Content */}
          {message.type === 'text' && (
            <p className="text-sm">{message.text}</p>
          )}
          
          {message.type === 'image' && (
            <div className="space-y-2">
              <p className="text-sm">{message.text}</p>
              {message.mediaUrl && (
                <ImageWithFallback
                  src={message.mediaUrl}
                  alt="Shared image"
                  className="max-w-full h-auto rounded"
                />
              )}
            </div>
          )}
          
          {message.type === 'audio' && (
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
                  <span className="text-xs text-muted-foreground">
                    {message.duration}s
                  </span>
                </div>
                
                {/* Audio Waveform Visualization */}
                <div className="flex items-center gap-0.5 h-4">
                  {Array.from({ length: 20 }, (_, i) => (
                    <div
                      key={i}
                      className={`w-0.5 bg-current transition-all ${
                        isPlaying && i % 3 === 0 ? 'h-4 opacity-100' : 'h-2 opacity-40'
                      }`}
                      style={{ 
                        height: `${Math.random() * 16 + 4}px`,
                        animationDelay: `${i * 100}ms`
                      }}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Reaction Overlay */}
          {showReactions && (
            <div className={`absolute -top-2 ${isOwn ? '-left-20' : '-right-20'} flex gap-1 bg-background border rounded-full p-1 shadow-lg`}>
              {REACTIONS.map((reaction) => {
                const Icon = reaction.icon;
                return (
                  <Button
                    key={reaction.label}
                    variant="ghost"
                    size="sm"
                    onClick={() => handleReaction(reaction.emoji)}
                    className="w-6 h-6 p-0 rounded-full hover:scale-110 transition-transform"
                    title={reaction.label}
                  >
                    <Icon className="w-3 h-3" />
                  </Button>
                );
              })}
            </div>
          )}
        </div>
        
        {/* Sample reactions - would be dynamic in real app */}
        {message.id === '1' && (
          <div className="flex gap-1 mt-1">
            <Badge variant="secondary" className="text-xs px-2 py-0">
              ❤️ 2
            </Badge>
            <Badge variant="secondary" className="text-xs px-2 py-0">
              ✨ 1
            </Badge>
          </div>
        )}
      </div>
    </div>
  );
}