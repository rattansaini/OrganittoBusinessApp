import { useState } from 'react';
import { Edit, Trash2, MoreVertical, ThumbsUp, Heart, Check } from 'lucide-react';
import { format } from 'date-fns';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

interface ChatMessageProps {
  message: any;
  isOwnMessage: boolean;
  onDelete: () => void;
  onEdit: () => void;
}

const QUICK_REACTIONS = ['👍', '❤️', '😂', '🎉', '🔥'];

export default function ChatMessage({ message, isOwnMessage, onDelete, onEdit }: ChatMessageProps) {
  const { user } = useAuth();
  const [showActions, setShowActions] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(message.message_text);

  const handleDelete = async () => {
    if (!confirm('Delete this message?')) return;

    try {
      const { error } = await supabase
        .from('chat_messages')
        .update({ is_deleted: true, deleted_at: new Date().toISOString() })
        .eq('id', message.id);

      if (error) throw error;
      onDelete();
    } catch (error) {
      console.error('Error deleting message:', error);
    }
  };

  const handleEdit = async () => {
    if (!editText.trim()) return;

    try {
      const { error } = await supabase
        .from('chat_messages')
        .update({
          message_text: editText.trim(),
          is_edited: true,
          edited_at: new Date().toISOString(),
        })
        .eq('id', message.id);

      if (error) throw error;
      setIsEditing(false);
      onEdit();
    } catch (error) {
      console.error('Error editing message:', error);
    }
  };

  const handleReaction = async (emoji: string) => {
    if (!user) return;

    try {
      const reactions = message.reactions || {};
      const userReactions = reactions[emoji] || [];

      const newReactions = { ...reactions };
      if (userReactions.includes(user.id)) {
        newReactions[emoji] = userReactions.filter((id: string) => id !== user.id);
        if (newReactions[emoji].length === 0) {
          delete newReactions[emoji];
        }
      } else {
        newReactions[emoji] = [...userReactions, user.id];
      }

      const { error } = await supabase
        .from('chat_messages')
        .update({ reactions: newReactions })
        .eq('id', message.id);

      if (error) throw error;
    } catch (error) {
      console.error('Error adding reaction:', error);
    }
  };

  const formatMessageText = (text: string) => {
    let formatted = text;

    formatted = formatted.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    formatted = formatted.replace(/\*(.*?)\*/g, '<em>$1</em>');
    formatted = formatted.replace(/`(.*?)`/g, '<code class="bg-dark-brown/10 px-1 rounded">$1</code>');
    formatted = formatted.replace(/@(\w+)/g, '<span class="bg-accent/20 text-accent font-semibold px-1 rounded">@$1</span>');

    return formatted;
  };

  const reactions = message.reactions || {};
  const reactionEntries = Object.entries(reactions).filter(([_, users]: [string, any]) => users.length > 0);

  return (
    <div
      className={`flex gap-3 ${isOwnMessage ? 'flex-row-reverse' : 'flex-row'}`}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-sage flex items-center justify-center text-white font-bold flex-shrink-0">
        {message.sender_id?.substring(0, 2).toUpperCase() || 'U'}
      </div>

      <div className={`flex-1 max-w-2xl ${isOwnMessage ? 'items-end' : 'items-start'} flex flex-col`}>
        <div className="flex items-center gap-2 mb-1">
          <span className="text-sm font-semibold text-dark-brown">
            {isOwnMessage ? 'You' : 'Team Member'}
          </span>
          <span className="text-xs text-dark-brown/40">
            {format(new Date(message.created_at), 'h:mm a')}
          </span>
          {message.is_edited && (
            <span className="text-xs text-dark-brown/40 italic">(edited)</span>
          )}
        </div>

        <div className="relative group">
          {isEditing ? (
            <div className="bg-white border-2 border-primary rounded-xl p-3">
              <textarea
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                className="w-full p-2 bg-cream/30 border border-dark-brown/10 rounded-lg focus:outline-none focus:border-primary resize-none"
                rows={3}
                autoFocus
              />
              <div className="flex gap-2 mt-2">
                <button
                  onClick={handleEdit}
                  className="px-3 py-1 bg-primary text-white rounded-lg text-sm font-semibold hover:bg-primary/90 transition-colors"
                >
                  Save
                </button>
                <button
                  onClick={() => {
                    setIsEditing(false);
                    setEditText(message.message_text);
                  }}
                  className="px-3 py-1 bg-dark-brown/10 text-dark-brown rounded-lg text-sm font-semibold hover:bg-dark-brown/20 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <>
              <div
                className={`rounded-xl px-4 py-3 ${
                  isOwnMessage
                    ? 'bg-gradient-to-br from-primary to-sage text-white'
                    : 'bg-white border-2 border-dark-brown/5 text-dark-brown'
                }`}
              >
                <div
                  className="text-sm leading-relaxed break-words"
                  dangerouslySetInnerHTML={{ __html: formatMessageText(message.message_text) }}
                />
              </div>

              {showActions && isOwnMessage && (
                <div className="absolute -top-3 right-0 bg-white rounded-lg shadow-soft border border-dark-brown/10 flex gap-1 p-1">
                  <button
                    onClick={() => setIsEditing(true)}
                    className="p-1.5 hover:bg-cream/50 rounded transition-colors"
                    title="Edit"
                  >
                    <Edit className="w-4 h-4 text-dark-brown/60" />
                  </button>
                  <button
                    onClick={handleDelete}
                    className="p-1.5 hover:bg-soft-red/10 rounded transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4 text-soft-red" />
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        {reactionEntries.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {reactionEntries.map(([emoji, users]: [string, any]) => (
              <button
                key={emoji}
                onClick={() => handleReaction(emoji)}
                className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs transition-colors ${
                  users.includes(user?.id)
                    ? 'bg-accent/20 border-2 border-accent'
                    : 'bg-white border-2 border-dark-brown/10 hover:border-accent'
                }`}
              >
                <span>{emoji}</span>
                <span className="font-semibold">{users.length}</span>
              </button>
            ))}
          </div>
        )}

        <div className="flex gap-1 mt-1">
          {QUICK_REACTIONS.map((emoji) => (
            <button
              key={emoji}
              onClick={() => handleReaction(emoji)}
              className="text-lg opacity-0 group-hover:opacity-100 hover:scale-125 transition-all"
              title={`React with ${emoji}`}
            >
              {emoji}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
