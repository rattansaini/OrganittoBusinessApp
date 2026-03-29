import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, ComposedChart } from 'recharts';
import { TrendingUp, TrendingDown, AlertCircle, Clock, CreditCard, Tag, Users, CheckCircle } from 'lucide-react';
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns';

interface OverviewTabProps {
  expenses: any[];
  investments: any[];
  vendors: any[];
}

export default function OverviewTab({ expenses, investments, vendors }: OverviewTabProps) {
  const approvedExpenses = expenses.filter(e => e.status === 'approved');
  const approvedInvestments = investments.filter(i => i.status === 'approved');

  const totalExpenses = approvedExpenses.reduce((sum, e) => sum + e.amount, 0);
  const totalInvestments = approvedInvestments.reduce((sum, i) => sum + i.amount, 0);
  const netBalance = totalInvestments - totalExpenses;
  const balancePercentage = totalInvestments > 0 ? ((netBalance / totalInvestments) * 100) : 0;

  const monthlyData: Record<string, { month: string; investments: number; expenses: number; net: number }> = {};

  for (let i = 11; i >= 0; i--) {
    const date = subMonths(new Date(), i);
    const monthKey = format(date, 'yyyy-MM');
    const monthLabel = format(date, 'MMM yyyy');
    monthlyData[monthKey] = { month: monthLabel, investments: 0, expenses: 0, net: 0 };
  }

  approvedInvestments.forEach(inv => {
    const monthKey = format(new Date(inv.investment_date), 'yyyy-MM');
    if (monthlyData[monthKey]) {
      monthlyData[monthKey].investments += inv.amount;
    }
  });

  approvedExpenses.forEach(exp => {
    const monthKey = format(new Date(exp.expense_date), 'yyyy-MM');
    if (monthlyData[monthKey]) {
      monthlyData[monthKey].expenses += exp.amount;
    }
  });

  const chartData = Object.values(monthlyData).map(data => ({
    ...data,
    net: data.investments - data.expenses,
  }));

  const avgMonthlyExpense = approvedExpenses.length > 0
    ? totalExpenses / Object.keys(monthlyData).length
    : 0;

  const categoryTotals = approvedExpenses.reduce((acc, exp) => {
    if (!acc[exp.category]) {
      acc[exp.category] = 0;
    }
    acc[exp.category] += exp.amount;
    return acc;
  }, {} as Record<string, number>);

  const topCategory = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1])[0];

  const partnerExpenses = approvedExpenses.reduce((acc, exp) => {
    const partnerId = exp.paid_by || exp.user_id;
    if (!acc[partnerId]) {
      acc[partnerId] = { name: exp.users_paid_by?.name || exp.users?.name || 'Unknown', total: 0 };
    }
    acc[partnerId].total += exp.amount;
    return acc;
  }, {} as Record<string, { name: string; total: number }>);

  const topPartner = Object.values(partnerExpenses).sort((a, b) => b.total - a.total)[0];

  const avgExpenseAmount = approvedExpenses.length > 0 ? totalExpenses / approvedExpenses.length : 0;
  const pendingCount = expenses.filter(e => e.status === 'pending').length;

  const paymentModes = approvedExpenses.reduce((acc, exp) => {
    const mode = exp.payment_mode || 'unknown';
    acc[mode] = (acc[mode] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const topPaymentMode = Object.entries(paymentModes).sort((a, b) => b[1] - a[1])[0];

  const highestMonth = chartData.reduce((max, data) =>
    data.expenses > max.expenses ? data : max
  , chartData[0] || { month: 'N/A', expenses: 0 });

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

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-sage/20 to-sage/10 rounded-xl p-6 border-2 border-sage/30 shadow-soft">
          <div className="flex items-center justify-between mb-3">
            <div className="w-12 h-12 bg-sage/30 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-sage" />
            </div>
            <span className="text-xs font-semibold text-sage uppercase tracking-wide">Investments</span>
          </div>
          <p className="text-3xl font-bold text-sage mb-1">
            ₹{totalInvestments.toLocaleString('en-IN')}
          </p>
          <p className="text-sm text-dark-brown/60">Total Invested</p>
        </div>

        <div className="bg-gradient-to-br from-secondary/20 to-secondary/10 rounded-xl p-6 border-2 border-secondary/30 shadow-soft">
          <div className="flex items-center justify-between mb-3">
            <div className="w-12 h-12 bg-secondary/30 rounded-lg flex items-center justify-center">
              <TrendingDown className="w-6 h-6 text-secondary" />
            </div>
            <span className="text-xs font-semibold text-secondary uppercase tracking-wide">Expenses</span>
          </div>
          <p className="text-3xl font-bold text-secondary mb-1">
            ₹{totalExpenses.toLocaleString('en-IN')}
          </p>
          <p className="text-sm text-dark-brown/60">Total Spent</p>
        </div>

        <div className={`bg-gradient-to-br rounded-xl p-6 border-2 shadow-soft ${
          netBalance >= 0
            ? 'from-accent/20 to-accent/10 border-accent/30'
            : 'from-soft-red/20 to-soft-red/10 border-soft-red/30'
        }`}>
          <div className="flex items-center justify-between mb-3">
            <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
              netBalance >= 0 ? 'bg-accent/30' : 'bg-soft-red/30'
            }`}>
              {netBalance >= 0 ? (
                <TrendingUp className="w-6 h-6 text-accent" />
              ) : (
                <TrendingDown className="w-6 h-6 text-soft-red" />
              )}
            </div>
            <span className={`text-xs font-semibold uppercase tracking-wide ${
              netBalance >= 0 ? 'text-accent' : 'text-soft-red'
            }`}>Net Balance</span>
          </div>
          <p className={`text-3xl font-bold mb-1 ${netBalance >= 0 ? 'text-accent' : 'text-soft-red'}`}>
            ₹{Math.abs(netBalance).toLocaleString('en-IN')}
          </p>
          <p className="text-sm text-dark-brown/60">
            {balancePercentage.toFixed(1)}% margin
          </p>
        </div>

        <div className="bg-gradient-to-br from-primary/20 to-primary/10 rounded-xl p-6 border-2 border-primary/30 shadow-soft">
          <div className="flex items-center justify-between mb-3">
            <div className="w-12 h-12 bg-primary/30 rounded-lg flex items-center justify-center">
              <AlertCircle className="w-6 h-6 text-primary" />
            </div>
            <span className="text-xs font-semibold text-primary uppercase tracking-wide">Burn Rate</span>
          </div>
          <p className="text-3xl font-bold text-primary mb-1">
            ₹{avgMonthlyExpense.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
          </p>
          <p className="text-sm text-dark-brown/60">Per Month Avg</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 border-2 border-dark-brown/10 shadow-soft">
          <div className="flex items-center gap-3 mb-3">
            <span className="text-3xl">{topCategory ? getCategoryIcon(topCategory[0]) : '📊'}</span>
            <Tag className="w-5 h-5 text-accent" />
          </div>
          <p className="text-sm text-dark-brown/60 mb-1">Top Category</p>
          <p className="text-xl font-bold text-primary mb-1">
            {topCategory ? topCategory[0] : 'N/A'}
          </p>
          <p className="text-lg font-semibold text-secondary">
            ₹{topCategory ? topCategory[1].toLocaleString('en-IN') : '0'}
          </p>
        </div>

        <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 border-2 border-dark-brown/10 shadow-soft">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-gradient-to-br from-accent to-secondary rounded-full flex items-center justify-center text-white font-bold">
              {topPartner ? topPartner.name.charAt(0) : '?'}
            </div>
            <Users className="w-5 h-5 text-accent" />
          </div>
          <p className="text-sm text-dark-brown/60 mb-1">Top Spender</p>
          <p className="text-xl font-bold text-primary mb-1 truncate">
            {topPartner ? topPartner.name : 'N/A'}
          </p>
          <p className="text-lg font-semibold text-secondary">
            ₹{topPartner ? topPartner.total.toLocaleString('en-IN') : '0'}
          </p>
        </div>

        <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 border-2 border-dark-brown/10 shadow-soft">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-accent/20 rounded-lg flex items-center justify-center">
              <CreditCard className="w-5 h-5 text-accent" />
            </div>
          </div>
          <p className="text-sm text-dark-brown/60 mb-1">Avg Expense</p>
          <p className="text-2xl font-bold text-primary">
            ₹{avgExpenseAmount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
          </p>
        </div>

        <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 border-2 border-dark-brown/10 shadow-soft">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-accent/20 rounded-lg flex items-center justify-center">
              <Clock className="w-5 h-5 text-accent" />
            </div>
          </div>
          <p className="text-sm text-dark-brown/60 mb-1">Pending Approvals</p>
          <p className="text-2xl font-bold text-accent">{pendingCount}</p>
        </div>
      </div>

      <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-soft p-6">
        <h3 className="font-heading text-2xl font-bold text-primary mb-4">
          Investment vs Expense Trend (12 Months)
        </h3>
        <ResponsiveContainer width="100%" height={400}>
          <ComposedChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#2D5016" opacity={0.1} />
            <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#2D5016' }} />
            <YAxis tick={{ fontSize: 12, fill: '#2D5016' }} />
            <Tooltip
              formatter={(value: number) => `₹${value.toLocaleString('en-IN')}`}
              contentStyle={{ backgroundColor: '#FFF8E7', border: '2px solid #2D5016' }}
            />
            <Legend />
            <Area
              type="monotone"
              dataKey="net"
              fill="#B8860B"
              fillOpacity={0.1}
              stroke="none"
              name="Net Balance"
            />
            <Line
              type="monotone"
              dataKey="investments"
              stroke="#2D5016"
              strokeWidth={3}
              name="Investments"
              dot={{ fill: '#2D5016', r: 5 }}
            />
            <Line
              type="monotone"
              dataKey="expenses"
              stroke="#C17817"
              strokeWidth={3}
              name="Expenses"
              dot={{ fill: '#C17817', r: 5 }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-cream to-white rounded-xl p-6 border-2 border-accent/20 shadow-soft">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 bg-accent/20 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-accent" />
            </div>
            <span className="text-sm font-semibold text-accent">Quick Insight</span>
          </div>
          <p className="text-dark-brown/70 mb-2">
            <span className="font-semibold text-primary">Highest spending month:</span>
          </p>
          <p className="text-lg font-bold text-secondary">
            {highestMonth.month}
          </p>
          <p className="text-xl font-bold text-accent">
            ₹{highestMonth.expenses.toLocaleString('en-IN')}
          </p>
        </div>

        <div className="bg-gradient-to-br from-cream to-white rounded-xl p-6 border-2 border-sage/20 shadow-soft">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 bg-sage/20 rounded-lg flex items-center justify-center">
              <CreditCard className="w-6 h-6 text-sage" />
            </div>
            <span className="text-sm font-semibold text-sage">Payment Mode</span>
          </div>
          <p className="text-dark-brown/70 mb-2">
            <span className="font-semibold text-primary">Most used:</span>
          </p>
          <p className="text-xl font-bold text-secondary uppercase">
            {topPaymentMode ? topPaymentMode[0] : 'N/A'}
          </p>
          <p className="text-sm text-dark-brown/60">
            {topPaymentMode ? topPaymentMode[1] : 0} transactions
          </p>
        </div>

        <div className="bg-gradient-to-br from-cream to-white rounded-xl p-6 border-2 border-primary/20 shadow-soft">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 bg-primary/20 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-primary" />
            </div>
            <span className="text-sm font-semibold text-primary">Efficiency</span>
          </div>
          <p className="text-dark-brown/70 mb-2">
            <span className="font-semibold text-primary">Approval rate:</span>
          </p>
          <p className="text-3xl font-bold text-sage">
            {expenses.length > 0
              ? ((approvedExpenses.length / expenses.length) * 100).toFixed(0)
              : 0}%
          </p>
        </div>
      </div>
    </div>
  );
}
