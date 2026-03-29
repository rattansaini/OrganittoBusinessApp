import { useState, useEffect } from 'react';
import { Send, Smile, Paperclip, Reply } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { format } from 'date-fns';

interface DiscussionTabProps {
  productId: string;
}

export default function DiscussionTab({ productId }: DiscussionTabProps) {
  const { user } = useAuth();
  const [comments, setComments] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [commentText, setCommentText] = useState('');

  useEffect(() => {
    fetchData();
    const subscription = subscribeToComments();
    return () => {
      subscription.unsubscribe();
    };
  }, [productId]);

  const fetchData = async () => {
    try {
      const [commentsRes, usersRes] = await Promise.all([
        supabase
          .from('product_comments')
          .select('*')
          .eq('product_id', productId)
          .is('parent_comment_id', null)
          .order('created_at', { ascending: true }),
        supabase
          .from('users')
          .select('*'),
      ]);

      if (commentsRes.error) throw commentsRes.error;
      if (usersRes.error) throw usersRes.error;

      setComments(commentsRes.data || []);
      setUsers(usersRes.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  const subscribeToComments = () => {
    return supabase
      .channel(`product_comments:${productId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'product_comments',
          filter: `product_id=eq.${productId}`,
        },
        () => {
          fetchData();
        }
      )
      .subscribe();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    try {
      const { error } = await supabase
        .from('product_comments')
        .insert([{
          product_id: productId,
          user_id: user?.id,
          text: commentText,
        }]);

      if (error) throw error;

      setCommentText('');
    } catch (error) {
      console.error('Error adding comment:', error);
    }
  };

  const handleReaction = async (commentId: string, emoji: string) => {
    const comment = comments.find(c => c.id === commentId);
    if (!comment) return;

    const reactions = comment.reactions || [];
    const existingReaction = reactions.find((r: any) => r.userId === user?.id && r.emoji === emoji);

    let newReactions;
    if (existingReaction) {
      newReactions = reactions.filter((r: any) => !(r.userId === user?.id && r.emoji === emoji));
    } else {
      newReactions = [...reactions, { userId: user?.id, emoji }];
    }

    try {
      const { error } = await supabase
        .from('product_comments')
        .update({ reactions: newReactions })
        .eq('id', commentId);

      if (error) throw error;
    } catch (error) {
      console.error('Error updating reaction:', error);
    }
  };

  const getUserInfo = (userId: string) => {
    return users.find(u => u.id === userId);
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const groupReactions = (reactions: any[]) => {
    const grouped: Record<string, any[]> = {};
    reactions.forEach(r => {
      if (!grouped[r.emoji]) grouped[r.emoji] = [];
      grouped[r.emoji].push(r.userId);
    });
    return grouped;
  };

  return (
    <div className="space-y-6">
      <h3 className="font-heading text-2xl font-bold text-primary">Team Discussion</h3>

      <form onSubmit={handleSubmit} className="bg-gradient-to-br from-cream/50 to-white rounded-xl p-6 border-2 border-dark-brown/5">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 bg-gradient-to-br from-accent to-secondary rounded-full flex items-center justify-center text-white font-bold flex-shrink-0">
            {user?.name ? getInitials(user.name) : '?'}
          </div>
          <div className="flex-1">
            <textarea
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Share your thoughts, ask questions, or provide updates..."
              rows={3}
              className="w-full px-4 py-3 border-2 border-dark-brown/10 rounded-xl focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20 resize-none"
            />
            <div className="flex items-center justify-between mt-3">
              <div className="flex gap-2">
                <button
                  type="button"
                  className="p-2 text-dark-brown/60 hover:text-accent hover:bg-accent/10 rounded-lg transition-colors"
                  title="Add emoji"
                >
                  <Smile className="w-5 h-5" />
                </button>
                <button
                  type="button"
                  className="p-2 text-dark-brown/60 hover:text-accent hover:bg-accent/10 rounded-lg transition-colors"
                  title="Attach file"
                >
                  <Paperclip className="w-5 h-5" />
                </button>
              </div>
              <button
                type="submit"
                disabled={!commentText.trim()}
                className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-accent to-secondary text-white rounded-xl font-semibold hover:shadow-soft transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="w-5 h-5" />
                Send
              </button>
            </div>
          </div>
        </div>
      </form>

      <div className="space-y-4">
        {comments.map(comment => {
          const author = getUserInfo(comment.user_id);
          const reactions = groupReactions(comment.reactions || []);

          return (
            <div key={comment.id} className="bg-white rounded-xl p-6 border-2 border-dark-brown/5 hover:border-accent/20 transition-colors">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-gradient-to-br from-accent to-secondary rounded-full flex items-center justify-center text-white font-bold flex-shrink-0">
                  {author ? getInitials(author.name) : '?'}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="font-semibold text-dark-brown">{author?.name || 'Unknown'}</span>
                    <span className="text-sm text-dark-brown/50">
                      {format(new Date(comment.created_at), 'MMM dd, yyyy HH:mm')}
                    </span>
                  </div>

                  <p className="text-dark-brown/80 leading-relaxed mb-3">
                    {comment.text}
                  </p>

                  {Object.keys(reactions).length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-3">
                      {Object.entries(reactions).map(([emoji, userIds]) => (
                        <button
                          key={emoji}
                          onClick={() => handleReaction(comment.id, emoji)}
                          className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm transition-all ${
                            (userIds as string[]).includes(user?.id || '')
                              ? 'bg-accent/20 border-2 border-accent'
                              : 'bg-dark-brown/5 border-2 border-transparent hover:border-accent/30'
                          }`}
                        >
                          <span>{emoji}</span>
                          <span className="font-semibold text-dark-brown">{(userIds as string[]).length}</span>
                        </button>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center gap-4 text-sm text-dark-brown/60">
                    <button className="hover:text-accent transition-colors">
                      <Reply className="w-4 h-4 inline mr-1" />
                      Reply
                    </button>
                    <button
                      onClick={() => handleReaction(comment.id, '👍')}
                      className="hover:text-accent transition-colors"
                    >
                      👍 Like
                    </button>
                    <button
                      onClick={() => handleReaction(comment.id, '❤️')}
                      className="hover:text-accent transition-colors"
                    >
                      ❤️ Love
                    </button>
                    <button
                      onClick={() => handleReaction(comment.id, '🎉')}
                      className="hover:text-accent transition-colors"
                    >
                      🎉 Celebrate
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {comments.length === 0 && (
        <div className="text-center py-16 bg-cream/30 rounded-xl">
          <span className="text-6xl mb-4 block">💬</span>
          <p className="text-dark-brown/60">No comments yet. Start the discussion!</p>
        </div>
      )}
    </div>
  );
}
