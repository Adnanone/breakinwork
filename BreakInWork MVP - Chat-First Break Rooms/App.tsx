import React, { useState } from 'react';
import { Button } from './components/ui/button';
import { Card } from './components/ui/card';
import { Badge } from './components/ui/badge';
import { Avatar, AvatarFallback } from './components/ui/avatar';
import { CreateRoomModal } from './components/CreateRoomModal';
import { JoinRoomModal } from './components/JoinRoomModal';
import { BreakRoom } from './components/BreakRoom';
import { PublicRoomCard } from './components/PublicRoomCard';
import { Clock, Users, Sparkles, Download, Zap, Globe } from 'lucide-react';

type AppState = 'landing' | 'create' | 'join' | 'room';

// Mock public rooms data
const PUBLIC_ROOMS = [
  {
    id: 'pub1',
    hostName: 'Sarah Chen',
    prompt: 'Show the weirdest thing on your desk',
    category: 'random',
    duration: 5,
    participantCount: 3,
    maxParticipants: 8,
    startsAt: new Date(Date.now() + 2 * 60 * 1000), // 2 minutes from now
    status: 'starting-soon'
  },
  {
    id: 'pub2', 
    hostName: 'Alex Rivera',
    prompt: 'Best career advice in 10 seconds',
    category: 'business',
    duration: 5,
    participantCount: 5,
    maxParticipants: 10,
    startsAt: new Date(Date.now() - 1 * 60 * 1000), // Started 1 minute ago
    timeRemaining: 4,
    status: 'live'
  },
  {
    id: 'pub3',
    hostName: 'Jamie Foster',
    prompt: 'One tool that changed your workflow',
    category: 'dev',
    duration: 5,
    participantCount: 2,
    maxParticipants: 6,
    startsAt: new Date(Date.now() + 5 * 60 * 1000), // 5 minutes from now
    status: 'starting-soon'
  },
  {
    id: 'pub4',
    hostName: 'Morgan Kim',
    prompt: 'Pitch a one-sentence impossible startup',
    category: 'business',
    duration: 30,
    participantCount: 7,
    maxParticipants: 15,
    startsAt: new Date(Date.now() + 8 * 60 * 1000), // 8 minutes from now
    status: 'starting-soon',
    isPro: true
  }
];

export default function App() {
  const [currentState, setCurrentState] = useState<AppState>('landing');
  const [currentRoom, setCurrentRoom] = useState<any>(null);

  const handleCreateRoom = (roomData: any) => {
    setCurrentRoom(roomData);
    setCurrentState('room');
  };

  const handleJoinRoom = (roomData: any) => {
    setCurrentRoom(roomData);
    setCurrentState('room');
  };

  const handleJoinPublicRoom = (room: any) => {
    const roomData = {
      ...room,
      isJoining: true,
      userName: 'Anonymous' // In real app, would get from user input
    };
    setCurrentRoom(roomData);
    setCurrentState('room');
  };

  const handleLeaveRoom = () => {
    setCurrentRoom(null);
    setCurrentState('landing');
  };

  if (currentState === 'room') {
    return <BreakRoom room={currentRoom} onLeave={handleLeaveRoom} />;
  }

  const liveRooms = PUBLIC_ROOMS.filter(room => room.status === 'live');
  const upcomingRooms = PUBLIC_ROOMS.filter(room => room.status === 'starting-soon');

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <header className="p-6">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <span className="font-medium">BreakInWork</span>
          </div>
          <Button variant="outline" size="sm">Pro</Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-6 pt-8 pb-24">
        {/* Hero Section */}
        <div className="text-center space-y-6 mb-12">
          <h1 className="text-4xl md:text-5xl tracking-tight">
            5 minutes. A stranger. One fresh spark.
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Jump into a timed break with other professionals. Share ideas, stories, and moments that matter.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-8">
            <Button 
              size="lg" 
              onClick={() => setCurrentState('create')}
              className="text-lg px-8 py-6"
            >
              Host a Break
            </Button>
            <Button 
              variant="outline" 
              size="lg"
              onClick={() => setCurrentState('join')}
              className="text-lg px-8 py-6"
            >
              Join via Link
            </Button>
          </div>
        </div>

        {/* Live Public Rooms */}
        {liveRooms.length > 0 && (
          <section className="mb-12">
            <div className="flex items-center gap-2 mb-6">
              <Zap className="w-5 h-5 text-red-500" />
              <h2 className="text-2xl">Live Now</h2>
              <Badge variant="destructive" className="animate-pulse">LIVE</Badge>
            </div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {liveRooms.map((room) => (
                <PublicRoomCard
                  key={room.id}
                  room={room}
                  onJoin={() => handleJoinPublicRoom(room)}
                />
              ))}
            </div>
          </section>
        )}

        {/* Upcoming Public Rooms */}
        {upcomingRooms.length > 0 && (
          <section className="mb-12">
            <div className="flex items-center gap-2 mb-6">
              <Globe className="w-5 h-5 text-green-500" />
              <h2 className="text-2xl">Starting Soon</h2>
            </div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {upcomingRooms.map((room) => (
                <PublicRoomCard
                  key={room.id}
                  room={room}
                  onJoin={() => handleJoinPublicRoom(room)}
                />
              ))}
            </div>
          </section>
        )}

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          <Card className="p-6 text-center space-y-3">
            <Clock className="w-8 h-8 mx-auto text-blue-500" />
            <h3>Timed Rooms</h3>
            <p className="text-sm text-muted-foreground">5-minute free breaks, 30-minute pro sessions</p>
          </Card>
          
          <Card className="p-6 text-center space-y-3">
            <Users className="w-8 h-8 mx-auto text-green-500" />
            <h3>Live Presence</h3>
            <p className="text-sm text-muted-foreground">See who's here with mood indicators</p>
          </Card>
          
          <Card className="p-6 text-center space-y-3">
            <Sparkles className="w-8 h-8 mx-auto text-purple-500" />
            <h3>Rich Media</h3>
            <p className="text-sm text-muted-foreground">Text, images, and voice clips</p>
          </Card>
          
          <Card className="p-6 text-center space-y-3">
            <Download className="w-8 h-8 mx-auto text-orange-500" />
            <h3>Save Moments</h3>
            <p className="text-sm text-muted-foreground">Capture and share the best parts</p>
          </Card>
        </div>

        {/* Sample Prompts */}
        <div className="text-center space-y-6">
          <h2>Popular Break Prompts</h2>
          <div className="flex flex-wrap justify-center gap-3">
            {[
              "Weirdest client ask",
              "One tool that changed your workflow", 
              "Show the weirdest thing on your desk",
              "Best career advice in 10 seconds",
              "Pitch a one-sentence impossible startup"
            ].map((prompt) => (
              <div key={prompt} className="px-4 py-2 bg-white rounded-full border text-sm">
                "{prompt}"
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Modals */}
      {currentState === 'create' && (
        <CreateRoomModal
          onClose={() => setCurrentState('landing')}
          onCreate={handleCreateRoom}
        />
      )}
      
      {currentState === 'join' && (
        <JoinRoomModal
          onClose={() => setCurrentState('landing')}
          onJoin={handleJoinRoom}
        />
      )}
    </div>
  );
}