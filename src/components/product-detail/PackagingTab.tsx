import { useState, useEffect } from 'react';
import { Plus, ThumbsUp, Eye, Download } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

interface PackagingTabProps {
  productId: string;
}

export default function PackagingTab({ productId }: PackagingTabProps) {
  const { user } = useAuth();
  const [designs, setDesigns] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    version_name: '',
    image_url: '',
    specifications: {},
  });

  useEffect(() => {
    fetchDesigns();
  }, [productId]);

  const fetchDesigns = async () => {
    try {
      const { data, error } = await supabase
        .from('packaging_designs')
        .select('*')
        .eq('product_id', productId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setDesigns(data || []);
    } catch (error) {
      console.error('Error fetching designs:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const { error } = await supabase
        .from('packaging_designs')
        .insert([{
          product_id: productId,
          ...formData,
          uploaded_by: user?.id,
        }]);

      if (error) throw error;

      setFormData({ version_name: '', image_url: '', specifications: {} });
      setShowModal(false);
      fetchDesigns();
    } catch (error) {
      console.error('Error adding design:', error);
    }
  };

  const handleVote = async (designId: string) => {
    const design = designs.find(d => d.id === designId);
    if (!design) return;

    const votes = design.votes || [];
    const hasVoted = votes.includes(user?.id);

    const newVotes = hasVoted
      ? votes.filter((id: string) => id !== user?.id)
      : [...votes, user?.id];

    try {
      const { error } = await supabase
        .from('packaging_designs')
        .update({ votes: newVotes })
        .eq('id', designId);

      if (error) throw error;
      fetchDesigns();
    } catch (error) {
      console.error('Error voting:', error);
    }
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      under_review: { color: 'bg-accent', text: 'Under Review' },
      approved: { color: 'bg-sage', text: 'Approved' },
      rejected: { color: 'bg-soft-red', text: 'Rejected' },
    };
    return badges[status as keyof typeof badges] || badges.under_review;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="font-heading text-2xl font-bold text-primary">Packaging Designs</h3>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-secondary to-accent text-white rounded-xl font-semibold hover:shadow-soft transition-all"
        >
          <Plus className="w-5 h-5" />
          Upload Design
        </button>
      </div>

      {designs.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {designs.map(design => {
            const badge = getStatusBadge(design.status);
            const votes = design.votes || [];

            return (
              <div key={design.id} className="bg-white rounded-xl border-2 border-dark-brown/5 overflow-hidden hover:shadow-soft transition-all">
                {design.image_url ? (
                  <div className="aspect-square bg-cream/30">
                    <img
                      src={design.image_url}
                      alt={design.version_name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="aspect-square bg-gradient-to-br from-cream/50 to-accent/10 flex items-center justify-center">
                    <span className="text-6xl">📦</span>
                  </div>
                )}

                <div className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-bold text-dark-brown">{design.version_name}</h4>
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold text-white ${badge.color}`}>
                      {badge.text}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 mt-4">
                    <button
                      onClick={() => handleVote(design.id)}
                      className={`flex items-center gap-1 px-3 py-2 rounded-lg font-semibold transition-all ${
                        votes.includes(user?.id)
                          ? 'bg-accent text-white'
                          : 'bg-accent/10 text-accent hover:bg-accent/20'
                      }`}
                    >
                      <ThumbsUp className="w-4 h-4" />
                      {votes.length}
                    </button>
                    <button className="flex items-center gap-1 px-3 py-2 bg-dark-brown/5 hover:bg-dark-brown/10 text-dark-brown rounded-lg font-semibold transition-colors">
                      <Eye className="w-4 h-4" />
                      View
                    </button>
                    <button className="flex items-center gap-1 px-3 py-2 bg-dark-brown/5 hover:bg-dark-brown/10 text-dark-brown rounded-lg font-semibold transition-colors">
                      <Download className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-16 bg-cream/30 rounded-xl">
          <span className="text-6xl mb-4 block">📦</span>
          <p className="text-dark-brown/60 mb-4">No packaging designs uploaded yet</p>
          <button
            onClick={() => setShowModal(true)}
            className="px-6 py-3 bg-gradient-to-r from-secondary to-accent text-white font-semibold rounded-xl hover:shadow-soft transition-all"
          >
            Upload First Design
          </button>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-primary/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-soft-lg max-w-xl w-full">
            <div className="bg-gradient-to-r from-secondary to-accent p-6 rounded-t-2xl">
              <h3 className="font-heading text-2xl font-bold text-white">Upload Design</h3>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-dark-brown mb-2">
                  Design Name <span className="text-soft-red">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.version_name}
                  onChange={(e) => setFormData({ ...formData, version_name: e.target.value })}
                  placeholder="e.g., Design A"
                  className="w-full px-4 py-3 border-2 border-dark-brown/10 rounded-xl focus:border-accent focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-dark-brown mb-2">
                  Image URL <span className="text-soft-red">*</span>
                </label>
                <input
                  type="url"
                  required
                  value={formData.image_url}
                  onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                  placeholder="https://example.com/design.jpg"
                  className="w-full px-4 py-3 border-2 border-dark-brown/10 rounded-xl focus:border-accent focus:outline-none"
                />
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-6 py-3 bg-dark-brown/5 text-dark-brown font-semibold rounded-xl hover:bg-dark-brown/10 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-secondary to-accent text-white font-semibold rounded-xl hover:shadow-soft-lg transition-all"
                >
                  Upload Design
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
