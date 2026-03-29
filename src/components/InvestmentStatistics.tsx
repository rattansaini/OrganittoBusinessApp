import { PieChart, Pie, Cell, BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, Users, DollarSign, Target } from 'lucide-react';

interface Investment {
  id: string;
  partner_id: string;
  amount: number;
  investment_date: string;
  purpose: string;
  status: string;
  users: { name: string } | null;
}

interface InvestmentStatisticsProps {
  investments: Investment[];
}

const COLORS = ['#B8860B', '#2D5016', '#C17817', '#8B4513', '#D4AF37', '#CD853F', '#DAA520'];

export default function InvestmentStatistics({ investments }: InvestmentStatisticsProps) {
  const approvedInvestments = investments.filter(inv => inv.status === 'approved');

  const partnerContributions = approvedInvestments.reduce((acc, inv) => {
    const partnerName = inv.users?.name || 'Unknown';
    if (!acc[partnerName]) {
      acc[partnerName] = 0;
    }
    acc[partnerName] += inv.amount;
    return acc;
  }, {} as Record<string, number>);

  const partnerData = Object.entries(partnerContributions).map(([name, value]) => ({
    name,
    value: Number(value),
  }));

  const purposeBreakdown = approvedInvestments.reduce((acc, inv) => {
    if (!acc[inv.purpose]) {
      acc[inv.purpose] = 0;
    }
    acc[inv.purpose] += inv.amount;
    return acc;
  }, {} as Record<string, number>);

  const purposeData = Object.entries(purposeBreakdown).map(([name, value]) => ({
    name,
    value: Number(value),
  })).sort((a, b) => b.value - a.value);

  const monthlyData = approvedInvestments.reduce((acc, inv) => {
    const date = new Date(inv.investment_date);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    if (!acc[monthKey]) {
      acc[monthKey] = 0;
    }
    acc[monthKey] += inv.amount;
    return acc;
  }, {} as Record<string, number>);

  const sortedMonths = Object.keys(monthlyData).sort();
  let cumulative = 0;
  const timelineData = sortedMonths.map(month => {
    cumulative += monthlyData[month];
    const [year, monthNum] = month.split('-');
    const monthName = new Date(parseInt(year), parseInt(monthNum) - 1).toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
    return {
      month: monthName,
      monthly: monthlyData[month],
      cumulative,
    };
  });

  const totalInvestment = approvedInvestments.reduce((sum, inv) => sum + inv.amount, 0);
  const uniquePartners = new Set(approvedInvestments.map(inv => inv.partner_id)).size;
  const avgInvestment = uniquePartners > 0 ? totalInvestment / uniquePartners : 0;

  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  const lastMonth = new Date(currentYear, currentMonth - 1);

  const thisMonthInvestments = approvedInvestments.filter(inv => {
    const invDate = new Date(inv.investment_date);
    return invDate.getMonth() === currentMonth && invDate.getFullYear() === currentYear;
  });

  const lastMonthInvestments = approvedInvestments.filter(inv => {
    const invDate = new Date(inv.investment_date);
    return invDate.getMonth() === lastMonth.getMonth() && invDate.getFullYear() === lastMonth.getFullYear();
  });

  const thisMonthTotal = thisMonthInvestments.reduce((sum, inv) => sum + inv.amount, 0);
  const lastMonthTotal = lastMonthInvestments.reduce((sum, inv) => sum + inv.amount, 0);
  const growthPercent = lastMonthTotal > 0 ? ((thisMonthTotal - lastMonthTotal) / lastMonthTotal) * 100 : 0;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-accent/10 to-accent/5 rounded-xl p-6 border-2 border-accent/20">
          <div className="flex items-center justify-between mb-3">
            <div className="w-12 h-12 bg-accent/20 rounded-lg flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-accent" />
            </div>
            <span className="text-xs font-semibold text-accent uppercase tracking-wide">Total</span>
          </div>
          <p className="text-3xl font-bold text-accent mb-1">
            ₹{totalInvestment.toLocaleString('en-IN')}
          </p>
          <p className="text-sm text-dark-brown/60">Total Investment</p>
        </div>

        <div className="bg-gradient-to-br from-sage/10 to-sage/5 rounded-xl p-6 border-2 border-sage/20">
          <div className="flex items-center justify-between mb-3">
            <div className="w-12 h-12 bg-sage/20 rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6 text-sage" />
            </div>
            <span className="text-xs font-semibold text-sage uppercase tracking-wide">Partners</span>
          </div>
          <p className="text-3xl font-bold text-sage mb-1">{uniquePartners}</p>
          <p className="text-sm text-dark-brown/60">Partners Invested</p>
        </div>

        <div className="bg-gradient-to-br from-secondary/10 to-secondary/5 rounded-xl p-6 border-2 border-secondary/20">
          <div className="flex items-center justify-between mb-3">
            <div className="w-12 h-12 bg-secondary/20 rounded-lg flex items-center justify-center">
              <Target className="w-6 h-6 text-secondary" />
            </div>
            <span className="text-xs font-semibold text-secondary uppercase tracking-wide">Average</span>
          </div>
          <p className="text-3xl font-bold text-secondary mb-1">
            ₹{avgInvestment.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
          </p>
          <p className="text-sm text-dark-brown/60">Per Partner</p>
        </div>

        <div className="bg-gradient-to-br from-primary/10 to-primary/5 rounded-xl p-6 border-2 border-primary/20">
          <div className="flex items-center justify-between mb-3">
            <div className="w-12 h-12 bg-primary/20 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-primary" />
            </div>
            <span className="text-xs font-semibold text-primary uppercase tracking-wide">Growth</span>
          </div>
          <p className={`text-3xl font-bold mb-1 ${growthPercent >= 0 ? 'text-sage' : 'text-soft-red'}`}>
            {growthPercent >= 0 ? '+' : ''}{growthPercent.toFixed(1)}%
          </p>
          <p className="text-sm text-dark-brown/60">This Month</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-soft p-6">
          <h3 className="font-heading text-2xl font-bold text-primary mb-4">
            Partner Contributions
          </h3>
          {partnerData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={partnerData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {partnerData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: number) => `₹${value.toLocaleString('en-IN')}`}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-dark-brown/50">
              No investment data available
            </div>
          )}
        </div>

        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-soft p-6">
          <h3 className="font-heading text-2xl font-bold text-primary mb-4">
            Investment by Purpose
          </h3>
          {purposeData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={purposeData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2D5016" opacity={0.1} />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 12, fill: '#2D5016' }}
                  angle={-45}
                  textAnchor="end"
                  height={100}
                />
                <YAxis tick={{ fontSize: 12, fill: '#2D5016' }} />
                <Tooltip
                  formatter={(value: number) => `₹${value.toLocaleString('en-IN')}`}
                  contentStyle={{ backgroundColor: '#FFF8E7', border: '2px solid #B8860B' }}
                />
                <Bar dataKey="value" fill="#B8860B" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-dark-brown/50">
              No investment data available
            </div>
          )}
        </div>
      </div>

      <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-soft p-6">
        <h3 className="font-heading text-2xl font-bold text-primary mb-4">
          Investment Timeline
        </h3>
        {timelineData.length > 0 ? (
          <ResponsiveContainer width="100%" height={350}>
            <LineChart data={timelineData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2D5016" opacity={0.1} />
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#2D5016' }} />
              <YAxis tick={{ fontSize: 12, fill: '#2D5016' }} />
              <Tooltip
                formatter={(value: number) => `₹${value.toLocaleString('en-IN')}`}
                contentStyle={{ backgroundColor: '#FFF8E7', border: '2px solid #B8860B' }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="monthly"
                stroke="#C17817"
                strokeWidth={2}
                name="Monthly Investment"
                dot={{ fill: '#C17817', r: 4 }}
              />
              <Line
                type="monotone"
                dataKey="cumulative"
                stroke="#2D5016"
                strokeWidth={3}
                name="Cumulative Investment"
                dot={{ fill: '#2D5016', r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-[350px] flex items-center justify-center text-dark-brown/50">
            No investment data available
          </div>
        )}
      </div>

      {totalInvestment >= 100000 && (
        <div className="bg-gradient-to-r from-accent to-secondary rounded-2xl shadow-soft-lg p-8 text-center">
          <p className="text-5xl mb-4">🎉</p>
          <h3 className="font-heading text-3xl font-bold text-white mb-2">
            Milestone Achieved!
          </h3>
          <p className="text-white/90 text-lg">
            Total investments have crossed ₹{(Math.floor(totalInvestment / 100000) * 100000 / 1000).toFixed(0)}K!
            Amazing progress toward building Organitto together.
          </p>
        </div>
      )}
    </div>
  );
}
