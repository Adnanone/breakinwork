import React, { useState, useEffect, useRef } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Avatar, AvatarFallback } from './ui/avatar';
import { Separator } from './ui/separator';
import { 
  Clock, Send, Image, Mic, Heart, Laugh, Sparkles, 
  Download, X, Camera, Upload, Square
} from 'lucide-react';
import { ChatMessage } from './ChatMessage';
import { SaveMomentModal } from './SaveMomentModal';

interface BreakRoomProps {
  room: any;
  onLeave: () => void;
}

const MOOD_EMOJIS = [
  { emoji: '🔥', label: 'focused' },
  { emoji: '☕️', label: 'chill' },
  { emoji: '😅', label: 'chaotic' },
  { emoji: '🎯', label: 'productive' },
  { emoji: '🌟', label: 'inspired' }
];

const REACTIONS = [
  { icon: Heart, label: 'love' },
  { icon: Laugh, label: 'laugh' },
  { icon: Sparkles, label: 'spark' }
];

export function BreakRoom({ room, onLeave }: BreakRoomProps) {
  const [timeRemaining, setTimeRemaining] = useState(room.duration * 60);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([
    {
      id: '1',
      sender: room.hostName,
      text: `Welcome to our break! Let's talk about: "${room.prompt}"`,
      timestamp: new Date(),
      type: 'text'
    }
  ]);
  const [participants, setParticipants] = useState([
    { name: room.hostName, mood: '☕️', isHost: true },
    { name: room.userName || 'You', mood: '🔥', isHost: false }
  ]);
  const [isRecording, setIsRecording] = useState(false);
  const [showSaveMoment, setShowSaveMoment] = useState(false);
  const [selectedMood, setSelectedMood] = useState('🔥');
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Timer countdown
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          setShowSaveMoment(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSendMessage = () => {
    if (!message.trim()) return;

    const newMessage = {
      id: Date.now().toString(),
      sender: room.userName || 'You',
      text: message,
      timestamp: new Date(),
      type: 'text' as const
    };

    setMessages(prev => [...prev, newMessage]);
    setMessage('');
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const newMessage = {
      id: Date.now().toString(),
      sender: room.userName || 'You',
      text: `Shared an image`,
      timestamp: new Date(),
      type: 'image' as const,
      mediaUrl: URL.createObjectURL(file)
    };

    setMessages(prev => [...prev, newMessage]);
  };

  const handleVoiceRecord = () => {
    setIsRecording(!isRecording);
    
    // Simulate voice recording
    if (isRecording) {
      const newMessage = {
        id: Date.now().toString(),
        sender: room.userName || 'You',
        text: 'Shared a voice clip',
        timestamp: new Date(),
        type: 'audio' as const,
        duration: 12
      };
      setMessages(prev => [...prev, newMessage]);
    }
  };

  const addReaction = (messageId: string, reaction: string) => {
    // In real app, this would send reaction to other participants
    console.log(`Added ${reaction} to message ${messageId}`);
  };

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={onLeave}>
              <X className="w-4 h-4" />
            </Button>
            <div>
              <h2 className="font-medium">Break Room</h2>
              <p className="text-sm text-muted-foreground italic">"{room.prompt}"</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <Badge 
              variant={timeRemaining > 60 ? 'default' : 'destructive'} 
              className="flex items-center gap-1"
            >
              <Clock className="w-3 h-3" />
              {formatTime(timeRemaining)}
            </Badge>
          </div>
        </div>
      </header>

      <div className="flex-1 flex">
        {/* Sidebar - Participants */}
        <aside className="w-64 border-r bg-muted/20 p-4">
          <div className="space-y-4">
            <div>
              <h3 className="font-medium mb-3">In this break ({participants.length})</h3>
              <div className="space-y-2">
                {participants.map((participant, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <Avatar className="w-8 h-8">
                      <AvatarFallback className="text-xs">
                        {participant.name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="text-sm font-medium flex items-center gap-1">
                        {participant.name}
                        {participant.isHost && <Badge variant="secondary" className="text-xs">Host</Badge>}
                      </div>
                    </div>
                    <span className="text-lg">{participant.mood}</span>
                  </div>
                ))}
              </div>
            </div>

            <Separator />

            {/* Mood Selector */}
            <div>
              <h4 className="text-sm font-medium mb-2">Your mood</h4>
              <div className="grid grid-cols-3 gap-1">
                {MOOD_EMOJIS.map((mood) => (
                  <Button
                    key={mood.emoji}
                    variant={selectedMood === mood.emoji ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setSelectedMood(mood.emoji)}
                    className="text-lg p-1"
                    title={mood.label}
                  >
                    {mood.emoji}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </aside>

        {/* Main Chat Area */}
        <main className="flex-1 flex flex-col">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 1 && (
              <div className="text-center text-muted-foreground text-sm py-8">
                No messages yet — drop a pic, a thought, or a voice clip.
              </div>
            )}
            
            {messages.map((msg) => (
              <ChatMessage
                key={msg.id}
                message={msg}
                onReaction={(reaction) => addReaction(msg.id, reaction)}
                isOwn={msg.sender === (room.userName || 'You')}
              />
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Message Composer */}
          <div className="border-t p-4">
            <div className="flex items-center gap-2">
              <div className="flex gap-1">
                {/* Image Upload */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  title="Upload image"
                >
                  <Image className="w-4 h-4" />
                </Button>
                
                {/* Camera */}
                <Button
                  variant="ghost"
                  size="sm"
                  title="Take photo"
                >
                  <Camera className="w-4 h-4" />
                </Button>
                
                {/* Voice Record */}
                <Button
                  variant={isRecording ? 'destructive' : 'ghost'}
                  size="sm"
                  onClick={handleVoiceRecord}
                  title={isRecording ? 'Stop recording' : 'Record voice'}
                >
                  {isRecording ? <Square className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                </Button>
              </div>

              <Input
                placeholder={timeRemaining > 0 ? "Share something..." : "Break has ended"}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                disabled={timeRemaining === 0}
                className="flex-1"
              />

              <Button 
                onClick={handleSendMessage} 
                disabled={!message.trim() || timeRemaining === 0}
                size="sm"
              >
                <Send className="w-4 h-4" />
              </Button>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
            </div>

            {isRecording && (
              <div className="mt-2 flex items-center justify-center gap-2 text-sm text-destructive">
                <div className="w-2 h-2 bg-destructive rounded-full animate-pulse" />
                Recording... tap to stop
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Save Moment Modal */}
      {showSaveMoment && (
        <SaveMomentModal
          room={room}
          messages={messages}
          onClose={() => setShowSaveMoment(false)}
          onSave={() => {
            setShowSaveMoment(false);
            onLeave();
          }}
        />
      )}
    </div>
  );
}