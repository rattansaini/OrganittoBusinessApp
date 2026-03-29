import { useState, useEffect } from 'react';
import { X, Users, Bell, BellOff, Star, Pin, FileText, Image as ImageIcon } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

interface RoomInfoProps {
  room: any;
  onClose: () => void;
}

export default function RoomInfo({ room, onClose }: RoomInfoProps) {
  const { user } = useAuth();
  const [members, setMembers] = useState<any[]>([]);
  const [pinnedMessages, setPinnedMessages] = useState<any[]>([]);
  const [files, setFiles] = useState<any[]>([]);
  const [isMuted, setIsMuted] = useState(room.is_muted);
  const [isFavorite, setIsFavorite] = useState(room.is_favorite);

  useEffect(() => {
    fetchMembers();
    fetchPinnedMessages();
    fetchFiles();
  }, [room.id]);

  const fetchMembers = async () => {
    try {
      const { data, error } = await supabase
        .from('chat_room_members')
        .select('*')
        .eq('room_id', room.id);

      if (error) throw error;
      setMembers(data || []);
    } catch (error) {
      console.error('Error fetching members:', error);
    }
  };

  const fetchPinnedMessages = async () => {
    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('room_id', room.id)
        .eq('is_pinned', true)
        .eq('is_deleted', false)
        .order('pinned_at', { ascending: false })
        .limit(5);

      if (error) throw error;
      setPinnedMessages(data || []);
    } catch (error) {
      console.error('Error fetching pinned messages:', error);
    }
  };

  const fetchFiles = async () => {
    try {
      const { data, error } = await supabase
        .from('chat_files')
        .select('*')
        .eq('room_id', room.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      setFiles(data || []);
    } catch (error) {
      console.error('Error fetching files:', error);
    }
  };

  const toggleMute = async () => {
    try {
      const { error } = await supabase
        .from('chat_room_members')
        .update({ is_muted: !isMuted })
        .eq('room_id', room.id)
        .eq('user_id', user?.id);

      if (error) throw error;
      setIsMuted(!isMuted);
    } catch (error) {
      console.error('Error toggling mute:', error);
    }
  };

  const toggleFavorite = async () => {
    try {
      const { error } = await supabase
        .from('chat_room_members')
        .update({ is_favorite: !isFavorite })
        .eq('room_id', room.id)
        .eq('user_id', user?.id);

      if (error) throw error;
      setIsFavorite(!isFavorite);
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  };

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="p-4 border-b-2 border-dark-brown/5 flex items-center justify-between">
        <h3 className="font-heading text-lg font-bold text-primary">Room Info</h3>
        <button
          onClick={onClose}
          className="p-2 hover:bg-dark-brown/5 rounded-lg transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        <div className="text-center">
          <div className="text-6xl mb-3">{room.icon}</div>
          <h4 className="font-heading text-xl font-bold text-primary mb-1">
            {room.name.replace(room.icon, '').trim()}
          </h4>
          {room.description && (
            <p className="text-sm text-dark-brown/60">{room.description}</p>
          )}
        </div>

        <div className="flex gap-2">
          <button
            onClick={toggleMute}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-semibold transition-colors ${
              isMuted
                ? 'bg-accent/10 text-accent'
                : 'bg-dark-brown/5 text-dark-brown hover:bg-dark-brown/10'
            }`}
          >
            {isMuted ? <BellOff className="w-4 h-4" /> : <Bell className="w-4 h-4" />}
            {isMuted ? 'Unmute' : 'Mute'}
          </button>

          <button
            onClick={toggleFavorite}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-semibold transition-colors ${
              isFavorite
                ? 'bg-accent/10 text-accent'
                : 'bg-dark-brown/5 text-dark-brown hover:bg-dark-brown/10'
            }`}
          >
            <Star className={`w-4 h-4 ${isFavorite ? 'fill-accent' : ''}`} />
            {isFavorite ? 'Starred' : 'Star'}
          </button>
        </div>

        <div>
          <div className="flex items-center gap-2 mb-3">
            <Users className="w-5 h-5 text-primary" />
            <h4 className="font-semibold text-dark-brown">
              Members ({members.length})
            </h4>
          </div>

          <div className="space-y-2">
            {members.map((member) => (
              <div
                key={member.id}
                className="flex items-center gap-3 p-2 rounded-lg hover:bg-cream/50 transition-colors"
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-sage flex items-center justify-center text-white text-sm font-bold">
                  {member.user_id?.substring(0, 2).toUpperCase() || 'U'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-dark-brown truncate">
                    {member.user_id === user?.id ? 'You' : 'Team Member'}
                  </p>
                  {member.role === 'admin' && (
                    <span className="text-xs text-accent">Admin</span>
                  )}
                </div>
                <div className="w-2 h-2 rounded-full bg-sage"></div>
              </div>
            ))}
          </div>
        </div>

        {pinnedMessages.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Pin className="w-5 h-5 text-primary" />
              <h4 className="font-semibold text-dark-brown">
                Pinned Messages ({pinnedMessages.length})
              </h4>
            </div>

            <div className="space-y-2">
              {pinnedMessages.map((msg) => (
                <div
                  key={msg.id}
                  className="p-3 bg-cream/50 rounded-lg border border-dark-brown/10"
                >
                  <p className="text-sm text-dark-brown line-clamp-2">{msg.message_text}</p>
                  <p className="text-xs text-dark-brown/40 mt-1">
                    {new Date(msg.created_at).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {files.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <FileText className="w-5 h-5 text-primary" />
              <h4 className="font-semibold text-dark-brown">
                Shared Files ({files.length})
              </h4>
            </div>

            <div className="space-y-2">
              {files.slice(0, 5).map((file) => (
                <div
                  key={file.id}
                  className="flex items-center gap-3 p-2 rounded-lg hover:bg-cream/50 transition-colors"
                >
                  {file.file_type.startsWith('image/') ? (
                    <ImageIcon className="w-5 h-5 text-primary" />
                  ) : (
                    <FileText className="w-5 h-5 text-primary" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-dark-brown truncate">
                      {file.file_name}
                    </p>
                    <p className="text-xs text-dark-brown/40">
                      {(file.file_size / 1024).toFixed(1)} KB
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="bg-sage/10 rounded-xl p-4">
          <h4 className="font-semibold text-dark-brown mb-2">Notification Settings</h4>
          <p className="text-sm text-dark-brown/70">
            {isMuted
              ? 'Notifications are muted for this room'
              : 'You will receive notifications for all messages'}
          </p>
        </div>
      </div>
    </div>
  );
}
