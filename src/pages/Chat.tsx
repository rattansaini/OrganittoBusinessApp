import { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import Header from '../components/Header';
import ChatRoomsList from '../components/chat/ChatRoomsList';
import ChatMessageArea from '../components/chat/ChatMessageArea';
import RoomInfo from '../components/chat/RoomInfo';
import CreateRoomModal from '../components/chat/CreateRoomModal';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

export default function Chat() {
  const { user } = useAuth();
  const [rooms, setRooms] = useState<any[]>([]);
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [showRoomInfo, setShowRoomInfo] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    fetchRooms();
    subscribeToRooms();
  }, [user]);

  useEffect(() => {
    if (rooms.length > 0 && !selectedRoomId) {
      setSelectedRoomId(rooms[0].id);
    }
  }, [rooms]);

  const fetchRooms = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('chat_room_list')
        .select('*')
        .eq('user_id', user.id)
        .eq('archived', false)
        .order('last_message_time', { ascending: false, nullsFirst: false });

      if (error) throw error;
      setRooms(data || []);
    } catch (error) {
      console.error('Error fetching rooms:', error);
    }
  };

  const subscribeToRooms = () => {
    const subscription = supabase
      .channel('chat_rooms_changes')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'chat_rooms' },
        () => fetchRooms()
      )
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'chat_room_members' },
        () => fetchRooms()
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  };

  const selectedRoom = rooms.find(r => r.id === selectedRoomId);

  return (
    <div className="min-h-screen bg-cream">
      <Header />

      <div className="h-[calc(100vh-73px)] flex">
        <div className="w-80 bg-white border-r-2 border-dark-brown/5 flex flex-col">
          <div className="p-4 border-b-2 border-dark-brown/5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-heading text-2xl font-bold text-primary">Team Chat</h2>
              <button
                onClick={() => setShowCreateModal(true)}
                className="p-2 bg-primary/10 hover:bg-primary/20 text-primary rounded-lg transition-colors"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>
          </div>

          <ChatRoomsList
            rooms={rooms}
            selectedRoomId={selectedRoomId}
            onSelectRoom={setSelectedRoomId}
            onRefresh={fetchRooms}
          />
        </div>

        <div className="flex-1 flex flex-col bg-white">
          {selectedRoom ? (
            <ChatMessageArea
              room={selectedRoom}
              onToggleInfo={() => setShowRoomInfo(!showRoomInfo)}
              showInfo={showRoomInfo}
            />
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <div className="text-6xl mb-4">💬</div>
                <h3 className="font-heading text-2xl font-bold text-dark-brown/60 mb-2">
                  Select a room to start chatting
                </h3>
                <p className="text-dark-brown/40">
                  Choose a room from the sidebar or create a new one
                </p>
              </div>
            </div>
          )}
        </div>

        {showRoomInfo && selectedRoom && (
          <div className="w-80 bg-white border-l-2 border-dark-brown/5">
            <RoomInfo room={selectedRoom} onClose={() => setShowRoomInfo(false)} />
          </div>
        )}
      </div>

      {showCreateModal && (
        <CreateRoomModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            fetchRooms();
          }}
        />
      )}
    </div>
  );
}
