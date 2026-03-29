import { TrendingUp, Plus, Eye, Award } from 'lucide-react';
import { format } from 'date-fns';

interface Investment {
  id: string;
  amount: number;
  investment_date: string;
  purpose: string;
  status: string;
}

interface InvestmentCardProps {
  partner: {
    id: string;
    name: string;
    email: string;
  };
  investments: Investment[];
  totalInvestment: number;
  percentageOfTotal: number;
  isTopInvestor: boolean;
  onViewAll: () => void;
  onAddInvestment: () => void;
}

export default function InvestmentCard({
  partner,
  investments,
  totalInvestment,
  percentageOfTotal,
  isTopInvestor,
  onViewAll,
  onAddInvestment,
}: InvestmentCardProps) {
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const recentInvestments = investments
    .sort((a, b) => new Date(b.investment_date).getTime() - new Date(a.investment_date).getTime())
    .slice(0, 3);

  const getPurposeIcon = (purpose: string) => {
    const icons: Record<string, string> = {
      'Initial Capital': '💰',
      'Product Development': '🧪',
      'Raw Material Purchase': '🌿',
      'Equipment Purchase': '🔧',
      'Marketing Budget': '📢',
      'Working Capital': '💼',
      'Infrastructure': '🏢',
      'Other': '📊',
    };
    return icons[purpose] || '💰';
  };

  return (
    <div
      className={`relative bg-gradient-to-br from-cream via-white to-sage/10 rounded-2xl shadow-soft hover:shadow-soft-lg transition-all duration-300 overflow-hidden ${
        isTopInvestor ? 'border-4 border-accent' : 'border-2 border-dark-brown/10'
      }`}
    >
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%232D5016' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      />

      {isTopInvestor && (
        <div className="absolute top-4 right-4 z-10">
          <div className="bg-accent text-white px-3 py-1.5 rounded-full flex items-center gap-2 shadow-soft">
            <Award className="w-4 h-4" />
            <span className="text-xs font-bold">Top Investor</span>
          </div>
        </div>
      )}

      <div className="relative p-6 space-y-4">
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 bg-gradient-to-br from-accent to-secondary rounded-full flex items-center justify-center shadow-soft flex-shrink-0">
            <span className="text-white font-bold text-xl">
              {getInitials(partner.name)}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-heading text-2xl font-bold text-primary truncate">
              {partner.name}
            </h3>
            <p className="text-sm text-dark-brown/60 truncate">{partner.email}</p>
          </div>
        </div>

        <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border-2 border-accent/20">
          <p className="text-sm text-dark-brown/60 mb-1">Total Investment</p>
          <p className="text-3xl font-bold text-accent mb-2">
            ₹{totalInvestment.toLocaleString('en-IN')}
          </p>
          <div className="flex items-center justify-between text-sm">
            <span className="text-dark-brown/70">
              {investments.length} {investments.length === 1 ? 'investment' : 'investments'}
            </span>
            <span className="font-semibold text-secondary">
              {percentageOfTotal.toFixed(1)}% of total
            </span>
          </div>
        </div>

        <div className="bg-gradient-to-r from-accent/10 to-secondary/10 rounded-xl p-1">
          <div
            className="bg-gradient-to-r from-accent to-secondary h-3 rounded-lg transition-all duration-500 shadow-soft"
            style={{ width: `${Math.min(percentageOfTotal, 100)}%` }}
          />
        </div>

        {recentInvestments.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-semibold text-dark-brown/60 uppercase tracking-wide">
              Recent Investments
            </p>
            {recentInvestments.map((investment) => (
              <div
                key={investment.id}
                className="flex items-center gap-3 p-3 bg-white/60 backdrop-blur-sm rounded-lg border border-dark-brown/5 hover:border-accent/30 transition-all"
              >
                <span className="text-2xl">{getPurposeIcon(investment.purpose)}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-dark-brown truncate">
                    {investment.purpose}
                  </p>
                  <p className="text-xs text-dark-brown/60">
                    {format(new Date(investment.investment_date), 'MMM d, yyyy')}
                  </p>
                </div>
                <p className="text-sm font-bold text-secondary">
                  ₹{investment.amount.toLocaleString('en-IN')}
                </p>
              </div>
            ))}
          </div>
        )}

        <div className="flex gap-2 pt-2">
          <button
            onClick={onViewAll}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 border-2 border-accent text-accent font-semibold rounded-xl hover:bg-accent hover:text-white transition-all duration-300"
          >
            <Eye className="w-4 h-4" />
            View All
          </button>
          <button
            onClick={onAddInvestment}
            className="flex items-center justify-center px-4 py-3 bg-gradient-to-r from-accent to-secondary text-white font-semibold rounded-xl shadow-soft hover:shadow-soft-lg transition-all duration-300 hover:scale-105"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
