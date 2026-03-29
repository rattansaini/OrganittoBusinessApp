import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Award, TrendingUp, CreditCard, Tag, CheckCircle } from 'lucide-react';

interface PartnerAnalysisTabProps {
  expenses: any[];
  investments: any[];
}

export default function PartnerAnalysisTab({ expenses, investments }: PartnerAnalysisTabProps) {
  const approvedExpenses = expenses.filter(e => e.status === 'approved');
  const approvedInvestments = investments.filter(i => i.status === 'approved');

  const partnerData = approvedExpenses.reduce((acc, exp) => {
    const partnerId = exp.paid_by || exp.user_id;
    const partnerName = exp.users_paid_by?.name || exp.users?.name || 'Unknown';

    if (!acc[partnerId]) {
      acc[partnerId] = {
        id: partnerId,
        name: partnerName,
        totalExpenses: 0,
        totalInvestments: 0,
        expenseCount: 0,
        approvedCount: 0,
        submittedCount: 0,
        paymentModes: {} as Record<string, number>,
        categories: {} as Record<string, number>,
      };
    }

    acc[partnerId].totalExpenses += exp.amount;
    acc[partnerId].expenseCount += 1;

    if (exp.status === 'approved') {
      acc[partnerId].approvedCount += 1;
    }

    const mode = exp.payment_mode || 'unknown';
    acc[partnerId].paymentModes[mode] = (acc[partnerId].paymentModes[mode] || 0) + 1;

    const category = exp.category;
    acc[partnerId].categories[category] = (acc[partnerId].categories[category] || 0) + exp.amount;

    return acc;
  }, {} as Record<string, any>);

  expenses.forEach(exp => {
    const submitterId = exp.submitted_by;
    const submitterName = exp.users_submitted_by?.name;

    if (submitterId && submitterName) {
      if (!partnerData[submitterId]) {
        partnerData[submitterId] = {
          id: submitterId,
          name: submitterName,
          totalExpenses: 0,
          totalInvestments: 0,
          expenseCount: 0,
          approvedCount: 0,
          submittedCount: 0,
          paymentModes: {},
          categories: {},
        };
      }
      partnerData[submitterId].submittedCount += 1;
    }
  });

  approvedInvestments.forEach(inv => {
    const partnerId = inv.partner_id;
    const partnerName = inv.users?.name;

    if (!partnerData[partnerId]) {
      partnerData[partnerId] = {
        id: partnerId,
        name: partnerName || 'Unknown',
        totalExpenses: 0,
        totalInvestments: 0,
        expenseCount: 0,
        approvedCount: 0,
        submittedCount: 0,
        paymentModes: {},
        categories: {},
      };
    }

    partnerData[partnerId].totalInvestments += inv.amount;
  });

  const partnerArray = Object.values(partnerData).sort((a, b) => b.totalInvestments - a.totalInvestments);

  const comparisonData = partnerArray.map(partner => ({
    name: partner.name,
    Investment: partner.totalInvestments,
    Expense: partner.totalExpenses,
  }));

  const topInvestors = [...partnerArray].sort((a, b) => b.totalInvestments - a.totalInvestments).slice(0, 5);
  const topSpenders = [...partnerArray].sort((a, b) => b.totalExpenses - a.totalExpenses).slice(0, 5);
  const topApprovalRate = [...partnerArray]
    .filter(p => p.submittedCount > 0)
    .sort((a, b) => (b.approvedCount / b.submittedCount) - (a.approvedCount / a.submittedCount))
    .slice(0, 5);

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getFavoritePaymentMode = (modes: Record<string, number>) => {
    const entries = Object.entries(modes);
    if (entries.length === 0) return 'N/A';
    return entries.sort((a, b) => b[1] - a[1])[0][0].toUpperCase();
  };

  const getTopCategory = (categories: Record<string, number>) => {
    const entries = Object.entries(categories);
    if (entries.length === 0) return 'N/A';
    return entries.sort((a, b) => b[1] - a[1])[0][0];
  };

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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {partnerArray.map((partner) => {
          const netContribution = partner.totalInvestments - partner.totalExpenses;
          const approvalRate = partner.submittedCount > 0
            ? (partner.approvedCount / partner.submittedCount) * 100
            : 0;

          return (
            <div
              key={partner.id}
              className="bg-gradient-to-br from-white to-cream rounded-xl p-6 border-2 border-dark-brown/10 shadow-soft hover:shadow-soft-lg transition-all duration-300"
            >
              <div className="flex items-start gap-4 mb-4">
                <div className="w-14 h-14 bg-gradient-to-br from-accent to-secondary rounded-full flex items-center justify-center shadow-soft flex-shrink-0">
                  <span className="text-white font-bold text-lg">
                    {getInitials(partner.name)}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-heading text-lg font-bold text-primary truncate">
                    {partner.name}
                  </h4>
                  <p className="text-xs text-dark-brown/60">
                    {partner.expenseCount} expenses • {partner.submittedCount} submitted
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="bg-sage/10 rounded-lg p-3">
                  <p className="text-xs text-dark-brown/60 mb-1">Total Investment</p>
                  <p className="text-lg font-bold text-sage">
                    ₹{partner.totalInvestments.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                  </p>
                </div>
                <div className="bg-secondary/10 rounded-lg p-3">
                  <p className="text-xs text-dark-brown/60 mb-1">Total Expenses</p>
                  <p className="text-lg font-bold text-secondary">
                    ₹{partner.totalExpenses.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                  </p>
                </div>
              </div>

              <div className={`rounded-lg p-3 mb-4 ${
                netContribution >= 0 ? 'bg-accent/10' : 'bg-soft-red/10'
              }`}>
                <p className="text-xs text-dark-brown/60 mb-1">Net Contribution</p>
                <p className={`text-xl font-bold ${
                  netContribution >= 0 ? 'text-accent' : 'text-soft-red'
                }`}>
                  {netContribution >= 0 ? '+' : ''}₹{netContribution.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                </p>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-dark-brown/60 flex items-center gap-2">
                    <CheckCircle className="w-4 h-4" />
                    Approval Rate
                  </span>
                  <span className="font-semibold text-sage">{approvalRate.toFixed(0)}%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-dark-brown/60 flex items-center gap-2">
                    <CreditCard className="w-4 h-4" />
                    Payment Mode
                  </span>
                  <span className="font-semibold text-primary">
                    {getFavoritePaymentMode(partner.paymentModes)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-dark-brown/60 flex items-center gap-2">
                    <Tag className="w-4 h-4" />
                    Top Category
                  </span>
                  <span className="font-semibold text-accent">
                    {getCategoryIcon(getTopCategory(partner.categories))} {getTopCategory(partner.categories)}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-soft p-6">
        <h3 className="font-heading text-2xl font-bold text-primary mb-4">
          Partner Investment vs Expense Comparison
        </h3>
        {comparisonData.length > 0 ? (
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={comparisonData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2D5016" opacity={0.1} />
              <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#2D5016' }} angle={-45} textAnchor="end" height={100} />
              <YAxis tick={{ fontSize: 12, fill: '#2D5016' }} />
              <Tooltip
                formatter={(value: number) => `₹${value.toLocaleString('en-IN')}`}
                contentStyle={{ backgroundColor: '#FFF8E7', border: '2px solid #2D5016' }}
              />
              <Legend />
              <Bar dataKey="Investment" fill="#2D5016" radius={[8, 8, 0, 0]} />
              <Bar dataKey="Expense" fill="#C17817" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-[400px] flex items-center justify-center text-dark-brown/50">
            No data available
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-accent/10 to-accent/5 rounded-2xl shadow-soft p-6 border-2 border-accent/20">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-accent/20 rounded-lg flex items-center justify-center">
              <Award className="w-6 h-6 text-accent" />
            </div>
            <h3 className="font-heading text-xl font-bold text-primary">Top Investors</h3>
          </div>
          <div className="space-y-3">
            {topInvestors.map((partner, index) => (
              <div
                key={partner.id}
                className="flex items-center gap-3 p-3 bg-white/60 rounded-lg"
              >
                <span className="text-2xl font-bold text-accent/40">#{index + 1}</span>
                <div className="w-10 h-10 bg-gradient-to-br from-accent to-secondary rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-white font-bold text-sm">
                    {getInitials(partner.name)}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-primary truncate">{partner.name}</p>
                  <p className="text-lg font-bold text-accent">
                    ₹{partner.totalInvestments.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-gradient-to-br from-secondary/10 to-secondary/5 rounded-2xl shadow-soft p-6 border-2 border-secondary/20">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-secondary/20 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-secondary" />
            </div>
            <h3 className="font-heading text-xl font-bold text-primary">Active Spenders</h3>
          </div>
          <div className="space-y-3">
            {topSpenders.map((partner, index) => (
              <div
                key={partner.id}
                className="flex items-center gap-3 p-3 bg-white/60 rounded-lg"
              >
                <span className="text-2xl font-bold text-secondary/40">#{index + 1}</span>
                <div className="w-10 h-10 bg-gradient-to-br from-secondary to-accent rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-white font-bold text-sm">
                    {getInitials(partner.name)}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-primary truncate">{partner.name}</p>
                  <p className="text-lg font-bold text-secondary">
                    ₹{partner.totalExpenses.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-gradient-to-br from-sage/10 to-sage/5 rounded-2xl shadow-soft p-6 border-2 border-sage/20">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-sage/20 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-sage" />
            </div>
            <h3 className="font-heading text-xl font-bold text-primary">Best Approval Rate</h3>
          </div>
          <div className="space-y-3">
            {topApprovalRate.map((partner, index) => {
              const rate = (partner.approvedCount / partner.submittedCount) * 100;
              return (
                <div
                  key={partner.id}
                  className="flex items-center gap-3 p-3 bg-white/60 rounded-lg"
                >
                  <span className="text-2xl font-bold text-sage/40">#{index + 1}</span>
                  <div className="w-10 h-10 bg-gradient-to-br from-sage to-primary rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-white font-bold text-sm">
                      {getInitials(partner.name)}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-primary truncate">{partner.name}</p>
                    <p className="text-lg font-bold text-sage">{rate.toFixed(0)}%</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
