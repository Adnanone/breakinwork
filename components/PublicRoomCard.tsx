"use client";

import React, { useEffect, useState } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Avatar, AvatarFallback } from './ui/avatar';
import { Clock, Users, Zap, Calendar, Palette, Code, Briefcase, Sparkles } from 'lucide-react';

interface PublicRoomCardProps {
  room: {
    id: string;
    hostName: string;
    prompt: string;
    category: string;
    duration: number;
    participantCount: number;
    maxParticipants: number;
    startsAt: Date;
    timeRemaining?: number;
    status: 'live' | 'starting-soon';
    isPro?: boolean;
  };
  onJoin: () => void;
}

const CATEGORY_ICONS = {
  design: Palette,
  dev: Code,
  business: Briefcase,
  random: Sparkles
};

const CATEGORY_COLORS = {
  design: 'text-purple-500',
  dev: 'text-blue-500', 
  business: 'text-green-500',
  random: 'text-orange-500'
};

export function PublicRoomCard({ room, onJoin }: PublicRoomCardProps) {
  const CategoryIcon = CATEGORY_ICONS[room.category as keyof typeof CATEGORY_ICONS] || Sparkles;
  const categoryColor = CATEGORY_COLORS[room.category as keyof typeof CATEGORY_COLORS] || 'text-gray-500';

  const formatTimeUntilStart = (date: Date) => {
    const now = new Date();
    const diff = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60));
    if (diff <= 0) return 'Starting now';
    if (diff === 1) return 'Starts in 1 min';
    return `Starts in ${diff} mins`;
  };

  const [startLabel, setStartLabel] = useState<string>(
    room.status === 'starting-soon' ? 'Starting soon' : ''
  );

  useEffect(() => {
    if (room.status !== 'starting-soon') return;
    const update = () => setStartLabel(formatTimeUntilStart(room.startsAt));
    update();
    const id = setInterval(update, 30_000);
    return () => clearInterval(id);
  }, [room.status, room.startsAt]);

  return (
    <Card
      className="p-4 space-y-3 hover:shadow-md transition-shadow cursor-pointer"
      onClick={() => {
        if (room.status === 'live') onJoin();
      }}
    >
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <Avatar className="w-8 h-8">
            <AvatarFallback className="text-xs">
              {room.hostName.split(' ').map(n => n[0]).join('')}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="text-sm font-medium">{room.hostName}</p>
            <div className="flex items-center gap-1">
              <CategoryIcon className={`w-3 h-3 ${categoryColor}`} />
              <span className="text-xs text-muted-foreground capitalize">{room.category}</span>
            </div>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1">
          {room.status === 'live' && (
            <Badge variant="destructive" className="text-xs animate-pulse">
              <Zap className="w-2 h-2 mr-1" />
              LIVE
            </Badge>
          )}
          {room.isPro && (
            <Badge variant="secondary" className="text-xs">Pro</Badge>
          )}
        </div>
      </div>

      {/* Prompt */}
      <div className="py-2">
        <p className="text-sm italic leading-relaxed">&quot;{room.prompt}&quot;</p>
      </div>

      {/* Stats */}
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <Users className="w-3 h-3" />
            <span>{room.participantCount}/{room.maxParticipants}</span>
          </div>
          <div className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            <span>{room.duration}m</span>
          </div>
        </div>
        {room.status === 'live' && room.timeRemaining != null && (
          <div className="flex items-center gap-1 text-red-500">
            <Clock className="w-3 h-3" />
            <span>{`${room.timeRemaining}m left`}</span>
          </div>
        )}
        {room.status === 'starting-soon' && (
          <div className="flex items-center gap-1 text-green-500">
            <Calendar className="w-3 h-3" />
            <span suppressHydrationWarning>{startLabel}</span>
          </div>
        )}
      </div>

      {/* Progress Bar */}
      <div className="space-y-1">
        <div className="w-full bg-muted rounded-full h-1.5">
          <div 
            className="bg-primary h-1.5 rounded-full transition-all"
            style={{ width: `${(room.participantCount / room.maxParticipants) * 100}%` }}
          />
        </div>
      </div>

      {/* Join Button */}
      <Button
        onClick={(e) => {
          e.stopPropagation();
          if (room.status === 'live') onJoin();
        }}
        className="w-full"
        size="sm"
        disabled={room.participantCount >= room.maxParticipants || room.status !== 'live'}
      >
        {room.participantCount >= room.maxParticipants
          ? 'Full'
          : room.status === 'live'
            ? 'Join Now'
            : 'Join When It Starts'
        }
      </Button>
    </Card>
  );
} 