import { useEffect, useState } from 'react';
import { Plus, FileText, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface VendorInvoicesTabProps {
  vendorId: string;
}

export default function VendorInvoicesTab({ vendorId }: VendorInvoicesTabProps) {
  const [invoices, setInvoices] = useState<any[]>([]);

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

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h3 className="font-heading text-xl font-bold text-primary">Invoice Management</h3>
        <button className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-primary to-sage text-white rounded-xl font-semibold hover:shadow-soft-lg transition-all">
          <Plus className="w-5 h-5" />
          Upload Invoice
        </button>
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
                        Invoice #{invoice.invoice_number}
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
                    <button className="px-4 py-2 bg-sage/10 hover:bg-sage/20 text-sage rounded-lg font-semibold transition-colors">
                      Mark as Paid
                    </button>
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
            <button className="px-6 py-3 bg-gradient-to-r from-primary to-sage text-white rounded-xl font-semibold hover:shadow-soft-lg transition-all">
              Upload Invoice
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
