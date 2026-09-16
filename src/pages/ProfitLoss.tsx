import { useEffect, useMemo, useState } from 'react';
import { IndianRupee, TrendingUp, TrendingDown, Percent } from 'lucide-react';
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { supabase } from '../lib/supabase';
import { format, parseISO } from 'date-fns';
import StatsCard from '../components/StatsCard';
import { ChartSkeleton } from '../components/LoadingState';

interface SalesRow {
  order_date: string;
  total_amount: number;
}

interface ExpenseRow {
  expense_date: string;
  amount: number;
  category: string;
  status: string;
}

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

const COLORS = ['#2D5016', '#C85A3E', '#D4AF37', '#87A96B', '#3E2723', '#D84315', '#6B8E23', '#8B4513'];

export default function ProfitLoss() {
  const [sales, setSales] = useState<SalesRow[]>([]);
  const [expenses, setExpenses] = useState<ExpenseRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [salesRes, expensesRes] = await Promise.all([
        supabase.from('sales_orders').select('order_date, total_amount'),
        supabase.from('expenses').select('expense_date, amount, category, status').eq('status', 'approved'),
      ]);

      setSales(salesRes.data || []);
      setExpenses(expensesRes.data || []);
    } catch (error) {
      console.error('Error fetching P&L data:', error);
    } finally {
      setLoading(false);
    }
  };

  const totalRevenue = sales.reduce((sum, s) => sum + Number(s.total_amount), 0);
  const totalExpenses = expenses.reduce((sum, e) => sum + Number(e.amount), 0);
  const netProfit = totalRevenue - totalExpenses;
  const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

  const monthlyData = useMemo(() => {
    const buckets: Record<string, { month: string; sortKey: string; revenue: number; expenses: number }> = {};

    sales.forEach((s) => {
      const d = parseISO(s.order_date);
      const key = format(d, 'yyyy-MM');
      const label = format(d, 'MMM yyyy');
      if (!buckets[key]) buckets[key] = { month: label, sortKey: key, revenue: 0, expenses: 0 };
      buckets[key].revenue += Number(s.total_amount);
    });

    expenses.forEach((e) => {
      const d = parseISO(e.expense_date);
      const key = format(d, 'yyyy-MM');
      const label = format(d, 'MMM yyyy');
      if (!buckets[key]) buckets[key] = { month: label, sortKey: key, revenue: 0, expenses: 0 };
      buckets[key].expenses += Number(e.amount);
    });

    return Object.values(buckets)
      .sort((a, b) => a.sortKey.localeCompare(b.sortKey))
      .map((b) => ({ ...b, profit: b.revenue - b.expenses }));
  }, [sales, expenses]);

  const categoryData = useMemo(() => {
    const totals: Record<string, number> = {};
    expenses.forEach((e) => {
      const label = CATEGORY_LABELS[e.category] || e.category;
      totals[label] = (totals[label] || 0) + Number(e.amount);
    });
    return Object.entries(totals)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [expenses]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white/95 backdrop-blur-sm p-4 rounded-xl shadow-soft-lg border-2 border-primary/10">
          <p className="font-semibold text-dark-brown mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: ₹{Number(entry.value).toLocaleString('en-IN')}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <h2 className="font-heading text-4xl md:text-5xl font-bold text-primary mb-2">
          Profit &amp; Loss
        </h2>
        <p className="text-dark-brown/70 text-lg">Shopify sales vs. approved expenses, all time</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatsCard
          title="Total Revenue"
          value={`₹${totalRevenue.toLocaleString('en-IN')}`}
          icon={IndianRupee}
          iconBgColor="bg-primary/20"
          iconColor="text-primary"
          valueColor="text-primary"
        />
        <StatsCard
          title="Total Expenses"
          value={`₹${totalExpenses.toLocaleString('en-IN')}`}
          icon={TrendingDown}
          iconBgColor="bg-secondary/20"
          iconColor="text-secondary"
          valueColor="text-secondary"
        />
        <StatsCard
          title="Net Profit"
          value={`₹${netProfit.toLocaleString('en-IN')}`}
          icon={TrendingUp}
          iconBgColor="bg-sage/20"
          iconColor="text-sage"
          valueColor={netProfit >= 0 ? 'text-sage' : 'text-soft-red'}
        />
        <StatsCard
          title="Profit Margin"
          value={`${profitMargin.toFixed(1)}%`}
          icon={Percent}
          iconBgColor="bg-accent/20"
          iconColor="text-accent"
          valueColor={profitMargin >= 0 ? 'text-sage' : 'text-soft-red'}
        />
      </div>

      <div className="bg-panel border border-edge rounded-2xl shadow-e1 p-6 mb-8">
        <h3 className="font-heading text-2xl font-bold text-primary mb-6">Monthly Revenue vs Expenses</h3>
        {loading ? (
          <ChartSkeleton height={320} />
        ) : monthlyData.length === 0 ? (
          <div className="py-12 text-center text-dark-brown/60">
            No sales or approved expenses recorded yet.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={320}>
            <ComposedChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2D5016" opacity={0.1} />
              <XAxis dataKey="month" stroke="#3E2723" style={{ fontSize: '12px' }} />
              <YAxis
                stroke="#3E2723"
                style={{ fontSize: '12px' }}
                tickFormatter={(value) => `₹${(value / 1000).toFixed(0)}k`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ paddingTop: '16px', fontSize: '14px' }} />
              <Bar dataKey="revenue" fill="#2D5016" name="Revenue" radius={[6, 6, 0, 0]} />
              <Bar dataKey="expenses" fill="#C85A3E" name="Expenses" radius={[6, 6, 0, 0]} />
              <Line
                type="monotone"
                dataKey="profit"
                stroke="#D4AF37"
                strokeWidth={3}
                dot={{ fill: '#D4AF37', r: 5 }}
                name="Net Profit"
              />
            </ComposedChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-panel border border-edge rounded-2xl shadow-e1 p-6">
          <h3 className="font-heading text-2xl font-bold text-primary mb-6">Expenses by Category</h3>
          {categoryData.length === 0 ? (
            <div className="py-12 text-center text-dark-brown/60">No approved expenses yet.</div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={100}
                  dataKey="value"
                  label={(entry) => entry.name}
                >
                  {categoryData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  content={({ active, payload }: any) =>
                    active && payload && payload.length ? (
                      <div className="bg-white/95 backdrop-blur-sm p-4 rounded-xl shadow-soft-lg border-2 border-primary/10">
                        <p className="font-semibold text-dark-brown mb-1">{payload[0].name}</p>
                        <p className="text-sm text-dark-brown/70">
                          ₹{Number(payload[0].value).toLocaleString('en-IN')}
                        </p>
                      </div>
                    ) : null
                  }
                />
                <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: '13px' }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="bg-panel border border-edge rounded-2xl shadow-e1 p-6 overflow-hidden">
          <h3 className="font-heading text-2xl font-bold text-primary mb-6">Month-by-Month Breakdown</h3>
          {monthlyData.length === 0 ? (
            <div className="py-12 text-center text-dark-brown/60">No data yet.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b-2 border-primary/10 text-left">
                    <th className="px-3 py-3 text-body font-normal text-dark-brown/70">Month</th>
                    <th className="px-3 py-3 text-sm font-semibold text-dark-brown/70 text-right">Revenue</th>
                    <th className="px-3 py-3 text-sm font-semibold text-dark-brown/70 text-right">Expenses</th>
                    <th className="px-3 py-3 text-sm font-semibold text-dark-brown/70 text-right">Profit</th>
                  </tr>
                </thead>
                <tbody>
                  {monthlyData.map((row) => (
                    <tr key={row.sortKey} className="border-b border-primary/5">
                      <td className="px-3 py-3 font-medium text-dark-brown">{row.month}</td>
                      <td className="px-3 py-3 text-right text-primary">
                        ₹{row.revenue.toLocaleString('en-IN')}
                      </td>
                      <td className="px-3 py-3 text-right text-secondary">
                        ₹{row.expenses.toLocaleString('en-IN')}
                      </td>
                      <td
                        className={`px-3 py-3 text-right font-semibold ${
                          row.profit >= 0 ? 'text-sage' : 'text-soft-red'
                        }`}
                      >
                        ₹{row.profit.toLocaleString('en-IN')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <p className="text-sm text-dark-brown/50">
        Revenue is pulled from synced Shopify sales orders. Expenses are counted only once their status is
        "Approved" in the Finance → Expense List page.
      </p>
    </div>
  );
}
