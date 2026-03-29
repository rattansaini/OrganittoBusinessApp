import { useState, useEffect, useRef } from 'react';
import { Settings, Search, Users, ChevronDown } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import MessageComposer from './MessageComposer';
import ChatMessage from './ChatMessage';
import { format, isToday, isYesterday, isSameDay } from 'date-fns';

interface ChatMessageAreaProps {
  room: any;
  onToggleInfo: () => void;
  showInfo: boolean;
}

export default function ChatMessageArea({ room, onToggleInfo, showInfo }: ChatMessageAreaProps) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [typingUsers, setTypingUsers] = useState<any[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const [showScrollButton, setShowScrollButton] = useState(false);

  useEffect(() => {
    if (room) {
      fetchMessages();
      subscribeToMessages();
      subscribeToTyping();
      markRoomAsRead();
    }
  }, [room?.id]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchMessages = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('room_id', room.id)
        .eq('is_deleted', false)
        .order('created_at', { ascending: true })
        .limit(100);

      if (error) throw error;
      setMessages(data || []);
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const subscribeToMessages = () => {
    const subscription = supabase
      .channel(`room_${room.id}_messages`)
      .on('postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `room_id=eq.${room.id}`,
        },
        (payload) => {
          setMessages(prev => [...prev, payload.new]);
          markRoomAsRead();
        }
      )
      .on('postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'chat_messages',
          filter: `room_id=eq.${room.id}`,
        },
        (payload) => {
          setMessages(prev => prev.map(msg =>
            msg.id === payload.new.id ? payload.new : msg
          ));
        }
      )
      .on('postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'chat_messages',
          filter: `room_id=eq.${room.id}`,
        },
        (payload) => {
          setMessages(prev => prev.filter(msg => msg.id !== payload.old.id));
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  };

  const subscribeToTyping = () => {
    const subscription = supabase
      .channel(`room_${room.id}_typing`)
      .on('postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'chat_typing_status',
          filter: `room_id=eq.${room.id}`,
        },
        async () => {
          const { data } = await supabase
            .from('chat_typing_status')
            .select('*')
            .eq('room_id', room.id)
            .eq('is_typing', true)
            .neq('user_id', user?.id || '');

          setTypingUsers(data || []);
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  };

  const markRoomAsRead = async () => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('chat_room_members')
        .update({
          last_read_at: new Date().toISOString(),
        })
        .eq('room_id', room.id)
        .eq('user_id', user.id);

      if (error) throw error;
    } catch (error) {
      console.error('Error marking room as read:', error);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleScroll = () => {
    if (!messagesContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
    const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
    setShowScrollButton(!isNearBottom);
  };

  const getDateSeparator = (date: string) => {
    const messageDate = new Date(date);
    if (isToday(messageDate)) return 'Today';
    if (isYesterday(messageDate)) return 'Yesterday';
    return format(messageDate, 'MMMM dd, yyyy');
  };

  const shouldShowDateSeparator = (currentMsg: any, prevMsg: any) => {
    if (!prevMsg) return true;
    return !isSameDay(new Date(currentMsg.created_at), new Date(prevMsg.created_at));
  };

  return (
    <div className="flex-1 flex flex-col h-full">
      <div className="border-b-2 border-dark-brown/5 p-4 bg-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="text-3xl">{room.icon}</div>
            <div className="flex-1 min-w-0">
              <h3 className="font-heading text-xl font-bold text-primary truncate">
                {room.name.replace(room.icon, '').trim()}
              </h3>
              {room.description && (
                <p className="text-sm text-dark-brown/60 truncate">{room.description}</p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button className="p-2 hover:bg-dark-brown/5 rounded-lg transition-colors">
              <Search className="w-5 h-5 text-dark-brown/60" />
            </button>
            <button
              onClick={onToggleInfo}
              className={`p-2 rounded-lg transition-colors ${
                showInfo ? 'bg-primary/10 text-primary' : 'hover:bg-dark-brown/5 text-dark-brown/60'
              }`}
            >
              <Settings className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2 mt-2">
          <Users className="w-4 h-4 text-dark-brown/40" />
          <span className="text-sm text-dark-brown/60">
            {room.member_count} member{room.member_count !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      <div
        ref={messagesContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto p-4 bg-cream/30"
      >
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : messages.length > 0 ? (
          <div className="space-y-4">
            {messages.map((message, index) => (
              <div key={message.id}>
                {shouldShowDateSeparator(message, messages[index - 1]) && (
                  <div className="flex items-center gap-3 my-6">
                    <div className="flex-1 h-px bg-dark-brown/10"></div>
                    <span className="text-xs font-semibold text-dark-brown/40 px-3 py-1 bg-white rounded-full">
                      {getDateSeparator(message.created_at)}
                    </span>
                    <div className="flex-1 h-px bg-dark-brown/10"></div>
                  </div>
                )}
                <ChatMessage
                  message={message}
                  isOwnMessage={message.sender_id === user?.id}
                  onDelete={() => fetchMessages()}
                  onEdit={() => fetchMessages()}
                />
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="text-6xl mb-4">{room.icon}</div>
              <h4 className="font-heading text-xl font-bold text-dark-brown/60 mb-2">
                No messages yet
              </h4>
              <p className="text-dark-brown/40">
                Start the conversation!
              </p>
            </div>
          </div>
        )}

        {typingUsers.length > 0 && (
          <div className="flex items-center gap-2 p-3 bg-white rounded-lg shadow-soft mt-4">
            <div className="flex gap-1">
              <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
              <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
              <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
            </div>
            <span className="text-sm text-dark-brown/60">
              {typingUsers.length === 1 ? 'Someone is' : `${typingUsers.length} people are`} typing...
            </span>
          </div>
        )}
      </div>

      {showScrollButton && (
        <button
          onClick={scrollToBottom}
          className="absolute bottom-24 right-8 p-3 bg-primary text-white rounded-full shadow-soft-lg hover:shadow-soft-xl transition-all"
        >
          <ChevronDown className="w-5 h-5" />
        </button>
      )}

      <MessageComposer roomId={room.id} onMessageSent={fetchMessages} />
    </div>
  );
}
