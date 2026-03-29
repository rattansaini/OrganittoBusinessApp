import { useState, useRef, useEffect } from 'react';
import { Send, Paperclip, Image as ImageIcon, Smile } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

interface MessageComposerProps {
  roomId: string;
  onMessageSent: () => void;
}

const EMOJI_LIST = ['😊', '👍', '❤️', '😂', '🎉', '🔥', '✅', '👏', '💡', '🌟', '🙏', '💯'];

export default function MessageComposer({ roomId, onMessageSent }: MessageComposerProps) {
  const { user } = useAuth();
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    adjustTextareaHeight();
  }, [message]);

  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      updateTypingStatus(false);
    };
  }, [roomId]);

  const adjustTextareaHeight = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      const newHeight = Math.min(textareaRef.current.scrollHeight, 200);
      textareaRef.current.style.height = `${newHeight}px`;
    }
  };

  const updateTypingStatus = async (isTyping: boolean) => {
    if (!user) return;

    try {
      if (isTyping) {
        await supabase
          .from('chat_typing_status')
          .upsert({
            room_id: roomId,
            user_id: user.id,
            is_typing: true,
            last_typing_time: new Date().toISOString(),
          }, {
            onConflict: 'room_id,user_id'
          });
      } else {
        await supabase
          .from('chat_typing_status')
          .delete()
          .eq('room_id', roomId)
          .eq('user_id', user.id);
      }
    } catch (error) {
      console.error('Error updating typing status:', error);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value);

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    if (e.target.value.trim()) {
      updateTypingStatus(true);
      typingTimeoutRef.current = setTimeout(() => {
        updateTypingStatus(false);
      }, 3000);
    } else {
      updateTypingStatus(false);
    }
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();

    if (!message.trim() || !user || sending) return;

    const messageText = message.trim();
    setMessage('');
    setSending(true);
    updateTypingStatus(false);

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    try {
      const mentions = extractMentions(messageText);

      const { error } = await supabase
        .from('chat_messages')
        .insert([
          {
            room_id: roomId,
            sender_id: user.id,
            message_text: messageText,
            message_type: 'text',
            mentions: mentions,
          },
        ]);

      if (error) throw error;
      onMessageSent();
    } catch (error) {
      console.error('Error sending message:', error);
      setMessage(messageText);
    } finally {
      setSending(false);
    }
  };

  const extractMentions = (text: string): string[] => {
    const mentionRegex = /@(\w+)/g;
    const mentions = [];
    let match;
    while ((match = mentionRegex.exec(text)) !== null) {
      mentions.push(match[1]);
    }
    return mentions;
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const insertEmoji = (emoji: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const newMessage = message.substring(0, start) + emoji + message.substring(end);
    setMessage(newMessage);

    setTimeout(() => {
      textarea.focus();
      const newCursorPos = start + emoji.length;
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);

    setShowEmojiPicker(false);
  };

  return (
    <div className="border-t-2 border-dark-brown/5 bg-white p-4">
      <form onSubmit={handleSendMessage} className="flex flex-col gap-3">
        <div className="flex items-end gap-2">
          <div className="flex-1 bg-cream/50 border-2 border-dark-brown/10 rounded-xl focus-within:border-primary transition-colors">
            <textarea
              ref={textareaRef}
              value={message}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder="Type a message... (Shift+Enter for new line)"
              rows={1}
              className="w-full px-4 py-3 bg-transparent resize-none focus:outline-none"
              style={{ maxHeight: '200px' }}
            />

            <div className="flex items-center gap-2 px-4 pb-3">
              <button
                type="button"
                className="p-2 hover:bg-dark-brown/5 rounded-lg transition-colors text-dark-brown/60 hover:text-primary"
                title="Attach file"
              >
                <Paperclip className="w-5 h-5" />
              </button>

              <button
                type="button"
                className="p-2 hover:bg-dark-brown/5 rounded-lg transition-colors text-dark-brown/60 hover:text-primary"
                title="Attach image"
              >
                <ImageIcon className="w-5 h-5" />
              </button>

              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                  className="p-2 hover:bg-dark-brown/5 rounded-lg transition-colors text-dark-brown/60 hover:text-primary"
                  title="Add emoji"
                >
                  <Smile className="w-5 h-5" />
                </button>

                {showEmojiPicker && (
                  <div className="absolute bottom-full left-0 mb-2 bg-white rounded-xl shadow-soft-lg border-2 border-dark-brown/5 p-3 grid grid-cols-6 gap-2">
                    {EMOJI_LIST.map((emoji) => (
                      <button
                        key={emoji}
                        type="button"
                        onClick={() => insertEmoji(emoji)}
                        className="text-2xl hover:bg-cream/50 rounded-lg p-2 transition-colors"
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex-1"></div>

              <span className="text-xs text-dark-brown/40">
                {message.length > 0 && `${message.length} characters`}
              </span>
            </div>
          </div>

          <button
            type="submit"
            disabled={!message.trim() || sending}
            className="p-4 bg-gradient-to-r from-primary to-sage text-white rounded-xl font-semibold hover:shadow-soft-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>

        <p className="text-xs text-dark-brown/40 px-1">
          Use <span className="font-mono bg-dark-brown/5 px-1 rounded">@username</span> to mention someone •{' '}
          <span className="font-mono bg-dark-brown/5 px-1 rounded">**bold**</span> for bold text
        </p>
      </form>
    </div>
  );
}
