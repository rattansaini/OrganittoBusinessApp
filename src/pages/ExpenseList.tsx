import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Filter, Search, Eye, CheckCircle, XCircle, Edit2, Trash2, Download, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import Header from '../components/Header';
import ApprovalModal from '../components/ApprovalModal';
import BillViewer from '../components/BillViewer';
import { format } from 'date-fns';

interface Expense {
  id: string;
  category: string;
  subcategory: string | null;
  amount: number;
  expense_date: string;
  payment_mode: string;
  status: string;
  purpose: string | null;
  bill_url: string | null;
  approval_comments: string | null;
  rejection_reason: string | null;
  created_at: string;
  paid_by: string;
  vendor_id: string | null;
  submitted_by: string;
  approved_by: string | null;
  users_paid_by: { name: string } | null;
  users_submitted_by: { name: string } | null;
  users_approved_by: { name: string } | null;
  vendors: { name: string } | null;
}

const EXPENSE_CATEGORIES = [
  { value: 'raw_materials', label: 'Raw Materials', icon: '🌿', color: 'bg-sage/20 text-sage' },
  { value: 'packaging', label: 'Packaging', icon: '📦', color: 'bg-accent/20 text-accent' },
  { value: 'printing', label: 'Printing', icon: '🖨️', color: 'bg-dark-brown/20 text-dark-brown' },
  { value: 'shipping', label: 'Shipping & Logistics', icon: '🚚', color: 'bg-primary/20 text-primary' },
  { value: 'marketing', label: 'Marketing & Advertising', icon: '📢', color: 'bg-secondary/20 text-secondary' },
  { value: 'lab_testing', label: 'Lab Testing', icon: '🔬', color: 'bg-sage/30 text-sage' },
  { value: 'licenses', label: 'Licenses & Compliance', icon: '📜', color: 'bg-accent/30 text-accent' },
  { value: 'utilities', label: 'Utilities', icon: '⚡', color: 'bg-primary/30 text-primary' },
  { value: 'rent', label: 'Rent & Infrastructure', icon: '🏢', color: 'bg-dark-brown/30 text-dark-brown' },
  { value: 'salaries', label: 'Salaries & Wages', icon: '👥', color: 'bg-secondary/30 text-secondary' },
  { value: 'equipment', label: 'Equipment & Machinery', icon: '🔧', color: 'bg-sage/40 text-sage' },
  { value: 'other', label: 'Other', icon: '📱', color: 'bg-dark-brown/40 text-dark-brown' },
];

type FilterTab = 'all' | 'pending' | 'approved' | 'rejected' | 'my_expenses';

export default function ExpenseList() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<FilterTab>('all');
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [approvalType, setApprovalType] = useState<'approve' | 'reject'>('approve');
  const [showBillViewer, setShowBillViewer] = useState(false);
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedPaymentModes, setSelectedPaymentModes] = useState<string[]>([]);
  const [sortField, setSortField] = useState<'expense_date' | 'amount' | 'created_at'>('expense_date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    fetchExpenses();

    const channel = supabase
      .channel('expenses-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'expenses' }, () => {
        fetchExpenses();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchExpenses = async () => {
    if (!user) return;

    try {
      let query = supabase
        .from('expenses')
        .select(`
          *,
          users_paid_by:users!expenses_paid_by_fkey(name),
          users_submitted_by:users!expenses_submitted_by_fkey(name),
          users_approved_by:users!expenses_approved_by_fkey(name),
          vendors(name)
        `);

      if (!isAdmin) {
        query = query.eq('submitted_by', user.id);
      }

      const { data, error } = await query.order(sortField, { ascending: sortDirection === 'asc' });

      if (error) throw error;
      setExpenses(data || []);
    } catch (error) {
      console.error('Error fetching expenses:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = (expense: Expense) => {
    setSelectedExpense(expense);
    setApprovalType('approve');
    setShowApprovalModal(true);
  };

  const handleReject = (expense: Expense) => {
    setSelectedExpense(expense);
    setApprovalType('reject');
    setShowApprovalModal(true);
  };

  const confirmApproval = async (comments?: string, reason?: string) => {
    if (!selectedExpense || !user) return;

    setProcessingId(selectedExpense.id);

    try {
      const updateData: any = {
        status: approvalType === 'approve' ? 'approved' : 'rejected',
        approved_by: user.id,
        approved_at: new Date().toISOString(),
      };

      if (approvalType === 'approve' && comments) {
        updateData.approval_comments = comments;
      } else if (approvalType === 'reject' && reason) {
        updateData.rejection_reason = reason;
      }

      const { error: updateError } = await supabase
        .from('expenses')
        .update(updateData)
        .eq('id', selectedExpense.id);

      if (updateError) throw updateError;

      const category = EXPENSE_CATEGORIES.find(c => c.value === selectedExpense.category);
      await supabase.from('activity_log').insert({
        user_id: user.id,
        activity_type: approvalType === 'approve' ? 'expense_approved' : 'expense_rejected',
        description: `${user.name} ${approvalType === 'approve' ? 'approved' : 'rejected'} expense: ₹${selectedExpense.amount.toLocaleString('en-IN')} for ${category?.label || selectedExpense.category}`,
      });

      await fetchExpenses();
      setShowApprovalModal(false);
      setSelectedExpense(null);
    } catch (error) {
      console.error('Error processing approval:', error);
      alert('Failed to process approval. Please try again.');
    } finally {
      setProcessingId(null);
    }
  };

  const handleDelete = async (expenseId: string) => {
    if (!confirm('Are you sure you want to delete this expense? This action cannot be undone.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('expenses')
        .delete()
        .eq('id', expenseId);

      if (error) throw error;

      await fetchExpenses();
    } catch (error) {
      console.error('Error deleting expense:', error);
      alert('Failed to delete expense. Please try again.');
    }
  };

  const viewBill = (expense: Expense) => {
    if (expense.bill_url) {
      setSelectedExpense(expense);
      setShowBillViewer(true);

      supabase
        .from('expenses')
        .update({ viewed_bill: true })
        .eq('id', expense.id)
        .then();
    }
  };

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

  const getCategoryInfo = (category: string) => {
    return EXPENSE_CATEGORIES.find(c => c.value === category) || EXPENSE_CATEGORIES[EXPENSE_CATEGORIES.length - 1];
  };

  const filteredExpenses = expenses.filter(expense => {
    if (activeTab === 'pending' && expense.status !== 'pending') return false;
    if (activeTab === 'approved' && expense.status !== 'approved') return false;
    if (activeTab === 'rejected' && expense.status !== 'rejected') return false;
    if (activeTab === 'my_expenses' && expense.submitted_by !== user?.id) return false;

    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      if (
        !expense.category.toLowerCase().includes(search) &&
        !expense.subcategory?.toLowerCase().includes(search) &&
        !expense.purpose?.toLowerCase().includes(search) &&
        !expense.vendors?.name.toLowerCase().includes(search)
      ) {
        return false;
      }
    }

    if (dateFrom && expense.expense_date < dateFrom) return false;
    if (dateTo && expense.expense_date > dateTo) return false;
    if (selectedCategories.length > 0 && !selectedCategories.includes(expense.category)) return false;
    if (selectedPaymentModes.length > 0 && !selectedPaymentModes.includes(expense.payment_mode)) return false;

    return true;
  });

  const paginatedExpenses = filteredExpenses.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const totalPages = Math.ceil(filteredExpenses.length / itemsPerPage);

  const getExpenseCount = (tab: FilterTab) => {
    if (tab === 'all') return expenses.length;
    if (tab === 'pending') return expenses.filter(e => e.status === 'pending').length;
    if (tab === 'approved') return expenses.filter(e => e.status === 'approved').length;
    if (tab === 'rejected') return expenses.filter(e => e.status === 'rejected').length;
    if (tab === 'my_expenses') return expenses.filter(e => e.submitted_by === user?.id).length;
    return 0;
  };

  const currentMonthTotal = expenses
    .filter(e => {
      const expenseDate = new Date(e.expense_date);
      const now = new Date();
      return expenseDate.getMonth() === now.getMonth() &&
        expenseDate.getFullYear() === now.getFullYear();
    })
    .reduce((sum, e) => sum + e.amount, 0);

  const toggleCategory = (category: string) => {
    setSelectedCategories(prev =>
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  const togglePaymentMode = (mode: string) => {
    setSelectedPaymentModes(prev =>
      prev.includes(mode)
        ? prev.filter(m => m !== mode)
        : [...prev, mode]
    );
  };

  const resetFilters = () => {
    setSearchTerm('');
    setDateFrom('');
    setDateTo('');
    setSelectedCategories([]);
    setSelectedPaymentModes([]);
    setActiveTab('all');
  };

  const handleSort = (field: typeof sortField) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  return (
    <div className="min-h-screen bg-cream relative overflow-hidden">
      <div
        className="absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%232D5016' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      />

      <Header />

      <div className="relative z-10 container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-8 gap-4">
            <div>
              <h2 className="font-heading text-4xl font-bold text-primary mb-2">
                Expense Tracker
              </h2>
              <p className="text-dark-brown/70 text-lg">
                Manage and approve all expenses
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-soft p-4 text-center">
                <p className="text-sm text-dark-brown/60 mb-1">This Month</p>
                <p className="text-2xl font-bold text-secondary">
                  ₹{currentMonthTotal.toLocaleString('en-IN')}
                </p>
              </div>
              <button
                onClick={() => navigate('/expenses/add')}
                className="flex items-center gap-2 px-6 py-3 bg-secondary text-white font-semibold rounded-xl shadow-soft hover:shadow-soft-lg transition-all duration-300 hover:scale-105"
              >
                <Plus className="w-5 h-5" />
                Add Expense
              </button>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-soft p-6 mb-6">
            <div className="flex items-center gap-2 mb-4 overflow-x-auto pb-2">
              {(['all', 'pending', 'approved', 'rejected', 'my_expenses'] as FilterTab[]).map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-all duration-300 flex items-center gap-2 ${
                    activeTab === tab
                      ? 'bg-primary text-cream shadow-soft'
                      : 'bg-cream/50 text-dark-brown hover:bg-primary/10'
                  }`}
                >
                  {tab === 'all' && 'All'}
                  {tab === 'pending' && '⏳ Pending'}
                  {tab === 'approved' && '✅ Approved'}
                  {tab === 'rejected' && '❌ Rejected'}
                  {tab === 'my_expenses' && 'My Expenses'}
                  <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                    activeTab === tab ? 'bg-cream/20 text-cream' : 'bg-dark-brown/10 text-dark-brown'
                  }`}>
                    {getExpenseCount(tab)}
                  </span>
                </button>
              ))}
            </div>

            <div className="space-y-4">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-brown/40" />
                  <input
                    type="text"
                    placeholder="Search by category, vendor, or purpose..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 border-2 border-dark-brown/10 rounded-xl focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all duration-300"
                  />
                </div>
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className={`flex items-center gap-2 px-6 py-3 border-2 font-semibold rounded-xl transition-all duration-300 ${
                    showFilters || selectedCategories.length > 0 || selectedPaymentModes.length > 0 || dateFrom || dateTo
                      ? 'border-primary bg-primary text-cream'
                      : 'border-primary text-primary hover:bg-primary hover:text-cream'
                  }`}
                >
                  <Filter className="w-5 h-5" />
                  Filters
                  {(selectedCategories.length + selectedPaymentModes.length + (dateFrom ? 1 : 0) + (dateTo ? 1 : 0)) > 0 && (
                    <span className="px-2 py-0.5 bg-cream/20 rounded-full text-xs font-bold">
                      {selectedCategories.length + selectedPaymentModes.length + (dateFrom ? 1 : 0) + (dateTo ? 1 : 0)}
                    </span>
                  )}
                </button>
                <button
                  onClick={() => alert('Export feature coming soon')}
                  className="flex items-center gap-2 px-6 py-3 border-2 border-sage text-sage font-semibold rounded-xl hover:bg-sage hover:text-white transition-all duration-300"
                >
                  <Download className="w-5 h-5" />
                  Export
                </button>
              </div>

              {showFilters && (
                <div className="bg-cream/50 rounded-xl p-4 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-dark-brown mb-2">
                        Date From
                      </label>
                      <input
                        type="date"
                        value={dateFrom}
                        onChange={(e) => setDateFrom(e.target.value)}
                        className="w-full px-4 py-2 border-2 border-dark-brown/10 rounded-lg focus:border-primary focus:outline-none transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-dark-brown mb-2">
                        Date To
                      </label>
                      <input
                        type="date"
                        value={dateTo}
                        onChange={(e) => setDateTo(e.target.value)}
                        className="w-full px-4 py-2 border-2 border-dark-brown/10 rounded-lg focus:border-primary focus:outline-none transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-dark-brown mb-2">
                      Categories
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {EXPENSE_CATEGORIES.map(cat => (
                        <button
                          key={cat.value}
                          onClick={() => toggleCategory(cat.value)}
                          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                            selectedCategories.includes(cat.value)
                              ? cat.color
                              : 'bg-white border-2 border-dark-brown/10 text-dark-brown hover:border-primary'
                          }`}
                        >
                          {cat.icon} {cat.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-dark-brown mb-2">
                      Payment Mode
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {['cash', 'upi', 'bank_transfer', 'card'].map(mode => (
                        <button
                          key={mode}
                          onClick={() => togglePaymentMode(mode)}
                          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                            selectedPaymentModes.includes(mode)
                              ? 'bg-primary text-cream'
                              : 'bg-white border-2 border-dark-brown/10 text-dark-brown hover:border-primary'
                          }`}
                        >
                          {mode.toUpperCase().replace('_', ' ')}
                        </button>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={resetFilters}
                    className="w-full py-2 text-soft-red font-semibold hover:bg-soft-red/10 rounded-lg transition-all"
                  >
                    Reset All Filters
                  </button>
                </div>
              )}
            </div>
          </div>

          {loading ? (
            <div className="text-center py-12 bg-white/80 backdrop-blur-sm rounded-2xl shadow-soft">
              <p className="text-dark-brown/50">Loading expenses...</p>
            </div>
          ) : filteredExpenses.length === 0 ? (
            <div className="text-center py-12 bg-white/80 backdrop-blur-sm rounded-2xl shadow-soft">
              <p className="text-dark-brown/50 mb-4">No expenses found</p>
              <button
                onClick={() => navigate('/expenses/add')}
                className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white font-semibold rounded-xl hover:scale-105 transition-all duration-300"
              >
                <Plus className="w-5 h-5" />
                Add Your First Expense
              </button>
            </div>
          ) : (
            <>
              <div className="hidden lg:block bg-white/80 backdrop-blur-sm rounded-2xl shadow-soft overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-cream/50 border-b-2 border-primary/10">
                      <tr>
                        <th
                          onClick={() => handleSort('expense_date')}
                          className="px-4 py-4 text-left text-sm font-semibold text-dark-brown cursor-pointer hover:bg-primary/5 transition-colors"
                        >
                          Date {sortField === 'expense_date' && (sortDirection === 'asc' ? '↑' : '↓')}
                        </th>
                        <th className="px-4 py-4 text-left text-sm font-semibold text-dark-brown">
                          Category
                        </th>
                        <th
                          onClick={() => handleSort('amount')}
                          className="px-4 py-4 text-left text-sm font-semibold text-dark-brown cursor-pointer hover:bg-primary/5 transition-colors"
                        >
                          Amount {sortField === 'amount' && (sortDirection === 'asc' ? '↑' : '↓')}
                        </th>
                        <th className="px-4 py-4 text-left text-sm font-semibold text-dark-brown">
                          Paid By
                        </th>
                        <th className="px-4 py-4 text-left text-sm font-semibold text-dark-brown">
                          Payment
                        </th>
                        <th className="px-4 py-4 text-left text-sm font-semibold text-dark-brown">
                          Status
                        </th>
                        <th className="px-4 py-4 text-left text-sm font-semibold text-dark-brown">
                          Bill
                        </th>
                        <th className="px-4 py-4 text-right text-sm font-semibold text-dark-brown">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedExpenses.map((expense, index) => (
                        <>
                          <tr
                            key={expense.id}
                            onClick={() => setExpandedRow(expandedRow === expense.id ? null : expense.id)}
                            className={`border-b border-dark-brown/5 hover:bg-cream/30 transition-colors cursor-pointer ${
                              index % 2 === 0 ? 'bg-white' : 'bg-cream/20'
                            }`}
                          >
                            <td className="px-4 py-4 text-sm text-dark-brown">
                              {format(new Date(expense.expense_date), 'MMM d, yyyy')}
                            </td>
                            <td className="px-4 py-4">
                              <div className="flex items-center gap-2">
                                <span className={`px-2 py-1 rounded-lg text-xs font-semibold ${getCategoryInfo(expense.category).color}`}>
                                  {getCategoryInfo(expense.category).icon} {getCategoryInfo(expense.category).label}
                                </span>
                              </div>
                              {expense.subcategory && (
                                <p className="text-xs text-dark-brown/50 mt-1">{expense.subcategory}</p>
                              )}
                            </td>
                            <td className="px-4 py-4">
                              <p className="text-lg font-bold text-secondary">
                                ₹{expense.amount.toLocaleString('en-IN')}
                              </p>
                            </td>
                            <td className="px-4 py-4">
                              <p className="text-sm font-medium text-dark-brown">
                                {expense.users_paid_by?.name || 'Unknown'}
                              </p>
                            </td>
                            <td className="px-4 py-4">
                              <p className="text-xs font-semibold text-dark-brown uppercase">
                                {expense.payment_mode.replace('_', ' ')}
                              </p>
                            </td>
                            <td className="px-4 py-4">
                              {getStatusBadge(expense.status)}
                            </td>
                            <td className="px-4 py-4">
                              {expense.bill_url ? (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    viewBill(expense);
                                  }}
                                  className="p-2 hover:bg-primary/10 rounded-lg transition-colors"
                                >
                                  <Eye className="w-4 h-4 text-primary" />
                                </button>
                              ) : (
                                <span className="text-xs text-dark-brown/30">No bill</span>
                              )}
                            </td>
                            <td className="px-4 py-4">
                              <div className="flex items-center justify-end gap-2">
                                {isAdmin && expense.status === 'pending' && (
                                  <>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleApprove(expense);
                                      }}
                                      disabled={processingId === expense.id}
                                      className="p-2 hover:bg-sage/10 rounded-lg transition-colors disabled:opacity-50"
                                      title="Approve"
                                    >
                                      <CheckCircle className="w-4 h-4 text-sage" />
                                    </button>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleReject(expense);
                                      }}
                                      disabled={processingId === expense.id}
                                      className="p-2 hover:bg-soft-red/10 rounded-lg transition-colors disabled:opacity-50"
                                      title="Reject"
                                    >
                                      <XCircle className="w-4 h-4 text-soft-red" />
                                    </button>
                                  </>
                                )}
                                {(isAdmin || expense.submitted_by === user?.id) && expense.status === 'pending' && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      navigate(`/expenses/edit/${expense.id}`);
                                    }}
                                    className="p-2 hover:bg-accent/10 rounded-lg transition-colors"
                                    title="Edit"
                                  >
                                    <Edit2 className="w-4 h-4 text-accent" />
                                  </button>
                                )}
                                {isAdmin && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDelete(expense.id);
                                    }}
                                    className="p-2 hover:bg-soft-red/10 rounded-lg transition-colors"
                                    title="Delete"
                                  >
                                    <Trash2 className="w-4 h-4 text-soft-red" />
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                          {expandedRow === expense.id && (
                            <tr className="bg-primary/5">
                              <td colSpan={8} className="px-4 py-4">
                                <div className="space-y-3">
                                  {expense.purpose && (
                                    <div>
                                      <p className="text-xs font-semibold text-dark-brown/60 mb-1">Purpose/Notes</p>
                                      <p className="text-sm text-dark-brown">{expense.purpose}</p>
                                    </div>
                                  )}
                                  {expense.vendors && (
                                    <div>
                                      <p className="text-xs font-semibold text-dark-brown/60 mb-1">Vendor</p>
                                      <p className="text-sm text-dark-brown">{expense.vendors.name}</p>
                                    </div>
                                  )}
                                  {expense.approval_comments && (
                                    <div>
                                      <p className="text-xs font-semibold text-sage mb-1">Approval Comments</p>
                                      <p className="text-sm text-dark-brown">{expense.approval_comments}</p>
                                    </div>
                                  )}
                                  {expense.rejection_reason && (
                                    <div>
                                      <p className="text-xs font-semibold text-soft-red mb-1">Rejection Reason</p>
                                      <p className="text-sm text-dark-brown">{expense.rejection_reason}</p>
                                    </div>
                                  )}
                                  <div className="flex gap-4 text-xs text-dark-brown/50">
                                    <span>Submitted by: {expense.users_submitted_by?.name}</span>
                                    {expense.users_approved_by && (
                                      <span>Approved by: {expense.users_approved_by.name}</span>
                                    )}
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}
                        </>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="lg:hidden space-y-4">
                {paginatedExpenses.map((expense) => (
                  <div
                    key={expense.id}
                    className="bg-white/80 backdrop-blur-sm rounded-xl shadow-soft p-4 hover:shadow-soft-lg transition-all"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className={`px-2 py-1 rounded-lg text-xs font-semibold ${getCategoryInfo(expense.category).color}`}>
                            {getCategoryInfo(expense.category).icon} {getCategoryInfo(expense.category).label}
                          </span>
                          {getStatusBadge(expense.status)}
                        </div>
                        {expense.subcategory && (
                          <p className="text-xs text-dark-brown/50 mb-2">{expense.subcategory}</p>
                        )}
                      </div>
                      <p className="text-2xl font-bold text-secondary">
                        ₹{expense.amount.toLocaleString('en-IN')}
                      </p>
                    </div>

                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-dark-brown/60">Date:</span>
                        <span className="font-medium text-dark-brown">
                          {format(new Date(expense.expense_date), 'MMM d, yyyy')}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-dark-brown/60">Paid by:</span>
                        <span className="font-medium text-dark-brown">
                          {expense.users_paid_by?.name}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-dark-brown/60">Payment:</span>
                        <span className="font-medium text-dark-brown uppercase">
                          {expense.payment_mode.replace('_', ' ')}
                        </span>
                      </div>
                    </div>

                    {expense.purpose && (
                      <div className="mt-3 pt-3 border-t border-dark-brown/10">
                        <p className="text-xs text-dark-brown/60 mb-1">Purpose</p>
                        <p className="text-sm text-dark-brown">{expense.purpose}</p>
                      </div>
                    )}

                    <div className="flex items-center gap-2 mt-4 pt-3 border-t border-dark-brown/10">
                      {expense.bill_url && (
                        <button
                          onClick={() => viewBill(expense)}
                          className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-primary/10 text-primary font-semibold rounded-lg hover:bg-primary/20 transition-colors"
                        >
                          <Eye className="w-4 h-4" />
                          View Bill
                        </button>
                      )}
                      {isAdmin && expense.status === 'pending' && (
                        <>
                          <button
                            onClick={() => handleApprove(expense)}
                            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-sage/10 text-sage font-semibold rounded-lg hover:bg-sage/20 transition-colors"
                          >
                            <CheckCircle className="w-4 h-4" />
                            Approve
                          </button>
                          <button
                            onClick={() => handleReject(expense)}
                            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-soft-red/10 text-soft-red font-semibold rounded-lg hover:bg-soft-red/20 transition-colors"
                          >
                            <XCircle className="w-4 h-4" />
                            Reject
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-soft p-4 mt-6">
                <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-dark-brown/70">Items per page:</span>
                    <select
                      value={itemsPerPage}
                      onChange={(e) => {
                        setItemsPerPage(Number(e.target.value));
                        setCurrentPage(1);
                      }}
                      className="px-3 py-1 border-2 border-dark-brown/10 rounded-lg focus:border-primary focus:outline-none"
                    >
                      <option value="10">10</option>
                      <option value="20">20</option>
                      <option value="50">50</option>
                      <option value="100">100</option>
                    </select>
                    <span className="text-sm text-dark-brown/70">
                      Showing {(currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, filteredExpenses.length)} of {filteredExpenses.length}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                      className="p-2 border-2 border-dark-brown/10 rounded-lg hover:bg-primary/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ChevronLeft className="w-5 h-5 text-dark-brown" />
                    </button>
                    <div className="flex items-center gap-1">
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        let pageNum;
                        if (totalPages <= 5) {
                          pageNum = i + 1;
                        } else if (currentPage <= 3) {
                          pageNum = i + 1;
                        } else if (currentPage >= totalPages - 2) {
                          pageNum = totalPages - 4 + i;
                        } else {
                          pageNum = currentPage - 2 + i;
                        }
                        return (
                          <button
                            key={pageNum}
                            onClick={() => setCurrentPage(pageNum)}
                            className={`w-10 h-10 rounded-lg font-semibold transition-all ${
                              currentPage === pageNum
                                ? 'bg-primary text-cream'
                                : 'border-2 border-dark-brown/10 text-dark-brown hover:bg-primary/10'
                            }`}
                          >
                            {pageNum}
                          </button>
                        );
                      })}
                    </div>
                    <button
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                      className="p-2 border-2 border-dark-brown/10 rounded-lg hover:bg-primary/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ChevronRight className="w-5 h-5 text-dark-brown" />
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {showApprovalModal && selectedExpense && (
        <ApprovalModal
          isOpen={showApprovalModal}
          onClose={() => {
            setShowApprovalModal(false);
            setSelectedExpense(null);
          }}
          onConfirm={confirmApproval}
          type={approvalType}
          expense={selectedExpense}
          loading={processingId === selectedExpense.id}
        />
      )}

      {showBillViewer && selectedExpense && selectedExpense.bill_url && (
        <BillViewer
          isOpen={showBillViewer}
          onClose={() => {
            setShowBillViewer(false);
            setSelectedExpense(null);
          }}
          billUrl={selectedExpense.bill_url}
          expenseDetails={{
            category: selectedExpense.category,
            amount: selectedExpense.amount,
            date: selectedExpense.expense_date,
          }}
        />
      )}
    </div>
  );
}
