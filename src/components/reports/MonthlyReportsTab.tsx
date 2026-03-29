import { useState } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, subMonths } from 'date-fns';
import { Download, FileText, Mail, TrendingUp, TrendingDown } from 'lucide-react';

interface MonthlyReportsTabProps {
  expenses: any[];
  investments: any[];
}

export default function MonthlyReportsTab({ expenses, investments }: MonthlyReportsTabProps) {
  const [selectedMonth, setSelectedMonth] = useState(format(new Date(), 'yyyy-MM'));
  const [compareWithLast, setCompareWithLast] = useState(true);

  const monthDate = new Date(selectedMonth + '-01');
  const monthStart = startOfMonth(monthDate);
  const monthEnd = endOfMonth(monthDate);

  const lastMonthDate = subMonths(monthDate, 1);
  const lastMonthStart = startOfMonth(lastMonthDate);
  const lastMonthEnd = endOfMonth(lastMonthDate);

  const monthExpenses = expenses.filter(e => {
    const expDate = new Date(e.expense_date);
    return expDate >= monthStart && expDate <= monthEnd && e.status === 'approved';
  });

  const monthInvestments = investments.filter(i => {
    const invDate = new Date(i.investment_date);
    return invDate >= monthStart && invDate <= monthEnd && i.status === 'approved';
  });

  const lastMonthExpenses = expenses.filter(e => {
    const expDate = new Date(e.expense_date);
    return expDate >= lastMonthStart && expDate <= lastMonthEnd && e.status === 'approved';
  });

  const lastMonthInvestments = investments.filter(i => {
    const invDate = new Date(i.investment_date);
    return invDate >= lastMonthStart && invDate <= lastMonthEnd && i.status === 'approved';
  });

  const totalExpenses = monthExpenses.reduce((sum, e) => sum + e.amount, 0);
  const totalInvestments = monthInvestments.reduce((sum, i) => sum + i.amount, 0);
  const netChange = totalInvestments - totalExpenses;

  const lastMonthTotalExpenses = lastMonthExpenses.reduce((sum, e) => sum + e.amount, 0);
  const lastMonthTotalInvestments = lastMonthInvestments.reduce((sum, i) => sum + i.amount, 0);
  const lastMonthNetChange = lastMonthTotalInvestments - lastMonthTotalExpenses;

  const expenseChange = lastMonthTotalExpenses > 0
    ? ((totalExpenses - lastMonthTotalExpenses) / lastMonthTotalExpenses) * 100
    : 0;

  const investmentChange = lastMonthTotalInvestments > 0
    ? ((totalInvestments - lastMonthTotalInvestments) / lastMonthTotalInvestments) * 100
    : 0;

  const netChangePercent = lastMonthNetChange !== 0
    ? ((netChange - lastMonthNetChange) / Math.abs(lastMonthNetChange)) * 100
    : 0;

  const categoryBreakdown = monthExpenses.reduce((acc, exp) => {
    if (!acc[exp.category]) {
      acc[exp.category] = { thisMonth: 0, lastMonth: 0 };
    }
    acc[exp.category].thisMonth += exp.amount;
    return acc;
  }, {} as Record<string, { thisMonth: number; lastMonth: number }>);

  lastMonthExpenses.forEach(exp => {
    if (!categoryBreakdown[exp.category]) {
      categoryBreakdown[exp.category] = { thisMonth: 0, lastMonth: 0 };
    }
    categoryBreakdown[exp.category].lastMonth += exp.amount;
  });

  const categoryArray = Object.entries(categoryBreakdown).map(([category, data]) => {
    const change = data.lastMonth > 0
      ? ((data.thisMonth - data.lastMonth) / data.lastMonth) * 100
      : 0;
    return {
      category,
      thisMonth: data.thisMonth,
      lastMonth: data.lastMonth,
      change,
      changeAmount: data.thisMonth - data.lastMonth,
    };
  }).sort((a, b) => b.thisMonth - a.thisMonth);

  const allDays = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const dailyData = allDays.map(day => {
    const dayExpenses = monthExpenses.filter(e => isSameDay(new Date(e.expense_date), day));
    const dayInvestments = monthInvestments.filter(i => isSameDay(new Date(i.investment_date), day));

    const expenseTotal = dayExpenses.reduce((sum, e) => sum + e.amount, 0);
    const investmentTotal = dayInvestments.reduce((sum, i) => sum + i.amount, 0);

    return {
      date: day,
      expenses: dayExpenses,
      investments: dayInvestments,
      expenseTotal,
      investmentTotal,
    };
  });

  const monthOptions = [];
  for (let i = 0; i < 12; i++) {
    const date = subMonths(new Date(), i);
    monthOptions.push({
      value: format(date, 'yyyy-MM'),
      label: format(date, 'MMMM yyyy'),
    });
  }

  const handleDownloadPDF = () => {
    alert('PDF generation feature coming soon!');
  };

  const handleDownloadExcel = () => {
    alert('Excel export feature coming soon!');
  };

  const handleEmailReport = () => {
    alert('Email report feature coming soon!');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-4 items-center justify-between">
        <div className="flex gap-4 items-center">
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="px-4 py-2 border-2 border-dark-brown/10 rounded-xl focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20 font-semibold"
          >
            {monthOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          <button
            onClick={() => setSelectedMonth(format(new Date(), 'yyyy-MM'))}
            className="px-4 py-2 bg-primary/10 text-primary font-semibold rounded-xl hover:bg-primary/20 transition-colors"
          >
            Current Month
          </button>
        </div>

        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={compareWithLast}
              onChange={(e) => setCompareWithLast(e.target.checked)}
              className="w-4 h-4 rounded border-2 border-accent text-accent focus:ring-accent"
            />
            <span className="text-sm font-medium text-dark-brown">Compare with last month</span>
          </label>
        </div>
      </div>

      <div className="bg-gradient-to-br from-accent/20 to-accent/10 rounded-2xl shadow-soft-lg p-8 border-2 border-accent/30">
        <h3 className="font-heading text-4xl font-bold text-primary mb-6">
          {format(monthDate, 'MMMM yyyy')}
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6">
            <p className="text-sm text-dark-brown/60 mb-2">Total Investments</p>
            <p className="text-3xl font-bold text-sage mb-2">
              ₹{totalInvestments.toLocaleString('en-IN')}
            </p>
            {compareWithLast && (
              <div className={`flex items-center gap-2 ${
                investmentChange >= 0 ? 'text-sage' : 'text-soft-red'
              }`}>
                {investmentChange >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                <span className="text-sm font-semibold">
                  {investmentChange >= 0 ? '+' : ''}{investmentChange.toFixed(1)}% vs last month
                </span>
              </div>
            )}
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6">
            <p className="text-sm text-dark-brown/60 mb-2">Total Expenses</p>
            <p className="text-3xl font-bold text-secondary mb-2">
              ₹{totalExpenses.toLocaleString('en-IN')}
            </p>
            {compareWithLast && (
              <div className={`flex items-center gap-2 ${
                expenseChange <= 0 ? 'text-sage' : 'text-soft-red'
              }`}>
                {expenseChange >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                <span className="text-sm font-semibold">
                  {expenseChange >= 0 ? '+' : ''}{expenseChange.toFixed(1)}% vs last month
                </span>
              </div>
            )}
          </div>

          <div className={`bg-white/80 backdrop-blur-sm rounded-xl p-6 ${
            netChange >= 0 ? 'ring-2 ring-accent' : 'ring-2 ring-soft-red'
          }`}>
            <p className="text-sm text-dark-brown/60 mb-2">Net Change</p>
            <p className={`text-3xl font-bold mb-2 ${
              netChange >= 0 ? 'text-accent' : 'text-soft-red'
            }`}>
              {netChange >= 0 ? '+' : ''}₹{netChange.toLocaleString('en-IN')}
            </p>
            {compareWithLast && (
              <div className={`flex items-center gap-2 ${
                netChangePercent >= 0 ? 'text-sage' : 'text-soft-red'
              }`}>
                {netChangePercent >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                <span className="text-sm font-semibold">
                  {netChangePercent >= 0 ? '+' : ''}{netChangePercent.toFixed(1)}% vs last month
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-soft p-6">
        <h3 className="font-heading text-2xl font-bold text-primary mb-4">
          Category Breakdown
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-cream/50 border-b-2 border-accent/10">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold text-dark-brown">Category</th>
                <th className="px-4 py-3 text-right text-sm font-semibold text-dark-brown">This Month</th>
                {compareWithLast && (
                  <>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-dark-brown">Last Month</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-dark-brown">Change</th>
                    <th className="px-4 py-3 text-center text-sm font-semibold text-dark-brown">Trend</th>
                  </>
                )}
              </tr>
            </thead>
            <tbody>
              {categoryArray.map((cat, index) => (
                <tr
                  key={cat.category}
                  className={`border-b border-dark-brown/5 ${
                    index % 2 === 0 ? 'bg-white' : 'bg-cream/20'
                  }`}
                >
                  <td className="px-4 py-3 font-semibold text-primary">{cat.category}</td>
                  <td className="px-4 py-3 text-right font-bold text-secondary">
                    ₹{cat.thisMonth.toLocaleString('en-IN')}
                  </td>
                  {compareWithLast && (
                    <>
                      <td className="px-4 py-3 text-right text-dark-brown">
                        ₹{cat.lastMonth.toLocaleString('en-IN')}
                      </td>
                      <td className={`px-4 py-3 text-right font-semibold ${
                        cat.changeAmount >= 0 ? 'text-soft-red' : 'text-sage'
                      }`}>
                        {cat.changeAmount >= 0 ? '+' : ''}₹{cat.changeAmount.toLocaleString('en-IN')}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${
                          cat.change > 0 ? 'bg-soft-red/20 text-soft-red' : cat.change < 0 ? 'bg-sage/20 text-sage' : 'bg-dark-brown/10 text-dark-brown'
                        }`}>
                          {cat.change > 0 && <TrendingUp className="w-3 h-3" />}
                          {cat.change < 0 && <TrendingDown className="w-3 h-3" />}
                          {cat.change.toFixed(0)}%
                        </span>
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-accent/10 border-t-2 border-accent/30">
              <tr>
                <td className="px-4 py-3 font-bold text-dark-brown">Total</td>
                <td className="px-4 py-3 text-right text-xl font-bold text-accent">
                  ₹{totalExpenses.toLocaleString('en-IN')}
                </td>
                {compareWithLast && (
                  <>
                    <td className="px-4 py-3 text-right font-bold text-dark-brown">
                      ₹{lastMonthTotalExpenses.toLocaleString('en-IN')}
                    </td>
                    <td colSpan={2}></td>
                  </>
                )}
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-soft p-6">
        <h3 className="font-heading text-2xl font-bold text-primary mb-4">
          Detailed Daily Breakdown
        </h3>
        <div className="overflow-x-auto max-h-96">
          <table className="w-full">
            <thead className="bg-cream/50 border-b-2 border-accent/10 sticky top-0">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold text-dark-brown">Date</th>
                <th className="px-4 py-3 text-right text-sm font-semibold text-dark-brown">Investments</th>
                <th className="px-4 py-3 text-right text-sm font-semibold text-dark-brown">Expenses</th>
                <th className="px-4 py-3 text-right text-sm font-semibold text-dark-brown">Net</th>
              </tr>
            </thead>
            <tbody>
              {dailyData.map((day, index) => {
                const net = day.investmentTotal - day.expenseTotal;
                const hasActivity = day.expenses.length > 0 || day.investments.length > 0;

                if (!hasActivity) return null;

                return (
                  <tr
                    key={day.date.toString()}
                    className={`border-b border-dark-brown/5 ${
                      index % 2 === 0 ? 'bg-white' : 'bg-cream/20'
                    }`}
                  >
                    <td className="px-4 py-3 font-semibold text-primary">
                      {format(day.date, 'EEE, MMM d')}
                    </td>
                    <td className="px-4 py-3 text-right text-sage font-semibold">
                      {day.investmentTotal > 0 ? `₹${day.investmentTotal.toLocaleString('en-IN')}` : '-'}
                    </td>
                    <td className="px-4 py-3 text-right text-secondary font-semibold">
                      {day.expenseTotal > 0 ? `₹${day.expenseTotal.toLocaleString('en-IN')}` : '-'}
                    </td>
                    <td className={`px-4 py-3 text-right font-bold ${
                      net > 0 ? 'text-accent' : net < 0 ? 'text-soft-red' : 'text-dark-brown'
                    }`}>
                      {net !== 0 ? `${net > 0 ? '+' : ''}₹${net.toLocaleString('en-IN')}` : '-'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-cream/50 rounded-2xl shadow-soft p-6">
        <h3 className="font-heading text-xl font-bold text-primary mb-4">
          Export Options
        </h3>
        <div className="flex flex-wrap gap-4">
          <button
            onClick={handleDownloadPDF}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-accent to-secondary text-white font-semibold rounded-xl shadow-soft hover:shadow-soft-lg transition-all duration-300 hover:scale-105"
          >
            <FileText className="w-5 h-5" />
            Download PDF Report
          </button>
          <button
            onClick={handleDownloadExcel}
            className="flex items-center gap-2 px-6 py-3 bg-white border-2 border-sage text-sage font-semibold rounded-xl hover:bg-sage hover:text-white transition-all duration-300"
          >
            <Download className="w-5 h-5" />
            Export to Excel
          </button>
          <button
            onClick={handleEmailReport}
            className="flex items-center gap-2 px-6 py-3 bg-white border-2 border-primary text-primary font-semibold rounded-xl hover:bg-primary hover:text-white transition-all duration-300"
          >
            <Mail className="w-5 h-5" />
            Email Report
          </button>
        </div>
      </div>
    </div>
  );
}
