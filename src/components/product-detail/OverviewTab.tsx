import { useState, useEffect } from 'react';
import { Calendar, User as UserIcon, Clock, TrendingUp } from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

interface OverviewTabProps {
  product: any;
  onRefresh: () => void;
}

export default function OverviewTab({ product, onRefresh }: OverviewTabProps) {
  const { user } = useAuth();
  const [stageHistory, setStageHistory] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [creator, setCreator] = useState<any>(null);
  const [editing, setEditing] = useState(false);
  const [description, setDescription] = useState(product.description || '');

  useEffect(() => {
    fetchData();
  }, [product.id]);

  const fetchData = async () => {
    try {
      const [historyRes, usersRes] = await Promise.all([
        supabase
          .from('product_stage_history')
          .select('*, moved_by')
          .eq('product_id', product.id)
          .order('entered_at', { ascending: false }),
        supabase
          .from('users')
          .select('*')
          .order('name'),
      ]);

      if (historyRes.error) throw historyRes.error;
      if (usersRes.error) throw usersRes.error;

      setStageHistory(historyRes.data || []);
      setUsers(usersRes.data || []);

      if (product.created_by) {
        const creatorUser = usersRes.data?.find(u => u.id === product.created_by);
        setCreator(creatorUser);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  const handleSaveDescription = async () => {
    try {
      const { error } = await supabase
        .from('products')
        .update({ description })
        .eq('id', product.id);

      if (error) throw error;

      setEditing(false);
      onRefresh();
    } catch (error) {
      console.error('Error updating description:', error);
    }
  };

  const assignedUsers = users.filter(u => product.assigned_partners?.includes(u.id));
  const totalDays = differenceInDays(new Date(), new Date(product.created_at));

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getUserName = (userId: string) => {
    const user = users.find(u => u.id === userId);
    return user?.name || 'Unknown';
  };

  const stageNames: Record<string, string> = {
    idea: '🌱 Idea',
    research: '🔍 Research',
    formula: '⚗️ Formula Creation',
    testing: '🧪 Testing',
    packaging: '📦 Packaging Design',
    printing: '🖨️ Printing',
    production: '🏭 Production',
    ready: '🚀 Ready to Launch',
    launched: '✅ Launched',
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-gradient-to-br from-cream/50 to-white rounded-xl p-6 border-2 border-dark-brown/5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-heading text-xl font-bold text-primary">Product Information</h3>
              {!editing && (
                <button
                  onClick={() => setEditing(true)}
                  className="px-4 py-2 bg-accent/10 hover:bg-accent/20 text-accent rounded-lg font-semibold transition-colors"
                >
                  Edit Description
                </button>
              )}
            </div>

            {product.image_url && (
              <div className="mb-4 rounded-xl overflow-hidden">
                <img
                  src={product.image_url}
                  alt={product.name}
                  className="w-full h-64 object-cover"
                />
              </div>
            )}

            {editing ? (
              <div>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Enter product description..."
                  rows={6}
                  className="w-full px-4 py-3 border-2 border-accent/30 rounded-xl focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20 resize-none mb-3"
                />
                <div className="flex gap-3">
                  <button
                    onClick={handleSaveDescription}
                    className="px-4 py-2 bg-gradient-to-r from-sage to-primary text-white rounded-lg font-semibold hover:shadow-soft transition-all"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => {
                      setDescription(product.description || '');
                      setEditing(false);
                    }}
                    className="px-4 py-2 bg-dark-brown/5 hover:bg-dark-brown/10 text-dark-brown rounded-lg font-semibold transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-dark-brown/70 leading-relaxed">
                {product.description || 'No description provided yet.'}
              </p>
            )}

            <div className="grid grid-cols-2 gap-4 mt-6 pt-6 border-t-2 border-dark-brown/5">
              <div>
                <p className="text-sm font-semibold text-dark-brown/60 mb-1">Category</p>
                <p className="text-dark-brown font-semibold">{product.category}</p>
              </div>
              <div>
                <p className="text-sm font-semibold text-dark-brown/60 mb-1">Product Type</p>
                <p className="text-dark-brown font-semibold">{product.product_type || 'Not specified'}</p>
              </div>
              <div>
                <p className="text-sm font-semibold text-dark-brown/60 mb-1">Created Date</p>
                <p className="text-dark-brown font-semibold">
                  {format(new Date(product.created_at), 'MMM dd, yyyy')}
                </p>
              </div>
              <div>
                <p className="text-sm font-semibold text-dark-brown/60 mb-1">Created By</p>
                <p className="text-dark-brown font-semibold">{creator?.name || 'Unknown'}</p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-cream/50 to-white rounded-xl p-6 border-2 border-dark-brown/5">
            <h3 className="font-heading text-xl font-bold text-primary mb-4">Stage History</h3>

            <div className="space-y-3">
              {stageHistory.map((history, index) => {
                const daysSpent = history.exited_at
                  ? differenceInDays(new Date(history.exited_at), new Date(history.entered_at))
                  : differenceInDays(new Date(), new Date(history.entered_at));

                return (
                  <div
                    key={history.id}
                    className="flex items-center gap-4 p-4 bg-white rounded-lg border-2 border-dark-brown/5"
                  >
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl ${
                      index === 0 ? 'bg-accent/20' : 'bg-dark-brown/5'
                    }`}>
                      {stageNames[history.stage]?.split(' ')[0] || '📦'}
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-dark-brown">
                        {stageNames[history.stage] || history.stage}
                      </p>
                      <p className="text-sm text-dark-brown/60">
                        Entered {format(new Date(history.entered_at), 'MMM dd, yyyy')} by {getUserName(history.moved_by)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-accent">{daysSpent} days</p>
                      <p className="text-xs text-dark-brown/60">
                        {history.exited_at ? 'Completed' : 'Current'}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-gradient-to-br from-accent/10 to-white rounded-xl p-6 border-2 border-accent/20">
            <h3 className="font-heading text-lg font-bold text-primary mb-4">Quick Stats</h3>

            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                  <Clock className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-dark-brown/60 font-semibold">Total Development</p>
                  <p className="text-xl font-bold text-primary">{totalDays} days</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-sage/10 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-sage" />
                </div>
                <div>
                  <p className="text-sm text-dark-brown/60 font-semibold">Progress</p>
                  <p className="text-xl font-bold text-sage">{product.progress}%</p>
                </div>
              </div>

              {product.target_launch_date && (
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-secondary/10 rounded-lg flex items-center justify-center">
                    <Calendar className="w-6 h-6 text-secondary" />
                  </div>
                  <div>
                    <p className="text-sm text-dark-brown/60 font-semibold">Target Launch</p>
                    <p className="text-xl font-bold text-secondary">
                      {format(new Date(product.target_launch_date), 'MMM dd, yyyy')}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="bg-gradient-to-br from-cream/50 to-white rounded-xl p-6 border-2 border-dark-brown/5">
            <h3 className="font-heading text-lg font-bold text-primary mb-4">Assigned Team</h3>

            {assignedUsers.length > 0 ? (
              <div className="space-y-3">
                {assignedUsers.map(user => (
                  <div key={user.id} className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-accent to-secondary rounded-full flex items-center justify-center text-white font-bold">
                      {getInitials(user.name)}
                    </div>
                    <div>
                      <p className="font-semibold text-dark-brown">{user.name}</p>
                      <p className="text-sm text-dark-brown/60 capitalize">{user.role}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-dark-brown/50 text-sm">No team members assigned yet.</p>
            )}

            <button className="w-full mt-4 px-4 py-2 bg-accent/10 hover:bg-accent/20 text-accent rounded-lg font-semibold transition-colors">
              + Add Team Member
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
