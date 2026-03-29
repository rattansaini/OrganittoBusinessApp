import { useState } from 'react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { TrendingUp, TrendingDown, ChevronRight } from 'lucide-react';
import { format, subMonths } from 'date-fns';

interface CategoryAnalysisTabProps {
  expenses: any[];
}

const COLORS = ['#C17817', '#2D5016', '#B8860B', '#8B4513', '#D4AF37', '#CD853F', '#DAA520', '#A0522D'];

export default function CategoryAnalysisTab({ expenses }: CategoryAnalysisTabProps) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState('all');

  const approvedExpenses = expenses.filter(e => e.status === 'approved');

  const filterByDateRange = (expenses: any[]) => {
    if (dateRange === 'all') return expenses;

    const months = parseInt(dateRange);
    const cutoffDate = subMonths(new Date(), months);

    return expenses.filter(e => new Date(e.expense_date) >= cutoffDate);
  };

  const filteredExpenses = filterByDateRange(approvedExpenses);

  const categoryData = filteredExpenses.reduce((acc, exp) => {
    const cat = exp.category;
    if (!acc[cat]) {
      acc[cat] = {
        category: cat,
        total: 0,
        count: 0,
        expenses: [],
      };
    }
    acc[cat].total += exp.amount;
    acc[cat].count += 1;
    acc[cat].expenses.push(exp);
    return acc;
  }, {} as Record<string, { category: string; total: number; count: number; expenses: any[] }>);

  const categoryArray = Object.values(categoryData).sort((a, b) => b.total - a.total);
  const totalExpenses = categoryArray.reduce((sum, cat) => sum + cat.total, 0);

  const pieData = categoryArray.map(cat => ({
    name: cat.category,
    value: cat.total,
  }));

  const barData = categoryArray.map(cat => ({
    category: cat.category,
    amount: cat.total,
  }));

  const getCategoryIcon = (category: string) => {
    const icons: Record<string, string> = {
      'Raw Materials': '🌿',
      'Packaging': '📦',
      'Equipment': '🔧',
      'Marketing': '📢',
      'Operational': '⚙️',
      'Travel': '✈️',
      'Utilities': '💡',
      'Miscellaneous': '📊',
    };
    return icons[category] || '💰';
  };

  const getSparklineData = (category: string) => {
    const monthlyData: Record<string, number> = {};

    for (let i = 5; i >= 0; i--) {
      const date = subMonths(new Date(), i);
      const monthKey = format(date, 'MMM');
      monthlyData[monthKey] = 0;
    }

    const catExpenses = approvedExpenses.filter(e => e.category === category);
    catExpenses.forEach(exp => {
      const monthKey = format(new Date(exp.expense_date), 'MMM');
      if (monthlyData[monthKey] !== undefined) {
        monthlyData[monthKey] += exp.amount;
      }
    });

    return Object.entries(monthlyData).map(([month, value]) => ({
      month,
      value,
    }));
  };

  const getTrend = (category: string) => {
    const thisMonth = new Date().getMonth();
    const lastMonth = new Date(new Date().setMonth(thisMonth - 1)).getMonth();

    const thisMonthTotal = approvedExpenses
      .filter(e => e.category === category && new Date(e.expense_date).getMonth() === thisMonth)
      .reduce((sum, e) => sum + e.amount, 0);

    const lastMonthTotal = approvedExpenses
      .filter(e => e.category === category && new Date(e.expense_date).getMonth() === lastMonth)
      .reduce((sum, e) => sum + e.amount, 0);

    if (lastMonthTotal === 0) return { direction: 'neutral', percent: 0 };

    const percent = ((thisMonthTotal - lastMonthTotal) / lastMonthTotal) * 100;
    return {
      direction: percent > 0 ? 'up' : percent < 0 ? 'down' : 'neutral',
      percent: Math.abs(percent),
    };
  };

  const selectedCategoryData = selectedCategory ? categoryData[selectedCategory] : null;

  return (
    <div className="space-y-6">
      <div className="flex gap-4 items-center mb-6">
        <select
          value={dateRange}
          onChange={(e) => setDateRange(e.target.value)}
          className="px-4 py-2 border-2 border-dark-brown/10 rounded-xl focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
        >
          <option value="all">All Time</option>
          <option value="1">Last Month</option>
          <option value="3">Last 3 Months</option>
          <option value="6">Last 6 Months</option>
          <option value="12">Last Year</option>
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {categoryArray.map((cat, index) => {
          const percentage = totalExpenses > 0 ? (cat.total / totalExpenses) * 100 : 0;
          const avgTransaction = cat.count > 0 ? cat.total / cat.count : 0;
          const trend = getTrend(cat.category);
          const sparklineData = getSparklineData(cat.category);

          return (
            <div
              key={cat.category}
              onClick={() => setSelectedCategory(cat.category)}
              className={`bg-gradient-to-br from-white to-cream rounded-xl p-6 border-2 shadow-soft cursor-pointer transition-all duration-300 hover:shadow-soft-lg hover:scale-[1.02] ${
                selectedCategory === cat.category
                  ? 'border-accent ring-2 ring-accent/20'
                  : 'border-dark-brown/10'
              }`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <span className="text-4xl">{getCategoryIcon(cat.category)}</span>
                  <div>
                    <h4 className="font-heading text-lg font-bold text-primary">
                      {cat.category}
                    </h4>
                    <p className="text-xs text-dark-brown/60">{cat.count} transactions</p>
                  </div>
                </div>
                <div className="text-right">
                  {trend.direction === 'up' && (
                    <div className="flex items-center gap-1 text-soft-red text-xs">
                      <TrendingUp className="w-3 h-3" />
                      {trend.percent.toFixed(0)}%
                    </div>
                  )}
                  {trend.direction === 'down' && (
                    <div className="flex items-center gap-1 text-sage text-xs">
                      <TrendingDown className="w-3 h-3" />
                      {trend.percent.toFixed(0)}%
                    </div>
                  )}
                </div>
              </div>

              <div className="mb-3">
                <p className="text-3xl font-bold text-secondary mb-1">
                  ₹{cat.total.toLocaleString('en-IN')}
                </p>
                <p className="text-sm text-dark-brown/60">
                  {percentage.toFixed(1)}% of total expenses
                </p>
              </div>

              <div className="mb-3">
                <p className="text-xs text-dark-brown/60 mb-1">Average per transaction</p>
                <p className="text-lg font-semibold text-accent">
                  ₹{avgTransaction.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                </p>
              </div>

              <div className="h-16">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={sparklineData}>
                    <Line
                      type="monotone"
                      dataKey="value"
                      stroke={COLORS[index % COLORS.length]}
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-soft p-6">
          <h3 className="font-heading text-2xl font-bold text-primary mb-4">
            Category Distribution
          </h3>
          {pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={350}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                  outerRadius={120}
                  fill="#8884d8"
                  dataKey="value"
                  onClick={(data) => setSelectedCategory(data.name)}
                >
                  {pieData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                      className="cursor-pointer hover:opacity-80 transition-opacity"
                    />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: number) => `₹${value.toLocaleString('en-IN')}`}
                  contentStyle={{ backgroundColor: '#FFF8E7', border: '2px solid #2D5016' }}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[350px] flex items-center justify-center text-dark-brown/50">
              No expense data available
            </div>
          )}
        </div>

        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-soft p-6">
          <h3 className="font-heading text-2xl font-bold text-primary mb-4">
            Category Comparison
          </h3>
          {barData.length > 0 ? (
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={barData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#2D5016" opacity={0.1} />
                <XAxis type="number" tick={{ fontSize: 12, fill: '#2D5016' }} />
                <YAxis dataKey="category" type="category" width={120} tick={{ fontSize: 11, fill: '#2D5016' }} />
                <Tooltip
                  formatter={(value: number) => `₹${value.toLocaleString('en-IN')}`}
                  contentStyle={{ backgroundColor: '#FFF8E7', border: '2px solid #2D5016' }}
                />
                <Bar
                  dataKey="amount"
                  fill="#C17817"
                  radius={[0, 8, 8, 0]}
                  onClick={(data) => setSelectedCategory(data.category)}
                  className="cursor-pointer"
                />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[350px] flex items-center justify-center text-dark-brown/50">
              No expense data available
            </div>
          )}
        </div>
      </div>

      {selectedCategoryData && (
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-soft p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-heading text-2xl font-bold text-primary flex items-center gap-3">
              <span className="text-3xl">{getCategoryIcon(selectedCategoryData.category)}</span>
              {selectedCategoryData.category} Details
            </h3>
            <button
              onClick={() => setSelectedCategory(null)}
              className="px-4 py-2 text-sm font-semibold text-dark-brown hover:bg-dark-brown/5 rounded-lg transition-colors"
            >
              Clear Selection
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-cream/50 border-b-2 border-accent/10">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-dark-brown">Date</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-dark-brown">Subcategory</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-dark-brown">Amount</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-dark-brown">Paid By</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-dark-brown">Vendor</th>
                </tr>
              </thead>
              <tbody>
                {selectedCategoryData.expenses
                  .sort((a, b) => new Date(b.expense_date).getTime() - new Date(a.expense_date).getTime())
                  .map((exp, index) => (
                    <tr
                      key={exp.id}
                      className={`border-b border-dark-brown/5 ${
                        index % 2 === 0 ? 'bg-white' : 'bg-cream/20'
                      }`}
                    >
                      <td className="px-4 py-3 text-sm text-dark-brown">
                        {format(new Date(exp.expense_date), 'MMM d, yyyy')}
                      </td>
                      <td className="px-4 py-3 text-sm text-dark-brown">
                        {exp.subcategory || '-'}
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-lg font-bold text-secondary">
                          ₹{exp.amount.toLocaleString('en-IN')}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-dark-brown">
                        {exp.users_paid_by?.name || exp.users?.name || 'Unknown'}
                      </td>
                      <td className="px-4 py-3 text-sm text-dark-brown">
                        {exp.vendors?.name || '-'}
                      </td>
                    </tr>
                  ))}
              </tbody>
              <tfoot className="bg-accent/10 border-t-2 border-accent/30">
                <tr>
                  <td colSpan={2} className="px-4 py-3 text-right font-bold text-dark-brown">
                    Subtotal:
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-2xl font-bold text-accent">
                      ₹{selectedCategoryData.total.toLocaleString('en-IN')}
                    </span>
                  </td>
                  <td colSpan={2}></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
