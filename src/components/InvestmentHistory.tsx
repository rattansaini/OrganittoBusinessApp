import { X, Download, Eye, FileText } from 'lucide-react';
import { format } from 'date-fns';

interface Investment {
  id: string;
  amount: number;
  investment_date: string;
  purpose: string;
  notes: string | null;
  payment_proof_url: string | null;
  status: string;
  submitted_by: string;
  users_submitted_by: { name: string } | null;
}

interface InvestmentHistoryProps {
  isOpen: boolean;
  onClose: () => void;
  partner: {
    id: string;
    name: string;
    email: string;
  };
  investments: Investment[];
}

export default function InvestmentHistory({
  isOpen,
  onClose,
  partner,
  investments,
}: InvestmentHistoryProps) {
  if (!isOpen) return null;

  const totalInvestment = investments.reduce((sum, inv) => sum + inv.amount, 0);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-sage/20 text-sage">
            ✅ Approved
          </span>
        );
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-accent/20 text-accent">
            ⏳ Pending
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-soft-red/20 text-soft-red">
            ❌ Rejected
          </span>
        );
      default:
        return null;
    }
  };

  const handleDownloadStatement = () => {
    alert('PDF generation feature coming soon!');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-dark-brown/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative bg-white rounded-2xl shadow-soft-lg max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="bg-gradient-to-r from-accent to-secondary p-6 border-b-2 border-accent/20">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-heading text-3xl font-bold text-white">
                {partner.name}'s Investment History
              </h2>
              <p className="text-white/80 text-sm mt-1">
                Complete record of all investments
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              <X className="w-6 h-6 text-white" />
            </button>
          </div>
        </div>

        <div className="p-6 bg-cream/50 border-b border-dark-brown/10">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-dark-brown/60 mb-1">Total Investment</p>
              <p className="text-4xl font-bold text-accent">
                ₹{totalInvestment.toLocaleString('en-IN')}
              </p>
              <p className="text-sm text-dark-brown/70 mt-1">
                Across {investments.length} {investments.length === 1 ? 'investment' : 'investments'}
              </p>
            </div>
            <button
              onClick={handleDownloadStatement}
              className="flex items-center gap-2 px-6 py-3 bg-white border-2 border-accent text-accent font-semibold rounded-xl hover:bg-accent hover:text-white transition-all duration-300 shadow-soft"
            >
              <Download className="w-5 h-5" />
              Download Statement
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {investments.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-dark-brown/50">No investments recorded yet</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-cream/50 border-b-2 border-accent/10 sticky top-0">
                  <tr>
                    <th className="px-4 py-4 text-left text-sm font-semibold text-dark-brown">
                      Date
                    </th>
                    <th className="px-4 py-4 text-left text-sm font-semibold text-dark-brown">
                      Purpose
                    </th>
                    <th className="px-4 py-4 text-left text-sm font-semibold text-dark-brown">
                      Amount
                    </th>
                    <th className="px-4 py-4 text-left text-sm font-semibold text-dark-brown">
                      Status
                    </th>
                    <th className="px-4 py-4 text-left text-sm font-semibold text-dark-brown">
                      Added By
                    </th>
                    <th className="px-4 py-4 text-center text-sm font-semibold text-dark-brown">
                      Proof
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {investments
                    .sort((a, b) => new Date(b.investment_date).getTime() - new Date(a.investment_date).getTime())
                    .map((investment, index) => (
                      <tr
                        key={investment.id}
                        className={`border-b border-dark-brown/5 hover:bg-cream/30 transition-colors ${
                          index % 2 === 0 ? 'bg-white' : 'bg-cream/20'
                        }`}
                      >
                        <td className="px-4 py-4 text-sm text-dark-brown">
                          {format(new Date(investment.investment_date), 'MMM d, yyyy')}
                        </td>
                        <td className="px-4 py-4">
                          <div>
                            <p className="text-sm font-semibold text-dark-brown">
                              {investment.purpose}
                            </p>
                            {investment.notes && (
                              <p className="text-xs text-dark-brown/60 mt-1 line-clamp-2">
                                {investment.notes}
                              </p>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <p className="text-lg font-bold text-secondary">
                            ₹{investment.amount.toLocaleString('en-IN')}
                          </p>
                        </td>
                        <td className="px-4 py-4">
                          {getStatusBadge(investment.status)}
                        </td>
                        <td className="px-4 py-4">
                          <p className="text-sm text-dark-brown">
                            {investment.users_submitted_by?.name || 'Unknown'}
                          </p>
                        </td>
                        <td className="px-4 py-4 text-center">
                          {investment.payment_proof_url ? (
                            <a
                              href={investment.payment_proof_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex p-2 hover:bg-primary/10 rounded-lg transition-colors"
                              title="View proof"
                            >
                              <Eye className="w-4 h-4 text-primary" />
                            </a>
                          ) : (
                            <span className="text-xs text-dark-brown/30">No proof</span>
                          )}
                        </td>
                      </tr>
                    ))}
                </tbody>
                <tfoot className="bg-accent/10 border-t-2 border-accent/30">
                  <tr>
                    <td colSpan={2} className="px-4 py-4 text-right font-bold text-dark-brown">
                      Total:
                    </td>
                    <td className="px-4 py-4">
                      <p className="text-2xl font-bold text-accent">
                        ₹{totalInvestment.toLocaleString('en-IN')}
                      </p>
                    </td>
                    <td colSpan={3}></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>

        <div className="p-4 bg-cream/50 border-t border-dark-brown/10 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-3 bg-white border-2 border-dark-brown/20 text-dark-brown font-semibold rounded-xl hover:bg-dark-brown/5 transition-all duration-300"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
