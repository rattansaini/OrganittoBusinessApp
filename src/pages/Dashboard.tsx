import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Leaf, Receipt, TrendingUp, Scale } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { format } from 'date-fns';
import Header from '../components/Header';
import StatsCard from '../components/StatsCard';
import InvestmentExpenseChart from '../components/InvestmentExpenseChart';
import ExpenseCategoryChart from '../components/ExpenseCategoryChart';
import ActivityFeed from '../components/ActivityFeed';

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalInvestments: 0,
    totalExpenses: 0,
    activeProducts: 0,
  });
  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const currentDate = format(new Date(), 'EEEE, MMMM d, yyyy');

  const monthlyData = [
    { month: 'Jul', investments: 85000, expenses: 52000 },
    { month: 'Aug', investments: 92000, expenses: 61000 },
    { month: 'Sep', investments: 78000, expenses: 48000 },
    { month: 'Oct', investments: 105000, expenses: 72000 },
    { month: 'Nov', investments: 118000, expenses: 68000 },
    { month: 'Dec', investments: 125000, expenses: 75000 },
  ];

  const categoryData = [
    { name: 'Raw Materials', value: 125000 },
    { name: 'Labor', value: 85000 },
    { name: 'Marketing', value: 42000 },
    { name: 'Packaging', value: 38000 },
    { name: 'Utilities', value: 28000 },
    { name: 'Other', value: 22000 },
  ];

  useEffect(() => {
    fetchDashboardData();
  }, [user]);

  const fetchDashboardData = async () => {
    if (!user) return;

    try {
      const [investmentsRes, expensesRes, productsRes, activitiesRes] = await Promise.all([
        supabase
          .from('investments')
          .select('amount')
          .eq('user_id', user.id),
        supabase
          .from('expenses')
          .select('amount')
          .eq('user_id', user.id),
        supabase
          .from('products')
          .select('id, status')
          .eq('user_id', user.id)
          .in('status', ['planning', 'testing', 'production']),
        supabase
          .from('activity_log')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(10),
      ]);

      const totalInvestments = investmentsRes.data?.reduce(
        (sum, item) => sum + parseFloat(item.amount.toString()),
        0
      ) || 0;

      const totalExpenses = expensesRes.data?.reduce(
        (sum, item) => sum + parseFloat(item.amount.toString()),
        0
      ) || 0;

      setStats({
        totalInvestments,
        totalExpenses,
        activeProducts: productsRes.data?.length || 0,
      });

      setActivities(activitiesRes.data || []);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const netBalance = stats.totalInvestments - stats.totalExpenses;
  const netBalanceColor = netBalance >= 0 ? 'text-sage' : 'text-soft-red';

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
          <div className="mb-8">
            <h2 className="font-heading text-4xl md:text-5xl font-bold text-primary mb-2">
              Namaste, {user?.name || 'User'}
            </h2>
            <p className="text-dark-brown/70 text-lg">{currentDate}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatsCard
              title="Total Investments"
              value={`₹${stats.totalInvestments.toLocaleString('en-IN')}`}
              trend={{ value: 12, label: 'this month' }}
              icon={Leaf}
              iconBgColor="bg-primary/20"
              iconColor="text-primary"
              valueColor="text-accent"
            />

            <StatsCard
              title="Total Expenses"
              value={`₹${stats.totalExpenses.toLocaleString('en-IN')}`}
              trend={{ value: -8, label: 'vs last month' }}
              icon={Receipt}
              iconBgColor="bg-secondary/20"
              iconColor="text-secondary"
              valueColor="text-secondary"
            />

            <StatsCard
              title="Net Balance"
              value={`₹${netBalance.toLocaleString('en-IN')}`}
              icon={Scale}
              iconBgColor="bg-sage/20"
              iconColor="text-sage"
              valueColor={netBalanceColor}
            />

            <StatsCard
              title="Active Products"
              value={stats.activeProducts.toString()}
              icon={TrendingUp}
              iconBgColor="bg-accent/20"
              iconColor="text-accent"
              valueColor="text-dark-brown"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <InvestmentExpenseChart data={monthlyData} />
            <ExpenseCategoryChart data={categoryData} />
          </div>

          <ActivityFeed activities={activities} />
        </div>
      </div>
    </div>
  );
}
