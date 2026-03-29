import { useState, useEffect } from 'react';
import { Plus, Users, TrendingUp, BarChart3, List, Edit2, Trash2, CheckCircle, XCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import Header from '../components/Header';
import AddInvestmentModal from '../components/AddInvestmentModal';
import InvestmentCard from '../components/InvestmentCard';
import InvestmentHistory from '../components/InvestmentHistory';
import InvestmentStatistics from '../components/InvestmentStatistics';
import ApprovalModal from '../components/ApprovalModal';
import { format } from 'date-fns';

interface Investment {
  id: string;
  partner_id: string;
  amount: number;
  investment_date: string;
  purpose: string;
  notes: string | null;
  payment_proof_url: string | null;
  status: string;
  submitted_by: string;
  approved_by: string | null;
  users: { name: string; email: string } | null;
  users_submitted_by: { name: string } | null;
  users_approved_by: { name: string } | null;
}

interface PartnerInvestments {
  partner: {
    id: string;
    name: string;
    email: string;
  };
  investments: Investment[];
  total: number;
}

type ViewTab = 'by_partner' | 'all_investments' | 'statistics';

export default function Investments() {
  const { user } = useAuth();
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<ViewTab>('by_partner');
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedPartnerId, setSelectedPartnerId] = useState<string | undefined>();
  const [showHistory, setShowHistory] = useState(false);
  const [selectedPartner, setSelectedPartner] = useState<PartnerInvestments | null>(null);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [approvalType, setApprovalType] = useState<'approve' | 'reject'>('approve');
  const [selectedInvestment, setSelectedInvestment] = useState<Investment | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    fetchInvestments();

    const channel = supabase
      .channel('investments-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'investments' }, () => {
        fetchInvestments();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchInvestments = async () => {
    try {
      const { data, error } = await supabase
        .from('investments')
        .select(`
          *,
          users:partner_id(name, email),
          users_submitted_by:users!investments_submitted_by_fkey(name),
          users_approved_by:users!investments_approved_by_fkey(name)
        `)
        .order('investment_date', { ascending: false });

      if (error) throw error;
      setInvestments(data || []);
    } catch (error) {
      console.error('Error fetching investments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = (investment: Investment) => {
    setSelectedInvestment(investment);
    setApprovalType('approve');
    setShowApprovalModal(true);
  };

  const handleReject = (investment: Investment) => {
    setSelectedInvestment(investment);
    setApprovalType('reject');
    setShowApprovalModal(true);
  };

  const confirmApproval = async (comments?: string, reason?: string) => {
    if (!selectedInvestment || !user) return;

    setProcessingId(selectedInvestment.id);

    try {
      const updateData: any = {
        status: approvalType === 'approve' ? 'approved' : 'rejected',
        approved_by: user.id,
        approved_at: new Date().toISOString(),
      };

      if (approvalType === 'reject' && reason) {
        updateData.rejection_reason = reason;
      }

      const { error: updateError } = await supabase
        .from('investments')
        .update(updateData)
        .eq('id', selectedInvestment.id);

      if (updateError) throw updateError;

      await supabase.from('activity_log').insert({
        user_id: user.id,
        activity_type: approvalType === 'approve' ? 'investment_approved' : 'investment_rejected',
        description: `${user.name} ${approvalType === 'approve' ? 'approved' : 'rejected'} investment: ₹${selectedInvestment.amount.toLocaleString('en-IN')} from ${selectedInvestment.users?.name}`,
      });

      await fetchInvestments();
      setShowApprovalModal(false);
      setSelectedInvestment(null);
    } catch (error) {
      console.error('Error processing approval:', error);
      alert('Failed to process approval. Please try again.');
    } finally {
      setProcessingId(null);
    }
  };

  const handleDelete = async (investmentId: string) => {
    if (!confirm('Are you sure you want to delete this investment? This action cannot be undone.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('investments')
        .delete()
        .eq('id', investmentId);

      if (error) throw error;
      await fetchInvestments();
    } catch (error) {
      console.error('Error deleting investment:', error);
      alert('Failed to delete investment. Please try again.');
    }
  };

  const partnerInvestments: PartnerInvestments[] = investments.reduce((acc, inv) => {
    const partnerId = inv.partner_id;
    const existing = acc.find(p => p.partner.id === partnerId);

    if (existing) {
      existing.investments.push(inv);
      existing.total += inv.amount;
    } else if (inv.users) {
      acc.push({
        partner: {
          id: partnerId,
          name: inv.users.name,
          email: inv.users.email,
        },
        investments: [inv],
        total: inv.amount,
      });
    }

    return acc;
  }, [] as PartnerInvestments[]);

  partnerInvestments.sort((a, b) => b.total - a.total);

  const totalInvestment = investments
    .filter(inv => inv.status === 'approved')
    .reduce((sum, inv) => sum + inv.amount, 0);
  const uniquePartners = new Set(investments.filter(inv => inv.status === 'approved').map(inv => inv.partner_id)).size;
  const avgPerPartner = uniquePartners > 0 ? totalInvestment / uniquePartners : 0;

  const topInvestorId = partnerInvestments.length > 0 ? partnerInvestments[0].partner.id : null;

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
              <h2 className="font-heading text-5xl font-bold text-primary mb-2">
                Investment Tracker
              </h2>
              <p className="text-dark-brown/70 text-lg">
                Track partner investments and grow together
              </p>
            </div>
            <button
              onClick={() => {
                setSelectedPartnerId(undefined);
                setShowAddModal(true);
              }}
              className="flex items-center gap-2 px-6 py-4 bg-gradient-to-r from-accent to-secondary text-white font-semibold rounded-xl shadow-soft hover:shadow-soft-lg transition-all duration-300 hover:scale-105"
            >
              <Plus className="w-5 h-5" />
              Add Investment
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-gradient-to-br from-accent/10 to-accent/5 rounded-xl p-6 border-2 border-accent/30 shadow-soft">
              <div className="flex items-center gap-4 mb-3">
                <div className="w-12 h-12 bg-accent/20 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-accent" />
                </div>
                <span className="text-sm font-semibold text-accent uppercase tracking-wide">Total</span>
              </div>
              <p className="text-4xl font-bold text-accent mb-1">
                ₹{totalInvestment.toLocaleString('en-IN')}
              </p>
              <p className="text-sm text-dark-brown/60">Total Amount Invested</p>
            </div>

            <div className="bg-gradient-to-br from-sage/10 to-sage/5 rounded-xl p-6 border-2 border-sage/30 shadow-soft">
              <div className="flex items-center gap-4 mb-3">
                <div className="w-12 h-12 bg-sage/20 rounded-lg flex items-center justify-center">
                  <Users className="w-6 h-6 text-sage" />
                </div>
                <span className="text-sm font-semibold text-sage uppercase tracking-wide">Partners</span>
              </div>
              <p className="text-4xl font-bold text-sage mb-1">{uniquePartners}</p>
              <p className="text-sm text-dark-brown/60">Partners Invested</p>
            </div>

            <div className="bg-gradient-to-br from-secondary/10 to-secondary/5 rounded-xl p-6 border-2 border-secondary/30 shadow-soft">
              <div className="flex items-center gap-4 mb-3">
                <div className="w-12 h-12 bg-secondary/20 rounded-lg flex items-center justify-center">
                  <BarChart3 className="w-6 h-6 text-secondary" />
                </div>
                <span className="text-sm font-semibold text-secondary uppercase tracking-wide">Average</span>
              </div>
              <p className="text-4xl font-bold text-secondary mb-1">
                ₹{avgPerPartner.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
              </p>
              <p className="text-sm text-dark-brown/60">Per Partner</p>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-soft p-2 mb-6 inline-flex gap-2">
            <button
              onClick={() => setActiveTab('by_partner')}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all duration-300 ${
                activeTab === 'by_partner'
                  ? 'bg-gradient-to-r from-accent to-secondary text-white shadow-soft'
                  : 'text-dark-brown hover:bg-accent/10'
              }`}
            >
              <Users className="w-5 h-5" />
              By Partner
            </button>
            <button
              onClick={() => setActiveTab('all_investments')}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all duration-300 ${
                activeTab === 'all_investments'
                  ? 'bg-gradient-to-r from-accent to-secondary text-white shadow-soft'
                  : 'text-dark-brown hover:bg-accent/10'
              }`}
            >
              <List className="w-5 h-5" />
              All Investments
            </button>
            <button
              onClick={() => setActiveTab('statistics')}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all duration-300 ${
                activeTab === 'statistics'
                  ? 'bg-gradient-to-r from-accent to-secondary text-white shadow-soft'
                  : 'text-dark-brown hover:bg-accent/10'
              }`}
            >
              <BarChart3 className="w-5 h-5" />
              Statistics
            </button>
          </div>

          {loading ? (
            <div className="text-center py-12 bg-white/80 backdrop-blur-sm rounded-2xl shadow-soft">
              <p className="text-dark-brown/50">Loading investments...</p>
            </div>
          ) : activeTab === 'by_partner' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {partnerInvestments.length === 0 ? (
                <div className="col-span-full text-center py-12 bg-white/80 backdrop-blur-sm rounded-2xl shadow-soft">
                  <p className="text-dark-brown/50 mb-4">No investments recorded yet</p>
                  <button
                    onClick={() => setShowAddModal(true)}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-accent to-secondary text-white font-semibold rounded-xl hover:scale-105 transition-all duration-300"
                  >
                    <Plus className="w-5 h-5" />
                    Add First Investment
                  </button>
                </div>
              ) : (
                partnerInvestments.map((partnerInv) => (
                  <InvestmentCard
                    key={partnerInv.partner.id}
                    partner={partnerInv.partner}
                    investments={partnerInv.investments}
                    totalInvestment={partnerInv.total}
                    percentageOfTotal={(partnerInv.total / totalInvestment) * 100}
                    isTopInvestor={partnerInv.partner.id === topInvestorId}
                    onViewAll={() => {
                      setSelectedPartner(partnerInv);
                      setShowHistory(true);
                    }}
                    onAddInvestment={() => {
                      setSelectedPartnerId(partnerInv.partner.id);
                      setShowAddModal(true);
                    }}
                  />
                ))
              )}
            </div>
          ) : activeTab === 'all_investments' ? (
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-soft overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-cream/50 border-b-2 border-accent/10">
                    <tr>
                      <th className="px-4 py-4 text-left text-sm font-semibold text-dark-brown">Date</th>
                      <th className="px-4 py-4 text-left text-sm font-semibold text-dark-brown">Partner</th>
                      <th className="px-4 py-4 text-left text-sm font-semibold text-dark-brown">Amount</th>
                      <th className="px-4 py-4 text-left text-sm font-semibold text-dark-brown">Purpose</th>
                      <th className="px-4 py-4 text-left text-sm font-semibold text-dark-brown">Status</th>
                      <th className="px-4 py-4 text-left text-sm font-semibold text-dark-brown">Added By</th>
                      {isAdmin && <th className="px-4 py-4 text-right text-sm font-semibold text-dark-brown">Actions</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {investments.map((investment, index) => (
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
                          <p className="text-sm font-semibold text-dark-brown">{investment.users?.name}</p>
                          <p className="text-xs text-dark-brown/50">{investment.users?.email}</p>
                        </td>
                        <td className="px-4 py-4">
                          <p className="text-lg font-bold text-accent">
                            ₹{investment.amount.toLocaleString('en-IN')}
                          </p>
                        </td>
                        <td className="px-4 py-4">
                          <p className="text-sm font-medium text-dark-brown">{investment.purpose}</p>
                          {investment.notes && (
                            <p className="text-xs text-dark-brown/50 mt-1 line-clamp-1">{investment.notes}</p>
                          )}
                        </td>
                        <td className="px-4 py-4">{getStatusBadge(investment.status)}</td>
                        <td className="px-4 py-4 text-sm text-dark-brown">
                          {investment.users_submitted_by?.name || 'Unknown'}
                        </td>
                        {isAdmin && (
                          <td className="px-4 py-4">
                            <div className="flex items-center justify-end gap-2">
                              {investment.status === 'pending' && (
                                <>
                                  <button
                                    onClick={() => handleApprove(investment)}
                                    disabled={processingId === investment.id}
                                    className="p-2 hover:bg-sage/10 rounded-lg transition-colors disabled:opacity-50"
                                    title="Approve"
                                  >
                                    <CheckCircle className="w-4 h-4 text-sage" />
                                  </button>
                                  <button
                                    onClick={() => handleReject(investment)}
                                    disabled={processingId === investment.id}
                                    className="p-2 hover:bg-soft-red/10 rounded-lg transition-colors disabled:opacity-50"
                                    title="Reject"
                                  >
                                    <XCircle className="w-4 h-4 text-soft-red" />
                                  </button>
                                </>
                              )}
                              <button
                                onClick={() => handleDelete(investment.id)}
                                className="p-2 hover:bg-soft-red/10 rounded-lg transition-colors"
                                title="Delete"
                              >
                                <Trash2 className="w-4 h-4 text-soft-red" />
                              </button>
                            </div>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <InvestmentStatistics investments={investments} />
          )}
        </div>
      </div>

      {showAddModal && (
        <AddInvestmentModal
          isOpen={showAddModal}
          onClose={() => {
            setShowAddModal(false);
            setSelectedPartnerId(undefined);
          }}
          onSuccess={fetchInvestments}
          preselectedPartnerId={selectedPartnerId}
        />
      )}

      {showHistory && selectedPartner && (
        <InvestmentHistory
          isOpen={showHistory}
          onClose={() => {
            setShowHistory(false);
            setSelectedPartner(null);
          }}
          partner={selectedPartner.partner}
          investments={selectedPartner.investments}
        />
      )}

      {showApprovalModal && selectedInvestment && (
        <ApprovalModal
          isOpen={showApprovalModal}
          onClose={() => {
            setShowApprovalModal(false);
            setSelectedInvestment(null);
          }}
          onConfirm={confirmApproval}
          type={approvalType}
          expense={{
            category: selectedInvestment.purpose,
            subcategory: selectedInvestment.notes,
            amount: selectedInvestment.amount,
            expense_date: selectedInvestment.investment_date,
            payment_mode: 'Investment',
          }}
          loading={processingId === selectedInvestment.id}
        />
      )}
    </div>
  );
}
