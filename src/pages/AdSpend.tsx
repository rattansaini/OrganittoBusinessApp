import { useEffect, useMemo, useState } from 'react';
import { Megaphone, IndianRupee, TrendingUp, Plus, X, Save, Trash2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { format } from 'date-fns';
import { useAuth } from '../contexts/AuthContext';
import Header from '../components/Header';
import StatsCard from '../components/StatsCard';

interface AdSpendRow {
  id: string;
  platform: string;
  campaign_name: string | null;
  amount: number;
  spend_date: string;
  notes: string | null;
}

const PLATFORM_LABELS: Record<string, string> = {
  meta: 'Meta (Facebook/Instagram)',
  amazon: 'Amazon Ads',
  google: 'Google Ads',
  other: 'Other',
};

const PLATFORM_COLORS: Record<string, string> = {
  meta: 'bg-primary/20 text-primary',
  amazon: 'bg-accent/20 text-accent',
  google: 'bg-secondary/20 text-secondary',
  other: 'bg-dark-brown/20 text-dark-brown',
};

export default function AdSpend() {
  const { user } = useAuth();
  const [rows, setRows] = useState<AdSpendRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newSpend, setNewSpend] = useState({
    platform: 'meta',
    campaign_name: '',
    amount: '',
    spend_date: format(new Date(), 'yyyy-MM-dd'),
    notes: '',
  });
  const [salesTotal, setSalesTotal] = useState(0);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [spendRes, salesRes] = await Promise.all([
        supabase.from('ad_spend').select('*').order('spend_date', { ascending: false }),
        supabase.from('sales_orders').select('total_amount'),
      ]);

      setRows(spendRes.data || []);
      setSalesTotal((salesRes.data || []).reduce((sum, s) => sum + Number(s.total_amount), 0));
    } catch (error) {
      console.error('Error fetching ad spend:', error);
    } finally {
      setLoading(false);
    }
  };

  const addSpend = async () => {
    if (!newSpend.amount || Number(newSpend.amount) <= 0) return;
    setSaving(true);
    try {
      const { error } = await supabase.from('ad_spend').insert({
        platform: newSpend.platform,
        campaign_name: newSpend.campaign_name.trim() || null,
        amount: parseFloat(newSpend.amount),
        spend_date: newSpend.spend_date,
        notes: newSpend.notes.trim() || null,
        created_by: user?.id || null,
      });

      if (error) throw error;
      setNewSpend({ platform: 'meta', campaign_name: '', amount: '', spend_date: format(new Date(), 'yyyy-MM-dd'), notes: '' });
      setShowAddForm(false);
      await fetchData();
    } catch (error) {
      console.error('Error adding ad spend:', error);
    } finally {
      setSaving(false);
    }
  };

  const deleteSpend = async (id: string) => {
    if (!confirm('Are you sure you want to delete this ad spend entry? This action cannot be undone.')) {
      return;
    }

    try {
      const { error } = await supabase.from('ad_spend').delete().eq('id', id);
      if (error) throw error;
      await fetchData();
    } catch (error) {
      console.error('Error deleting ad spend:', error);
    }
  };

  const totalSpend = rows.reduce((sum, r) => sum + Number(r.amount), 0);
  const roas = totalSpend > 0 ? salesTotal / totalSpend : 0;

  const platformTotals = useMemo(() => {
    const totals: Record<string, number> = {};
    rows.forEach((r) => {
      totals[r.platform] = (totals[r.platform] || 0) + Number(r.amount);
    });
    return totals;
  }, [rows]);

  return (
    <div className="min-h-screen bg-cream relative overflow-hidden">
      <div
        className="absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%232D5016' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      />

      <Header />

      <div className="relative z-10 container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="font-heading text-4xl md:text-5xl font-bold text-primary mb-2">Ad Spend</h2>
              <p className="text-dark-brown/70 text-lg">Track what you spend on Meta, Amazon and other ads</p>
            </div>
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="flex items-center gap-2 px-4 py-2.5 bg-primary text-cream rounded-xl font-medium hover:bg-primary/90 transition-all duration-300 shadow-soft"
            >
              <Plus className="w-4 h-4" />
              Log Spend
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <StatsCard
              title="Total Ad Spend"
              value={`₹${totalSpend.toLocaleString('en-IN')}`}
              icon={Megaphone}
              iconBgColor="bg-secondary/20"
              iconColor="text-secondary"
              valueColor="text-secondary"
            />
            <StatsCard
              title="Total Sales (Shopify)"
              value={`₹${salesTotal.toLocaleString('en-IN')}`}
              icon={IndianRupee}
              iconBgColor="bg-primary/20"
              iconColor="text-primary"
              valueColor="text-primary"
            />
            <StatsCard
              title="Return on Ad Spend (ROAS)"
              value={totalSpend > 0 ? `${roas.toFixed(2)}x` : '—'}
              icon={TrendingUp}
              iconBgColor="bg-sage/20"
              iconColor="text-sage"
              valueColor="text-dark-brown"
            />
          </div>

          {Object.keys(platformTotals).length > 0 && (
            <div className="flex flex-wrap gap-3 mb-8">
              {Object.entries(platformTotals).map(([platform, amount]) => (
                <div
                  key={platform}
                  className={`px-4 py-2 rounded-xl text-sm font-semibold ${PLATFORM_COLORS[platform] || 'bg-dark-brown/20 text-dark-brown'}`}
                >
                  {PLATFORM_LABELS[platform] || platform}: ₹{amount.toLocaleString('en-IN')}
                </div>
              ))}
            </div>
          )}

          {showAddForm && (
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-soft-lg p-6 mb-8 border-2 border-primary/10">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-heading text-xl font-bold text-primary">Log Ad Spend</h3>
                <button onClick={() => setShowAddForm(false)} className="text-dark-brown/60 hover:text-dark-brown">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <select
                  value={newSpend.platform}
                  onChange={(e) => setNewSpend({ ...newSpend, platform: e.target.value })}
                  className="px-4 py-2.5 rounded-xl border-2 border-primary/10 focus:border-primary/30 focus:outline-none bg-white"
                >
                  <option value="meta">Meta (Facebook/Instagram)</option>
                  <option value="amazon">Amazon Ads</option>
                  <option value="google">Google Ads</option>
                  <option value="other">Other</option>
                </select>
                <input
                  type="text"
                  placeholder="Campaign name (optional)"
                  value={newSpend.campaign_name}
                  onChange={(e) => setNewSpend({ ...newSpend, campaign_name: e.target.value })}
                  className="px-4 py-2.5 rounded-xl border-2 border-primary/10 focus:border-primary/30 focus:outline-none bg-white"
                />
                <input
                  type="number"
                  placeholder="Amount (₹)"
                  value={newSpend.amount}
                  onChange={(e) => setNewSpend({ ...newSpend, amount: e.target.value })}
                  className="px-4 py-2.5 rounded-xl border-2 border-primary/10 focus:border-primary/30 focus:outline-none bg-white"
                />
                <input
                  type="date"
                  value={newSpend.spend_date}
                  onChange={(e) => setNewSpend({ ...newSpend, spend_date: e.target.value })}
                  className="px-4 py-2.5 rounded-xl border-2 border-primary/10 focus:border-primary/30 focus:outline-none bg-white"
                />
                <input
                  type="text"
                  placeholder="Notes (optional)"
                  value={newSpend.notes}
                  onChange={(e) => setNewSpend({ ...newSpend, notes: e.target.value })}
                  className="px-4 py-2.5 rounded-xl border-2 border-primary/10 focus:border-primary/30 focus:outline-none bg-white md:col-span-2"
                />
              </div>
              <button
                onClick={addSpend}
                disabled={saving || !newSpend.amount}
                className="mt-4 flex items-center gap-2 px-5 py-2.5 bg-primary text-cream rounded-xl font-medium hover:bg-primary/90 transition-all duration-300 disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                Save Entry
              </button>
            </div>
          )}

          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-soft-lg overflow-hidden">
            {loading ? (
              <div className="p-12 text-center text-dark-brown/60">Loading ad spend...</div>
            ) : rows.length === 0 ? (
              <div className="p-12 text-center text-dark-brown/60">
                No ad spend logged yet. Click "Log Spend" to add your first entry.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b-2 border-primary/10 text-left">
                      <th className="px-6 py-4 text-sm font-semibold text-dark-brown/70">Date</th>
                      <th className="px-6 py-4 text-sm font-semibold text-dark-brown/70">Platform</th>
                      <th className="px-6 py-4 text-sm font-semibold text-dark-brown/70">Campaign</th>
                      <th className="px-6 py-4 text-sm font-semibold text-dark-brown/70 text-right">Amount</th>
                      <th className="px-6 py-4 text-sm font-semibold text-dark-brown/70"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((r) => (
                      <tr key={r.id} className="border-b border-primary/5 hover:bg-cream/60 transition-colors">
                        <td className="px-6 py-4 text-dark-brown/70">{format(new Date(r.spend_date), 'MMM d, yyyy')}</td>
                        <td className="px-6 py-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${PLATFORM_COLORS[r.platform] || 'bg-dark-brown/20 text-dark-brown'}`}>
                            {PLATFORM_LABELS[r.platform] || r.platform}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-dark-brown">{r.campaign_name || '—'}</td>
                        <td className="px-6 py-4 text-right font-semibold text-secondary">
                          ₹{Number(r.amount).toLocaleString('en-IN')}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => deleteSpend(r.id)}
                            className="text-dark-brown/40 hover:text-soft-red transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
