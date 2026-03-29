import { useEffect, useState } from 'react';
import { Plus, Calendar, DollarSign, Filter } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface VendorTransactionsTabProps {
  vendorId: string;
}

export default function VendorTransactionsTab({ vendorId }: VendorTransactionsTabProps) {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<any[]>([]);
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    fetchTransactions();
  }, [vendorId]);

  useEffect(() => {
    filterTransactions();
  }, [transactions, filterStatus]);

  const fetchTransactions = async () => {
    try {
      const { data, error } = await supabase
        .from('vendor_transactions')
        .select('*')
        .eq('vendor_id', vendorId)
        .order('date', { ascending: false });

      if (error) throw error;
      setTransactions(data || []);
    } catch (error) {
      console.error('Error fetching transactions:', error);
    }
  };

  const filterTransactions = () => {
    if (filterStatus === 'all') {
      setFilteredTransactions(transactions);
    } else {
      setFilteredTransactions(transactions.filter(t => t.status === filterStatus));
    }
  };

  const totalAmount = filteredTransactions.reduce((sum, t) => sum + parseFloat(t.amount), 0);
  const paidAmount = filteredTransactions.filter(t => t.status === 'paid').reduce((sum, t) => sum + parseFloat(t.amount), 0);
  const pendingAmount = filteredTransactions.filter(t => t.status === 'pending').reduce((sum, t) => sum + parseFloat(t.amount), 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Filter className="w-5 h-5 text-dark-brown/60" />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 border-2 border-dark-brown/10 rounded-lg focus:border-accent focus:outline-none"
          >
            <option value="all">All Transactions</option>
            <option value="paid">Paid</option>
            <option value="pending">Pending</option>
          </select>
        </div>

        <button className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-primary to-sage text-white rounded-xl font-semibold hover:shadow-soft-lg transition-all">
          <Plus className="w-5 h-5" />
          Add Transaction
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-cream/50 rounded-xl p-4">
          <p className="text-sm text-dark-brown/60 mb-1">Total Transactions</p>
          <p className="text-2xl font-bold text-primary">₹{totalAmount.toFixed(0)}</p>
          <p className="text-xs text-dark-brown/60 mt-1">{filteredTransactions.length} transactions</p>
        </div>

        <div className="bg-sage/10 rounded-xl p-4">
          <p className="text-sm text-dark-brown/60 mb-1">Paid</p>
          <p className="text-2xl font-bold text-sage">₹{paidAmount.toFixed(0)}</p>
          <p className="text-xs text-dark-brown/60 mt-1">
            {filteredTransactions.filter(t => t.status === 'paid').length} transactions
          </p>
        </div>

        <div className="bg-soft-red/10 rounded-xl p-4">
          <p className="text-sm text-dark-brown/60 mb-1">Pending</p>
          <p className="text-2xl font-bold text-soft-red">₹{pendingAmount.toFixed(0)}</p>
          <p className="text-xs text-dark-brown/60 mt-1">
            {filteredTransactions.filter(t => t.status === 'pending').length} transactions
          </p>
        </div>
      </div>

      <div className="bg-white border-2 border-dark-brown/5 rounded-xl overflow-hidden">
        {filteredTransactions.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-cream">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-bold text-dark-brown">Date</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-dark-brown">Type</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-dark-brown">Description</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-dark-brown">Amount</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-dark-brown">Payment Mode</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-dark-brown">Status</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-dark-brown">Invoice #</th>
                </tr>
              </thead>
              <tbody>
                {filteredTransactions.map((transaction, index) => (
                  <tr
                    key={transaction.id}
                    className={`border-t border-dark-brown/5 hover:bg-cream/50 transition-colors ${
                      index % 2 === 0 ? 'bg-white' : 'bg-cream/20'
                    }`}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-dark-brown/40" />
                        <span className="text-sm font-semibold text-dark-brown">
                          {new Date(transaction.date).toLocaleDateString()}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                        transaction.transaction_type === 'expense'
                          ? 'bg-accent/10 text-accent'
                          : 'bg-sage/10 text-sage'
                      }`}>
                        {transaction.transaction_type}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-dark-brown">{transaction.description || '-'}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1">
                        <DollarSign className="w-4 h-4 text-sage" />
                        <span className="text-sm font-bold text-sage">
                          ₹{parseFloat(transaction.amount).toFixed(2)}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-dark-brown/70">{transaction.payment_mode || '-'}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                        transaction.status === 'paid'
                          ? 'bg-sage/10 text-sage'
                          : 'bg-soft-red/10 text-soft-red'
                      }`}>
                        {transaction.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-dark-brown/70">{transaction.invoice_number || '-'}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12">
            <DollarSign className="w-16 h-16 text-dark-brown/20 mx-auto mb-4" />
            <h3 className="font-heading text-xl font-bold text-dark-brown/60 mb-2">
              No transactions found
            </h3>
            <p className="text-dark-brown/40 mb-4">Start by adding your first transaction</p>
            <button className="px-6 py-3 bg-gradient-to-r from-primary to-sage text-white rounded-xl font-semibold hover:shadow-soft-lg transition-all">
              Add Transaction
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
