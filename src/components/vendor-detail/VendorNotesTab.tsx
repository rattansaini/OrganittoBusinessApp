import { useEffect, useState } from 'react';
import { Plus, MessageSquare, Star, User, Edit, Trash2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

interface VendorNotesTabProps {
  vendorId: string;
  vendorRating: number;
}

const reviewCategories = [
  { id: 'quality', label: 'Product Quality' },
  { id: 'delivery', label: 'Delivery Time' },
  { id: 'pricing', label: 'Pricing' },
  { id: 'service', label: 'Customer Service' },
  { id: 'reliability', label: 'Reliability' },
];

export default function VendorNotesTab({ vendorId, vendorRating }: VendorNotesTabProps) {
  const { user } = useAuth();
  const [notes, setNotes] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [newNote, setNewNote] = useState('');
  const [showAddReview, setShowAddReview] = useState(false);
  const [newReview, setNewReview] = useState({
    category: 'quality',
    rating: 5,
    text: '',
  });

  useEffect(() => {
    fetchNotes();
    fetchReviews();
  }, [vendorId]);

  const fetchNotes = async () => {
    try {
      const { data, error } = await supabase
        .from('vendor_notes')
        .select('*')
        .eq('vendor_id', vendorId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setNotes(data || []);
    } catch (error) {
      console.error('Error fetching notes:', error);
    }
  };

  const fetchReviews = async () => {
    try {
      const { data, error } = await supabase
        .from('vendor_reviews')
        .select('*')
        .eq('vendor_id', vendorId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setReviews(data || []);
    } catch (error) {
      console.error('Error fetching reviews:', error);
    }
  };

  const handleAddNote = async () => {
    if (!newNote.trim()) return;

    try {
      const { error } = await supabase.from('vendor_notes').insert([
        {
          vendor_id: vendorId,
          note_text: newNote,
          written_by: user?.id,
        },
      ]);

      if (error) throw error;

      setNewNote('');
      fetchNotes();
    } catch (error) {
      console.error('Error adding note:', error);
      alert('Error adding note');
    }
  };

  const handleAddReview = async () => {
    if (!newReview.text.trim()) {
      alert('Please write a review');
      return;
    }

    try {
      const { error } = await supabase.from('vendor_reviews').insert([
        {
          vendor_id: vendorId,
          category: newReview.category,
          rating: newReview.rating,
          review_text: newReview.text,
          reviewed_by: user?.id,
        },
      ]);

      if (error) throw error;

      setNewReview({ category: 'quality', rating: 5, text: '' });
      setShowAddReview(false);
      fetchReviews();
    } catch (error) {
      console.error('Error adding review:', error);
      alert('Error adding review');
    }
  };

  const renderStars = (rating: number, interactive: boolean = false, onRate?: (rating: number) => void) => {
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map(star => (
          <button
            key={star}
            type="button"
            onClick={() => interactive && onRate && onRate(star)}
            disabled={!interactive}
            className={interactive ? 'cursor-pointer' : ''}
          >
            <Star
              className={`w-5 h-5 ${
                star <= rating ? 'fill-amber-400 text-amber-400' : 'text-dark-brown/20'
              } ${interactive ? 'hover:fill-amber-400 hover:text-amber-400' : ''}`}
            />
          </button>
        ))}
      </div>
    );
  };

  const getCategoryRating = (category: string) => {
    const categoryReviews = reviews.filter(r => r.category === category);
    if (categoryReviews.length === 0) return 0;
    return categoryReviews.reduce((sum, r) => sum + r.rating, 0) / categoryReviews.length;
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-heading text-xl font-bold text-primary">Internal Notes</h3>
          </div>

          <div className="bg-cream/50 rounded-xl p-4 mb-4">
            <textarea
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              placeholder="Add a note about this vendor..."
              rows={3}
              className="w-full px-4 py-3 border-2 border-dark-brown/10 rounded-xl focus:border-accent focus:outline-none resize-none mb-3"
            />
            <button
              onClick={handleAddNote}
              disabled={!newNote.trim()}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-primary to-sage text-white rounded-xl font-semibold hover:shadow-soft-lg transition-all disabled:opacity-50"
            >
              <Plus className="w-5 h-5" />
              Add Note
            </button>
          </div>

          <div className="space-y-3">
            {notes.length > 0 ? (
              notes.map(note => (
                <div
                  key={note.id}
                  className="bg-white border-2 border-dark-brown/5 rounded-xl p-4"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                        <User className="w-4 h-4 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-dark-brown">User</p>
                        <p className="text-xs text-dark-brown/60">
                          {new Date(note.created_at).toLocaleDateString()} at{' '}
                          {new Date(note.created_at).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button className="p-1 hover:bg-primary/10 text-primary rounded transition-colors">
                        <Edit className="w-4 h-4" />
                      </button>
                      <button className="p-1 hover:bg-soft-red/10 text-soft-red rounded transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <p className="text-sm text-dark-brown">{note.note_text}</p>
                </div>
              ))
            ) : (
              <div className="text-center py-8 bg-white border-2 border-dark-brown/5 rounded-xl">
                <MessageSquare className="w-12 h-12 text-dark-brown/20 mx-auto mb-2" />
                <p className="text-sm text-dark-brown/60">No notes yet</p>
              </div>
            )}
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-heading text-xl font-bold text-primary">Ratings & Reviews</h3>
            <button
              onClick={() => setShowAddReview(!showAddReview)}
              className="flex items-center gap-2 px-4 py-2 bg-accent/10 hover:bg-accent/20 text-accent rounded-xl font-semibold transition-colors"
            >
              <Plus className="w-5 h-5" />
              Add Review
            </button>
          </div>

          <div className="bg-gradient-to-br from-amber-500/10 to-amber-600/10 rounded-xl p-6 mb-4">
            <div className="text-center mb-4">
              <p className="text-5xl font-bold text-amber-600 mb-2">
                {vendorRating?.toFixed(1) || '0.0'}
              </p>
              {renderStars(vendorRating || 0)}
              <p className="text-sm text-dark-brown/60 mt-2">
                Based on {reviews.length} reviews
              </p>
            </div>

            <div className="space-y-2">
              {reviewCategories.map(cat => {
                const rating = getCategoryRating(cat.id);
                return (
                  <div key={cat.id} className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-dark-brown">{cat.label}</span>
                    <div className="flex items-center gap-2">
                      {renderStars(rating)}
                      <span className="text-sm text-dark-brown/60 w-8">
                        {rating > 0 ? rating.toFixed(1) : '-'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {showAddReview && (
            <div className="bg-cream/50 rounded-xl p-4 mb-4">
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-semibold text-dark-brown mb-2">
                    Category
                  </label>
                  <select
                    value={newReview.category}
                    onChange={(e) => setNewReview({ ...newReview, category: e.target.value })}
                    className="w-full px-4 py-2 border-2 border-dark-brown/10 rounded-lg focus:border-accent focus:outline-none"
                  >
                    {reviewCategories.map(cat => (
                      <option key={cat.id} value={cat.id}>
                        {cat.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-dark-brown mb-2">
                    Rating
                  </label>
                  {renderStars(newReview.rating, true, (rating) =>
                    setNewReview({ ...newReview, rating })
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-dark-brown mb-2">
                    Review
                  </label>
                  <textarea
                    value={newReview.text}
                    onChange={(e) => setNewReview({ ...newReview, text: e.target.value })}
                    placeholder="Write your review..."
                    rows={3}
                    className="w-full px-4 py-3 border-2 border-dark-brown/10 rounded-xl focus:border-accent focus:outline-none resize-none"
                  />
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => setShowAddReview(false)}
                    className="flex-1 px-4 py-2 bg-white border-2 border-dark-brown/10 text-dark-brown font-semibold rounded-xl hover:bg-dark-brown/5 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAddReview}
                    className="flex-1 px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 text-white font-semibold rounded-xl hover:shadow-soft-lg transition-all"
                  >
                    Submit Review
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-3">
            {reviews.length > 0 ? (
              reviews.map(review => {
                const category = reviewCategories.find(c => c.id === review.category);
                return (
                  <div
                    key={review.id}
                    className="bg-white border-2 border-dark-brown/5 rounded-xl p-4"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <span className="px-3 py-1 bg-accent/10 text-accent rounded-full text-xs font-semibold">
                          {category?.label}
                        </span>
                        {renderStars(review.rating)}
                      </div>
                      <p className="text-xs text-dark-brown/60">
                        {new Date(review.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <p className="text-sm text-dark-brown">{review.review_text}</p>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-8 bg-white border-2 border-dark-brown/5 rounded-xl">
                <Star className="w-12 h-12 text-dark-brown/20 mx-auto mb-2" />
                <p className="text-sm text-dark-brown/60">No reviews yet</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
