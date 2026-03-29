import { useState } from 'react';
import { X } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

interface CreateRoomModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

const ROOM_TYPES = [
  { value: 'general', label: 'General Room' },
  { value: 'project', label: 'Project Room' },
  { value: 'product', label: 'Product Room' },
];

const EMOJI_OPTIONS = ['💬', '💡', '📝', '🎯', '🚀', '⚡', '🌟', '🔥', '💼', '🛠️', '📊', '🎨', '🌿', '💰', '🧪'];

export default function CreateRoomModal({ onClose, onSuccess }: CreateRoomModalProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: 'general',
    icon: '💬',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      alert('Please enter a room name');
      return;
    }

    setLoading(true);

    try {
      const { data: roomData, error: roomError } = await supabase
        .from('chat_rooms')
        .insert([
          {
            name: `${formData.icon} ${formData.name}`,
            description: formData.description,
            type: formData.type,
            icon: formData.icon,
            created_by: user?.id,
          },
        ])
        .select()
        .single();

      if (roomError) throw roomError;

      const { error: memberError } = await supabase
        .from('chat_room_members')
        .insert([
          {
            room_id: roomData.id,
            user_id: user?.id,
            role: 'admin',
          },
        ]);

      if (memberError) throw memberError;

      onSuccess();
    } catch (error) {
      console.error('Error creating room:', error);
      alert('Error creating room. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-primary/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-soft-lg max-w-lg w-full">
        <div className="border-b-2 border-dark-brown/5 px-6 py-4 flex items-center justify-between">
          <h2 className="font-heading text-2xl font-bold text-primary">Create Chat Room</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-dark-brown/5 rounded-lg transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-semibold text-dark-brown mb-2">
              Room Icon <span className="text-soft-red">*</span>
            </label>
            <div className="grid grid-cols-8 gap-2">
              {EMOJI_OPTIONS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => setFormData({ ...formData, icon: emoji })}
                  className={`text-3xl p-3 rounded-lg transition-all ${
                    formData.icon === emoji
                      ? 'bg-primary/10 border-2 border-primary scale-110'
                      : 'bg-cream/50 hover:bg-cream border-2 border-transparent'
                  }`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-dark-brown mb-2">
              Room Name <span className="text-soft-red">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Product Launch Team"
              required
              className="w-full px-4 py-3 border-2 border-dark-brown/10 rounded-xl focus:border-accent focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-dark-brown mb-2">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="What is this room for?"
              rows={3}
              className="w-full px-4 py-3 border-2 border-dark-brown/10 rounded-xl focus:border-accent focus:outline-none resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-dark-brown mb-2">
              Room Type <span className="text-soft-red">*</span>
            </label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              required
              className="w-full px-4 py-3 border-2 border-dark-brown/10 rounded-xl focus:border-accent focus:outline-none"
            >
              {ROOM_TYPES.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          <div className="bg-sage/10 rounded-xl p-4">
            <p className="text-sm text-dark-brown/70">
              You will be added as an admin of this room and can invite other members later.
            </p>
          </div>
        </form>

        <div className="border-t-2 border-dark-brown/5 px-6 py-4 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-6 py-3 bg-white border-2 border-dark-brown/10 text-dark-brown font-semibold rounded-xl hover:bg-dark-brown/5 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="flex-1 px-6 py-3 bg-gradient-to-r from-primary to-sage text-white font-semibold rounded-xl hover:shadow-soft-lg transition-all disabled:opacity-50"
          >
            {loading ? 'Creating...' : 'Create Room'}
          </button>
        </div>
      </div>
    </div>
  );
}
