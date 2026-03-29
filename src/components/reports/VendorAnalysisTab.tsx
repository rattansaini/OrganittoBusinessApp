import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Store, TrendingUp, Clock, AlertTriangle } from 'lucide-react';
import { format, differenceInDays } from 'date-fns';

interface VendorAnalysisTabProps {
  expenses: any[];
  vendors: any[];
}

export default function VendorAnalysisTab({ expenses, vendors }: VendorAnalysisTabProps) {
  const approvedExpenses = expenses.filter(e => e.status === 'approved' && e.vendor_id);

  const vendorData = approvedExpenses.reduce((acc, exp) => {
    const vendorId = exp.vendor_id;
    const vendor = exp.vendors;

    if (!vendor) return acc;

    if (!acc[vendorId]) {
      acc[vendorId] = {
        id: vendorId,
        name: vendor.name,
        category: vendor.category,
        totalSpent: 0,
        transactionCount: 0,
        lastTransactionDate: exp.expense_date,
        transactions: [],
        categories: {} as Record<string, number>,
      };
    }

    acc[vendorId].totalSpent += exp.amount;
    acc[vendorId].transactionCount += 1;
    acc[vendorId].transactions.push(exp);

    if (new Date(exp.expense_date) > new Date(acc[vendorId].lastTransactionDate)) {
      acc[vendorId].lastTransactionDate = exp.expense_date;
    }

    const category = exp.category;
    acc[vendorId].categories[category] = (acc[vendorId].categories[category] || 0) + exp.amount;

    return acc;
  }, {} as Record<string, any>);

  const vendorArray = Object.values(vendorData).sort((a, b) => b.totalSpent - a.totalSpent);

  const topVendors = vendorArray.slice(0, 10);

  const topVendorsData = topVendors.map(vendor => ({
    name: vendor.name,
    amount: vendor.totalSpent,
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

  const getVendorIcon = (category: string | null) => {
    if (!category) return '🏪';
    const icons: Record<string, string> = {
      'supplier': '🏭',
      'service': '🔧',
      'contractor': '👷',
      'transport': '🚚',
      'retail': '🏪',
    };
    return icons[category.toLowerCase()] || '🏪';
  };

  const daysSinceLastTransaction = (date: string) => {
    return differenceInDays(new Date(), new Date(date));
  };

  const totalSpentAllVendors = vendorArray.reduce((sum, v) => sum + v.totalSpent, 0);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {vendorArray.map((vendor) => {
          const avgTransaction = vendor.transactionCount > 0 ? vendor.totalSpent / vendor.transactionCount : 0;
          const daysSince = daysSinceLastTransaction(vendor.lastTransactionDate);
          const percentageOfTotal = totalSpentAllVendors > 0 ? (vendor.totalSpent / totalSpentAllVendors) * 100 : 0;

          return (
            <div
              key={vendor.id}
              className="bg-gradient-to-br from-white to-cream rounded-xl p-6 border-2 border-dark-brown/10 shadow-soft hover:shadow-soft-lg transition-all duration-300"
            >
              <div className="flex items-start gap-4 mb-4">
                <div className="w-14 h-14 bg-gradient-to-br from-primary to-sage rounded-lg flex items-center justify-center shadow-soft flex-shrink-0">
                  <span className="text-3xl">{getVendorIcon(vendor.category)}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-heading text-lg font-bold text-primary truncate">
                    {vendor.name}
                  </h4>
                  <p className="text-xs text-dark-brown/60 capitalize">
                    {vendor.category || 'General Vendor'}
                  </p>
                </div>
              </div>

              <div className="bg-secondary/10 rounded-lg p-4 mb-4">
                <p className="text-sm text-dark-brown/60 mb-1">Total Spent</p>
                <p className="text-3xl font-bold text-secondary mb-2">
                  ₹{vendor.totalSpent.toLocaleString('en-IN')}
                </p>
                <p className="text-xs text-dark-brown/60">
                  {percentageOfTotal.toFixed(1)}% of all vendor spending
                </p>
              </div>

              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-dark-brown/60">Transactions</span>
                  <span className="font-bold text-primary">{vendor.transactionCount}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-dark-brown/60">Avg Transaction</span>
                  <span className="font-bold text-accent">
                    ₹{avgTransaction.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-dark-brown/60 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    Last Transaction
                  </span>
                  <span className={`font-semibold ${
                    daysSince > 60 ? 'text-soft-red' : 'text-sage'
                  }`}>
                    {daysSince} days ago
                  </span>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-dark-brown/10">
                <p className="text-xs text-dark-brown/60 mb-2">Primary Categories</p>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(vendor.categories)
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, 3)
                    .map(([cat, amount]) => (
                      <span
                        key={cat}
                        className="inline-flex items-center gap-1 px-2 py-1 bg-accent/10 rounded-full text-xs font-semibold text-dark-brown"
                      >
                        {getCategoryIcon(cat)} {cat}
                      </span>
                    ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {topVendorsData.length > 0 && (
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-soft p-6">
          <h3 className="font-heading text-2xl font-bold text-primary mb-4">
            Top 10 Vendors by Spending
          </h3>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={topVendorsData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#2D5016" opacity={0.1} />
              <XAxis type="number" tick={{ fontSize: 12, fill: '#2D5016' }} />
              <YAxis
                dataKey="name"
                type="category"
                width={150}
                tick={{ fontSize: 11, fill: '#2D5016' }}
              />
              <Tooltip
                formatter={(value: number) => `₹${value.toLocaleString('en-IN')}`}
                contentStyle={{ backgroundColor: '#FFF8E7', border: '2px solid #2D5016' }}
              />
              <Bar dataKey="amount" fill="#C17817" radius={[0, 8, 8, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-accent/10 to-accent/5 rounded-2xl shadow-soft p-6 border-2 border-accent/20">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-accent/20 rounded-lg flex items-center justify-center">
              <Store className="w-6 h-6 text-accent" />
            </div>
            <h3 className="font-heading text-xl font-bold text-primary">Total Vendors</h3>
          </div>
          <p className="text-5xl font-bold text-accent mb-2">{vendorArray.length}</p>
          <p className="text-sm text-dark-brown/60">Active vendors with transactions</p>
        </div>

        <div className="bg-gradient-to-br from-secondary/10 to-secondary/5 rounded-2xl shadow-soft p-6 border-2 border-secondary/20">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-secondary/20 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-secondary" />
            </div>
            <h3 className="font-heading text-xl font-bold text-primary">Total Spent</h3>
          </div>
          <p className="text-4xl font-bold text-secondary mb-2">
            ₹{totalSpentAllVendors.toLocaleString('en-IN')}
          </p>
          <p className="text-sm text-dark-brown/60">Across all vendors</p>
        </div>

        <div className="bg-gradient-to-br from-sage/10 to-sage/5 rounded-2xl shadow-soft p-6 border-2 border-sage/20">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-sage/20 rounded-lg flex items-center justify-center">
              <Clock className="w-6 h-6 text-sage" />
            </div>
            <h3 className="font-heading text-xl font-bold text-primary">Avg Transaction</h3>
          </div>
          <p className="text-4xl font-bold text-sage mb-2">
            ₹{vendorArray.length > 0
              ? (totalSpentAllVendors / vendorArray.reduce((sum, v) => sum + v.transactionCount, 0)).toLocaleString('en-IN', { maximumFractionDigits: 0 })
              : '0'}
          </p>
          <p className="text-sm text-dark-brown/60">Per vendor transaction</p>
        </div>
      </div>

      {vendorArray.filter(v => daysSinceLastTransaction(v.lastTransactionDate) > 90).length > 0 && (
        <div className="bg-gradient-to-br from-soft-red/10 to-soft-red/5 rounded-2xl shadow-soft p-6 border-2 border-soft-red/30">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-soft-red/20 rounded-lg flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-soft-red" />
            </div>
            <h3 className="font-heading text-xl font-bold text-primary">Inactive Vendors</h3>
          </div>
          <p className="text-dark-brown/70 mb-4">
            The following vendors haven't been used in over 90 days. Consider reviewing your vendor relationships.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {vendorArray
              .filter(v => daysSinceLastTransaction(v.lastTransactionDate) > 90)
              .map(vendor => {
                const daysSince = daysSinceLastTransaction(vendor.lastTransactionDate);
                return (
                  <div
                    key={vendor.id}
                    className="bg-white/60 rounded-lg p-4 border border-soft-red/20"
                  >
                    <p className="font-semibold text-primary mb-1">{vendor.name}</p>
                    <p className="text-sm text-dark-brown/60">
                      Last used: {format(new Date(vendor.lastTransactionDate), 'MMM d, yyyy')}
                    </p>
                    <p className="text-xs text-soft-red font-semibold mt-1">
                      {daysSince} days ago
                    </p>
                  </div>
                );
              })}
          </div>
        </div>
      )}
    </div>
  );
}
