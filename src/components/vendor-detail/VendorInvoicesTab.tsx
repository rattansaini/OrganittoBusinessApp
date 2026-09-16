import { useEffect, useState } from 'react';
import { Plus, FileText, AlertCircle, CheckCircle, Clock, X, Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import AdminOnly from '../AdminOnly';

interface VendorInvoicesTabProps {
  vendorId: string;
}

export default function VendorInvoicesTab({ vendorId }: VendorInvoicesTabProps) {
  const { user } = useAuth();
  const toast = useToast();
  const [invoices, setInvoices] = useState<any[]>([]);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [markingPaidId, setMarkingPaidId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    invoice_number: '',
    date: new Date().toISOString().split('T')[0],
    due_date: new Date().toISOString().split('T')[0],
    amount: '',
    status: 'pending',
    notes: '',
  });
  const [file, setFile] = useState<File | null>(null);

  useEffect(() => {
    fetchInvoices();
  }, [vendorId]);

  const fetchInvoices = async () => {
    try {
      const { data, error } = await supabase
        .from('vendor_invoices')
        .select('*')
        .eq('vendor_id', vendorId)
        .order('date', { ascending: false });

      if (error) throw error;
      setInvoices(data || []);
    } catch (error) {
      console.error('Error fetching invoices:', error);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid':
        return <CheckCircle className="w-5 h-5 text-sage" />;
      case 'overdue':
        return <AlertCircle className="w-5 h-5 text-soft-red" />;
      default:
        return <Clock className="w-5 h-5 text-accent" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-sage/10 text-sage';
      case 'overdue':
        return 'bg-soft-red/10 text-soft-red';
      default:
        return 'bg-accent/10 text-accent';
    }
  };

  const totalInvoices = invoices.reduce((sum, inv) => sum + parseFloat(inv.amount), 0);
  const paidInvoices = invoices.filter(inv => inv.status === 'paid').reduce((sum, inv) => sum + parseFloat(inv.amount), 0);
  const pendingInvoices = invoices.filter(inv => inv.status === 'pending').reduce((sum, inv) => sum + parseFloat(inv.amount), 0);
  const overdueInvoices = invoices.filter(inv => inv.status === 'overdue').reduce((sum, inv) => sum + parseFloat(inv.amount), 0);

  const resetForm = () => {
    setFormData({
      invoice_number: '',
      date: new Date().toISOString().split('T')[0],
      due_date: new Date().toISOString().split('T')[0],
      amount: '',
      status: 'pending',
      notes: '',
    });
    setFile(null);
  };

  const handleSubmit = async () => {
    if (!user) return;
    if (!formData.invoice_number || !formData.amount) {
      toast.error('Please fill in invoice number and amount.');
      return;
    }

    setSaving(true);
    try {
      let invoiceUrl: string | null = null;

      if (file) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${vendorId}/${Date.now()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage
          .from('vendor-invoices')
          .upload(fileName, file);
        if (uploadError) throw uploadError;
        const { data } = supabase.storage.from('vendor-invoices').getPublicUrl(fileName);
        invoiceUrl = data.publicUrl;
      }

      const { error: insertError } = await supabase.from('vendor_invoices').insert({
        vendor_id: vendorId,
        invoice_number: formData.invoice_number,
        date: formData.date,
        due_date: formData.due_date,
        amount: parseFloat(formData.amount),
        status: formData.status,
        notes: formData.notes || null,
        invoice_url: invoiceUrl,
      });

      if (insertError) throw insertError;

      await fetchInvoices();
      setShowUploadModal(false);
      resetForm();
    } catch (error) {
      console.error('Error uploading invoice:', error);
      toast.error('Failed to upload invoice. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleMarkPaid = async (invoiceId: string, amount: number) => {
    setMarkingPaidId(invoiceId);
    try {
      const { error } = await supabase
        .from('vendor_invoices')
        .update({
          status: 'paid',
          paid_date: new Date().toISOString().split('T')[0],
          paid_amount: amount,
        })
        .eq('id', invoiceId);

      if (error) throw error;
      await fetchInvoices();
    } catch (error) {
      console.error('Error marking invoice as paid:', error);
      toast.error('Failed to update invoice. Please try again.');
    } finally {
      setMarkingPaidId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h3 className="font-heading text-xl font-bold text-primary">Invoice Management</h3>
        <AdminOnly>
          <button
            onClick={() => setShowUploadModal(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-white font-semibold bg-gradient-to-b from-[#3B6720] to-[#2A4B14] border border-[#1E3A0D] shadow-[inset_0_1px_0_rgba(255,255,255,.2)] shadow-e1 hover:-translate-y-[1px] transition-transform"
          >
            <Plus className="w-5 h-5" />
            Upload Invoice
          </button>
        </AdminOnly>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-cream/50 rounded-xl p-4">
          <p className="text-sm text-dark-brown/60 mb-1">Total Invoices</p>
          <p className="text-2xl font-bold text-primary">₹{totalInvoices.toFixed(0)}</p>
          <p className="text-xs text-dark-brown/60 mt-1">{invoices.length} invoices</p>
        </div>

        <div className="bg-sage/10 rounded-xl p-4">
          <p className="text-sm text-dark-brown/60 mb-1">Paid</p>
          <p className="text-2xl font-bold text-sage">₹{paidInvoices.toFixed(0)}</p>
          <p className="text-xs text-dark-brown/60 mt-1">
            {invoices.filter(inv => inv.status === 'paid').length} invoices
          </p>
        </div>

        <div className="bg-accent/10 rounded-xl p-4">
          <p className="text-sm text-dark-brown/60 mb-1">Pending</p>
          <p className="text-2xl font-bold text-accent">₹{pendingInvoices.toFixed(0)}</p>
          <p className="text-xs text-dark-brown/60 mt-1">
            {invoices.filter(inv => inv.status === 'pending').length} invoices
          </p>
        </div>

        <div className="bg-soft-red/10 rounded-xl p-4">
          <p className="text-sm text-dark-brown/60 mb-1">Overdue</p>
          <p className="text-2xl font-bold text-soft-red">₹{overdueInvoices.toFixed(0)}</p>
          <p className="text-xs text-dark-brown/60 mt-1">
            {invoices.filter(inv => inv.status === 'overdue').length} invoices
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {invoices.length > 0 ? (
          invoices.map(invoice => (
            <div
              key={invoice.id}
              className="bg-white border-2 border-dark-brown/5 rounded-xl p-6 hover:shadow-soft transition-all"
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <FileText className="w-6 h-6 text-primary" />
                    <div>
                      <h4 className="font-heading text-lg font-bold text-primary">
                        {invoice.invoice_url ? (
                          <a
                            href={invoice.invoice_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hover:underline"
                          >
                            Invoice #{invoice.invoice_number}
                          </a>
                        ) : (
                          <>Invoice #{invoice.invoice_number}</>
                        )}
                      </h4>
                      <p className="text-sm text-dark-brown/60">
                        Date: {new Date(invoice.date).toLocaleDateString()} |
                        Due: {new Date(invoice.due_date).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  {invoice.notes && (
                    <p className="text-sm text-dark-brown/70 mt-2">{invoice.notes}</p>
                  )}
                </div>

                <div className="flex flex-col items-end gap-3">
                  <div className="text-right">
                    <p className="text-sm text-dark-brown/60">Amount</p>
                    <p className="text-2xl font-bold text-primary">₹{parseFloat(invoice.amount).toFixed(2)}</p>
                  </div>

                  <div className="flex items-center gap-2">
                    {getStatusIcon(invoice.status)}
                    <span className={`px-3 py-1 rounded-full text-sm font-bold ${getStatusColor(invoice.status)}`}>
                      {invoice.status}
                    </span>
                  </div>

                  {invoice.status !== 'paid' && (
                    <AdminOnly>
                      <button
                        onClick={() => handleMarkPaid(invoice.id, parseFloat(invoice.amount))}
                        disabled={markingPaidId === invoice.id}
                        className="px-4 py-2 bg-sage/10 hover:bg-sage/20 text-sage rounded-lg font-semibold transition-colors disabled:opacity-50"
                      >
                        {markingPaidId === invoice.id ? 'Updating...' : 'Mark as Paid'}
                      </button>
                    </AdminOnly>
                  )}
                </div>
              </div>

              {invoice.paid_date && (
                <div className="mt-4 pt-4 border-t border-dark-brown/5">
                  <p className="text-sm text-dark-brown/60">
                    Paid on: {new Date(invoice.paid_date).toLocaleDateString()} |
                    Amount: ₹{parseFloat(invoice.paid_amount).toFixed(2)}
                  </p>
                </div>
              )}
            </div>
          ))
        ) : (
          <div className="text-center py-12 bg-white border-2 border-dark-brown/5 rounded-xl">
            <FileText className="w-16 h-16 text-dark-brown/20 mx-auto mb-4" />
            <h3 className="font-heading text-xl font-bold text-dark-brown/60 mb-2">
              No invoices found
            </h3>
            <p className="text-dark-brown/40 mb-4">Upload your first invoice to get started</p>
            <AdminOnly>
              <button
                onClick={() => setShowUploadModal(true)}
                className="px-6 py-3 rounded-xl text-white font-semibold bg-gradient-to-b from-[#3B6720] to-[#2A4B14] border border-[#1E3A0D] shadow-[inset_0_1px_0_rgba(255,255,255,.2)] shadow-e1 hover:-translate-y-[1px] transition-transform"
              >
                Upload Invoice
              </button>
            </AdminOnly>
          </div>
        )}
      </div>

      {showUploadModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-soft-lg max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-heading text-xl font-bold text-primary">Upload Invoice</h3>
              <button
                onClick={() => { setShowUploadModal(false); resetForm(); }}
                className="p-2 hover:bg-dark-brown/5 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-dark-brown" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-body font-normal text-dark-brown mb-2">Invoice Number *</label>
                <input
                  type="text"
                  value={formData.invoice_number}
                  onChange={(e) => setFormData({ ...formData, invoice_number: e.target.value })}
                  className="w-full px-4 py-2 border-2 border-dark-brown/10 rounded-lg focus:border-primary focus:outline-none"
                  placeholder="e.g. 143/25-26"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-body font-normal text-dark-brown mb-2">Invoice Date *</label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full px-4 py-2 border-2 border-dark-brown/10 rounded-lg focus:border-primary focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-body font-normal text-dark-brown mb-2">Due Date *</label>
                  <input
                    type="date"
                    value={formData.due_date}
                    onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                    className="w-full px-4 py-2 border-2 border-dark-brown/10 rounded-lg focus:border-primary focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-body font-normal text-dark-brown mb-2">Amount (₹) *</label>
                  <input
                    type="number"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    className="w-full px-4 py-2 border-2 border-dark-brown/10 rounded-lg focus:border-primary focus:outline-none"
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="block text-body font-normal text-dark-brown mb-2">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-4 py-2 border-2 border-dark-brown/10 rounded-lg focus:border-primary focus:outline-none"
                  >
                    <option value="pending">Pending</option>
                    <option value="paid">Paid</option>
                    <option value="overdue">Overdue</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-body font-normal text-dark-brown mb-2">Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-4 py-2 border-2 border-dark-brown/10 rounded-lg focus:border-primary focus:outline-none"
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-body font-normal text-dark-brown mb-2">Invoice File (PDF/Image)</label>
                <input
                  type="file"
                  accept="image/*,.pdf"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                  className="w-full px-4 py-2 border-2 border-dark-brown/10 rounded-lg focus:border-primary focus:outline-none"
                />
              </div>

              <button
                onClick={handleSubmit}
                disabled={saving}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-white font-semibold bg-gradient-to-b from-[#3B6720] to-[#2A4B14] border border-[#1E3A0D] shadow-[inset_0_1px_0_rgba(255,255,255,.2)] shadow-e1 hover:-translate-y-[1px] transition-transform disabled:opacity-50 disabled:hover:translate-y-0"
              >
                {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />}
                {saving ? 'Uploading...' : 'Save Invoice'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
