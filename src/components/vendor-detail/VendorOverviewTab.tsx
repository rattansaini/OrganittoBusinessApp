import { useEffect, useState } from 'react';
import { Phone, Mail, MapPin, Globe, CreditCard, Award, TrendingUp } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { supabase } from '../../lib/supabase';

interface VendorOverviewTabProps {
  vendor: any;
  onUpdate: () => void;
}

export default function VendorOverviewTab({ vendor }: VendorOverviewTabProps) {
  const [stats, setStats] = useState({
    totalSpent: 0,
    thisMonth: 0,
    thisYear: 0,
    avgTransaction: 0,
    pendingPayment: 0,
    totalTransactions: 0,
  });
  const [spendingTrend, setSpendingTrend] = useState<any[]>([]);

  useEffect(() => {
    fetchStats();
    fetchSpendingTrend();
  }, [vendor.id]);

  const fetchStats = async () => {
    try {
      const { data: transactions } = await supabase
        .from('vendor_transactions')
        .select('*')
        .eq('vendor_id', vendor.id);

      if (!transactions) return;

      const now = new Date();
      const thisMonth = transactions.filter(t => {
        const tDate = new Date(t.date);
        return tDate.getMonth() === now.getMonth() && tDate.getFullYear() === now.getFullYear();
      });

      const thisYear = transactions.filter(t => {
        const tDate = new Date(t.date);
        return tDate.getFullYear() === now.getFullYear();
      });

      const totalSpent = transactions.reduce((sum, t) => sum + parseFloat(t.amount), 0);
      const thisMonthSpent = thisMonth.reduce((sum, t) => sum + parseFloat(t.amount), 0);
      const thisYearSpent = thisYear.reduce((sum, t) => sum + parseFloat(t.amount), 0);
      const pending = transactions
        .filter(t => t.status === 'pending')
        .reduce((sum, t) => sum + parseFloat(t.amount), 0);

      setStats({
        totalSpent,
        thisMonth: thisMonthSpent,
        thisYear: thisYearSpent,
        avgTransaction: transactions.length > 0 ? totalSpent / transactions.length : 0,
        pendingPayment: pending,
        totalTransactions: transactions.length,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const fetchSpendingTrend = async () => {
    try {
      const { data: transactions } = await supabase
        .from('vendor_transactions')
        .select('date, amount')
        .eq('vendor_id', vendor.id)
        .order('date');

      if (!transactions) return;

      const monthlyData: any = {};
      transactions.forEach(t => {
        const date = new Date(t.date);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        if (!monthlyData[monthKey]) {
          monthlyData[monthKey] = 0;
        }
        monthlyData[monthKey] += parseFloat(t.amount);
      });

      const trend = Object.entries(monthlyData).map(([month, amount]) => ({
        month,
        amount,
      }));

      setSpendingTrend(trend.slice(-12));
    } catch (error) {
      console.error('Error fetching spending trend:', error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-cream/50 rounded-xl p-6">
          <h3 className="font-heading text-lg font-bold text-primary mb-4">Vendor Information</h3>
          <div className="space-y-3">
            {vendor.contact_person && (
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <span className="text-xl">👤</span>
                </div>
                <div>
                  <p className="text-sm text-dark-brown/60">Contact Person</p>
                  <p className="font-semibold text-dark-brown">{vendor.contact_person}</p>
                </div>
              </div>
            )}

            {vendor.phone && (
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Phone className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-dark-brown/60">Phone</p>
                  <p className="font-semibold text-dark-brown">{vendor.phone}</p>
                  {vendor.alternate_phone && (
                    <p className="text-sm text-dark-brown/60">{vendor.alternate_phone}</p>
                  )}
                </div>
              </div>
            )}

            {vendor.email && (
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Mail className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-dark-brown/60">Email</p>
                  <p className="font-semibold text-dark-brown">{vendor.email}</p>
                </div>
              </div>
            )}

            {vendor.address && (
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <MapPin className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-dark-brown/60">Address</p>
                  <p className="font-semibold text-dark-brown">{vendor.address}</p>
                </div>
              </div>
            )}

            {vendor.website && (
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Globe className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-dark-brown/60">Website</p>
                  <a
                    href={vendor.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-semibold text-accent hover:underline"
                  >
                    {vendor.website}
                  </a>
                </div>
              </div>
            )}

            {vendor.gst_number && (
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <CreditCard className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-dark-brown/60">GST Number</p>
                  <p className="font-semibold text-dark-brown">{vendor.gst_number}</p>
                </div>
              </div>
            )}

            {vendor.payment_terms && (
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <span className="text-xl">💳</span>
                </div>
                <div>
                  <p className="text-sm text-dark-brown/60">Payment Terms</p>
                  <p className="font-semibold text-dark-brown">{vendor.payment_terms}</p>
                </div>
              </div>
            )}

            {vendor.certifications && Array.isArray(vendor.certifications) && vendor.certifications.length > 0 && (
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Award className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-dark-brown/60">Certifications</p>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {vendor.certifications.map((cert: string, index: number) => (
                      <span
                        key={index}
                        className="px-2 py-1 bg-sage/20 text-sage text-xs font-semibold rounded-full"
                      >
                        {cert}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-gradient-to-br from-primary to-sage rounded-xl p-6 text-white">
            <h3 className="font-heading text-lg font-bold mb-4">Financial Summary</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-white/80 text-sm mb-1">Total Spent</p>
                <p className="text-2xl font-bold">₹{stats.totalSpent.toFixed(0)}</p>
              </div>
              <div>
                <p className="text-white/80 text-sm mb-1">This Month</p>
                <p className="text-2xl font-bold">₹{stats.thisMonth.toFixed(0)}</p>
              </div>
              <div>
                <p className="text-white/80 text-sm mb-1">This Year</p>
                <p className="text-2xl font-bold">₹{stats.thisYear.toFixed(0)}</p>
              </div>
              <div>
                <p className="text-white/80 text-sm mb-1">Avg Transaction</p>
                <p className="text-2xl font-bold">₹{stats.avgTransaction.toFixed(0)}</p>
              </div>
            </div>
            {stats.pendingPayment > 0 && (
              <div className="mt-4 pt-4 border-t border-white/20">
                <p className="text-white/80 text-sm mb-1">Pending Payment</p>
                <p className="text-3xl font-bold text-soft-red">₹{stats.pendingPayment.toFixed(0)}</p>
              </div>
            )}
          </div>

          <div className="bg-cream/50 rounded-xl p-6">
            <h3 className="font-heading text-lg font-bold text-primary mb-4">Quick Stats</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-dark-brown/70">Total Transactions</span>
                <span className="font-bold text-primary">{stats.totalTransactions}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-dark-brown/70">Category</span>
                <span className="font-bold text-primary">{vendor.category}</span>
              </div>
              {vendor.products && (
                <div className="flex items-start justify-between">
                  <span className="text-dark-brown/70">Products/Services</span>
                  <span className="font-semibold text-primary text-right">{vendor.products}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {spendingTrend.length > 0 && (
        <div className="bg-white rounded-xl border-2 border-dark-brown/5 p-6">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-primary" />
            <h3 className="font-heading text-lg font-bold text-primary">Spending Trend (Last 12 Months)</h3>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={spendingTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis
                dataKey="month"
                stroke="#6B5A4C"
                style={{ fontSize: '12px' }}
              />
              <YAxis
                stroke="#6B5A4C"
                style={{ fontSize: '12px' }}
                tickFormatter={(value) => `₹${value}`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#fff',
                  border: 'none',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                }}
                formatter={(value: any) => [`₹${value.toFixed(0)}`, 'Spending']}
              />
              <Line
                type="monotone"
                dataKey="amount"
                stroke="#8B9A7E"
                strokeWidth={3}
                dot={{ fill: '#8B9A7E', r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
