import { useState } from 'react';
import { Search, Star, Bell, BellOff } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface ChatRoomsListProps {
  rooms: any[];
  selectedRoomId: string | null;
  onSelectRoom: (roomId: string) => void;
  onRefresh: () => void;
}

export default function ChatRoomsList({
  rooms,
  selectedRoomId,
  onSelectRoom,
}: ChatRoomsListProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'unread' | 'favorites'>('all');

  const filteredRooms = rooms.filter(room => {
    const matchesSearch = room.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter =
      filter === 'all' ||
      (filter === 'unread' && room.unread_count > 0) ||
      (filter === 'favorites' && room.is_favorite);
    return matchesSearch && matchesFilter;
  });

  const sortedRooms = [...filteredRooms].sort((a, b) => {
    if (a.is_favorite && !b.is_favorite) return -1;
    if (!a.is_favorite && b.is_favorite) return 1;
    if (a.unread_count > 0 && b.unread_count === 0) return -1;
    if (a.unread_count === 0 && b.unread_count > 0) return 1;
    const aTime = a.last_message_time ? new Date(a.last_message_time).getTime() : 0;
    const bTime = b.last_message_time ? new Date(b.last_message_time).getTime() : 0;
    return bTime - aTime;
  });

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="p-4 border-b border-dark-brown/5">
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-brown/40" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search rooms..."
            className="w-full pl-10 pr-4 py-2 bg-cream/50 border border-dark-brown/10 rounded-lg text-sm focus:outline-none focus:border-primary"
          />
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`flex-1 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
              filter === 'all'
                ? 'bg-primary text-white'
                : 'bg-cream/50 text-dark-brown hover:bg-cream'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilter('unread')}
            className={`flex-1 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
              filter === 'unread'
                ? 'bg-primary text-white'
                : 'bg-cream/50 text-dark-brown hover:bg-cream'
            }`}
          >
            Unread
          </button>
          <button
            onClick={() => setFilter('favorites')}
            className={`flex-1 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
              filter === 'favorites'
                ? 'bg-primary text-white'
                : 'bg-cream/50 text-dark-brown hover:bg-cream'
            }`}
          >
            Starred
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {sortedRooms.length > 0 ? (
          <div className="p-2">
            {sortedRooms.map(room => (
              <button
                key={room.id}
                onClick={() => onSelectRoom(room.id)}
                className={`w-full p-3 rounded-lg mb-1 transition-all text-left ${
                  selectedRoomId === room.id
                    ? 'bg-primary/10 border-2 border-primary/20'
                    : 'hover:bg-cream/50 border-2 border-transparent'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="text-2xl flex-shrink-0">{room.icon}</div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2 min-w-0">
                        <h4 className={`font-semibold truncate ${
                          room.unread_count > 0 ? 'text-primary' : 'text-dark-brown'
                        }`}>
                          {room.name.replace(room.icon, '').trim()}
                        </h4>
                        {room.is_favorite && (
                          <Star className="w-3 h-3 text-accent fill-accent flex-shrink-0" />
                        )}
                        {room.is_muted && (
                          <BellOff className="w-3 h-3 text-dark-brown/40 flex-shrink-0" />
                        )}
                      </div>

                      {room.unread_count > 0 && (
                        <span className="flex-shrink-0 min-w-[20px] h-5 px-2 bg-soft-red text-white text-xs font-bold rounded-full flex items-center justify-center">
                          {room.unread_count > 99 ? '99+' : room.unread_count}
                        </span>
                      )}
                    </div>

                    {room.last_message && (
                      <p className="text-xs text-dark-brown/60 truncate mb-1">
                        {room.last_message}
                      </p>
                    )}

                    <div className="flex items-center justify-between">
                      <span className="text-xs text-dark-brown/40">
                        {room.member_count} member{room.member_count !== 1 ? 's' : ''}
                      </span>
                      {room.last_message_time && (
                        <span className="text-xs text-dark-brown/40">
                          {formatDistanceToNow(new Date(room.last_message_time), { addSuffix: true })}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center">
            <Bell className="w-12 h-12 text-dark-brown/20 mx-auto mb-3" />
            <p className="text-sm text-dark-brown/40">
              {searchQuery ? 'No rooms found' : 'No rooms available'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
