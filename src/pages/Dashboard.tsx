import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Leaf, Receipt, TrendingUp, Scale, ShoppingBag, LineChart } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { format, subMonths, startOfMonth } from 'date-fns';
import Header from '../components/Header';
import StatsCard from '../components/StatsCard';
import InvestmentExpenseChart from '../components/InvestmentExpenseChart';
import ExpenseCategoryChart from '../components/ExpenseCategoryChart';
import ActivityFeed from '../components/ActivityFeed';

const CATEGORY_LABELS: Record<string, string> = {
  raw_materials: 'Raw Materials',
  packaging: 'Packaging',
  printing: 'Printing',
  shipping: 'Shipping & Logistics',
  marketing: 'Marketing & Advertising',
  lab_testing: 'Lab Testing',
  licenses: 'Licenses & Compliance',
  utilities: 'Utilities',
  rent: 'Rent & Infrastructure',
  salaries: 'Salaries & Wages',
  equipment: 'Equipment & Machinery',
  other: 'Other',
};

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalInvestments: 0,
    totalExpenses: 0,
    activeProducts: 0,
    totalSales: 0,
    totalOrders: 0,
  });
  const [activities, setActivities] = useState<any[]>([]);
  const [monthlyData, setMonthlyData] = useState<{ month: string; investments: number; expenses: number }[]>([]);
  const [categoryData, setCategoryData] = useState<{ name: string; value: number }[]>([]);
  const [loading, setLoading] = useState(true);

  const currentDate = format(new Date(), 'EEEE, MMMM d, yyyy');

  useEffect(() => {
    fetchDashboardData();
  }, [user]);

  const fetchDashboardData = async () => {
    if (!user) return;

    try {
      const sixMonthsAgo = startOfMonth(subMonths(new Date(), 5)).toISOString().split('T')[0];

      const [investmentsRes, expensesRes, productsRes, activitiesRes, salesRes] = await Promise.all([
        supabase
          .from('investments')
          .select('amount, investment_date, status')
          .eq('status', 'approved'),
        supabase
          .from('expenses')
          .select('amount, expense_date, category, status')
          .eq('status', 'approved'),
        supabase
          .from('products')
          .select('id, status')
          .in('status', ['planning', 'testing', 'production']),
        supabase
          .from('activity_log')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(15),
        supabase
          .from('sales_orders')
          .select('total_amount'),
      ]);

      if (investmentsRes.error) throw investmentsRes.error;
      if (expensesRes.error) throw expensesRes.error;
      if (productsRes.error) throw productsRes.error;
      if (activitiesRes.error) throw activitiesRes.error;
      if (salesRes.error) throw salesRes.error;

      const investments = investmentsRes.data || [];
      const expenses = expensesRes.data || [];

      const totalInvestments = investments.reduce(
        (sum, item) => sum + parseFloat(item.amount.toString()),
        0
      );

      const totalExpenses = expenses.reduce(
        (sum, item) => sum + parseFloat(item.amount.toString()),
        0
      );

      const totalSales = salesRes.data?.reduce(
        (sum, item) => sum + parseFloat(item.total_amount.toString()),
        0
      ) || 0;

      setStats({
        totalInvestments,
        totalExpenses,
        activeProducts: productsRes.data?.length || 0,
        totalSales,
        totalOrders: salesRes.data?.length || 0,
      });

      setActivities(activitiesRes.data || []);

      const months: { key: string; label: string; investments: number; expenses: number }[] = [];
      for (let i = 5; i >= 0; i--) {
        const d = subMonths(new Date(), i);
        months.push({
          key: format(d, 'yyyy-MM'),
          label: format(d, 'MMM'),
          investments: 0,
          expenses: 0,
        });
      }
      const monthMap = new Map(months.map(m => [m.key, m]));

      investments
        .filter(inv => inv.investment_date >= sixMonthsAgo)
        .forEach(inv => {
          const key = inv.investment_date.slice(0, 7);
          const bucket = monthMap.get(key);
          if (bucket) bucket.investments += parseFloat(inv.amount.toString());
        });

      expenses
        .filter(exp => exp.expense_date >= sixMonthsAgo)
        .forEach(exp => {
          const key = exp.expense_date.slice(0, 7);
          const bucket = monthMap.get(key);
          if (bucket) bucket.expenses += parseFloat(exp.amount.toString());
        });

      setMonthlyData(months.map(m => ({ month: m.label, investments: m.investments, expenses: m.expenses })));

      const categoryTotals: Record<string, number> = {};
      expenses.forEach(exp => {
        const label = CATEGORY_LABELS[exp.category] || exp.category;
        categoryTotals[label] = (categoryTotals[label] || 0) + parseFloat(exp.amount.toString());
      });
      setCategoryData(
        Object.entries(categoryTotals)
          .map(([name, value]) => ({ name, value }))
          .sort((a, b) => b.value - a.value)
      );
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const netBalance = stats.totalInvestments - stats.totalExpenses;
  const netBalanceColor = netBalance >= 0 ? 'text-sage' : 'text-soft-red';

  const netProfit = stats.totalSales - stats.totalExpenses;
  const netProfitColor = netProfit >= 0 ? 'text-sage' : 'text-soft-red';

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
              icon={Leaf}
              iconBgColor="bg-primary/20"
              iconColor="text-primary"
              valueColor="text-accent"
            />

            <StatsCard
              title="Total Expenses"
              value={`₹${stats.totalExpenses.toLocaleString('en-IN')}`}
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

            <StatsCard
              title="Total Sales (Shopify)"
              value={`₹${stats.totalSales.toLocaleString('en-IN')}`}
              trend={{ value: stats.totalOrders, label: 'orders synced' }}
              icon={ShoppingBag}
              iconBgColor="bg-primary/20"
              iconColor="text-primary"
              valueColor="text-primary"
            />

            <StatsCard
              title="Net Profit (Sales − Expenses)"
              value={`₹${netProfit.toLocaleString('en-IN')}`}
              icon={LineChart}
              iconBgColor="bg-sage/20"
              iconColor="text-sage"
              valueColor={netProfitColor}
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
