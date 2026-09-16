import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, Receipt } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { format } from 'date-fns';
import StatsCard from '../components/StatsCard';
import { TableSkeleton } from '../components/LoadingState';
import AdminOnly from '../components/AdminOnly';

interface OrderRow {
  id: string;
  order_number: string;
  channel: string;
  customer_name: string | null;
  customer_phone: string | null;
  shipping_state: string | null;
  total_amount: number;
  order_date: string;
}

const CHANNEL_LABELS: Record<string, string> = {
  shopify: 'Website',
  amazon: 'Amazon',
  nykaa: 'Nykaa',
  flipkart: 'Flipkart',
  myntra: 'Myntra',
  other: 'Other',
};

const CHANNEL_COLORS: Record<string, string> = {
  shopify: 'bg-primary/20 text-primary',
  amazon: 'bg-accent/20 text-accent',
  nykaa: 'bg-secondary/20 text-secondary',
  flipkart: 'bg-sage/20 text-sage',
  myntra: 'bg-soft-red/20 text-soft-red',
  other: 'bg-dark-brown/20 text-dark-brown',
};

interface InvoiceRow {
  order_id: string;
  invoice_number: string;
}

export default function Invoices() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [invoiceMap, setInvoiceMap] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [generatingId, setGeneratingId] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [ordersRes, invoicesRes] = await Promise.all([
        supabase.from('sales_orders').select('id, order_number, channel, customer_name, customer_phone, shipping_state, total_amount, order_date').order('order_date', { ascending: false }),
        supabase.from('invoices').select('order_id, invoice_number'),
      ]);

      setOrders(ordersRes.data || []);
      const map: Record<string, string> = {};
      (invoicesRes.data as InvoiceRow[] | null)?.forEach((inv) => {
        map[inv.order_id] = inv.invoice_number;
      });
      setInvoiceMap(map);
    } catch (error) {
      console.error('Error fetching invoices:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateInvoice = async (orderId: string) => {
    setGeneratingId(orderId);
    try {
      const { data: settings, error: settingsError } = await supabase
        .from('business_settings')
        .select('id, invoice_prefix, next_invoice_number, state, default_gst_rate')
        .limit(1)
        .maybeSingle();

      if (settingsError) throw settingsError;
      if (!settings) throw new Error('Business settings not found');

      const invoiceNumber = `${settings.invoice_prefix}-${String(settings.next_invoice_number).padStart(4, '0')}`;
      const order = orders.find((o) => o.id === orderId);
      const billingState = order?.shipping_state || settings.state;

      const { error: insertError } = await supabase.from('invoices').insert({
        order_id: orderId,
        invoice_number: invoiceNumber,
        billing_state: billingState,
        gst_rate: settings.default_gst_rate,
      });

      if (insertError) throw insertError;

      await supabase
        .from('business_settings')
        .update({ next_invoice_number: settings.next_invoice_number + 1 })
        .eq('id', settings.id);

      navigate(`/invoices/${orderId}`);
    } catch (error) {
      console.error('Error generating invoice:', error);
    } finally {
      setGeneratingId(null);
    }
  };

  const totalInvoiced = orders
    .filter((o) => invoiceMap[o.id])
    .reduce((sum, o) => sum + Number(o.total_amount), 0);

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <h2 className="font-heading text-4xl md:text-5xl font-bold text-primary mb-2">GST Invoices</h2>
        <p className="text-dark-brown/70 text-lg">Generate a GST-compliant invoice for any Shopify order</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <StatsCard
          title="Orders"
          value={orders.length.toString()}
          icon={Receipt}
          iconBgColor="bg-primary/20"
          iconColor="text-primary"
          valueColor="text-primary"
        />
        <StatsCard
          title="Invoiced Amount"
          value={`₹${totalInvoiced.toLocaleString('en-IN')}`}
          icon={FileText}
          iconBgColor="bg-accent/20"
          iconColor="text-accent"
          valueColor="text-dark-brown"
        />
      </div>

      <div className="bg-panel border border-edge rounded-2xl shadow-e2 overflow-hidden">
        {loading ? (
          <TableSkeleton rows={6} columns={5} />
        ) : orders.length === 0 ? (
          <div className="p-12 text-center text-dark-brown/60">No orders synced yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-primary/10 text-left">
                  <th className="px-6 py-4 text-sm font-semibold text-dark-brown/70">Order</th>
                  <th className="px-6 py-4 text-sm font-semibold text-dark-brown/70">Source</th>
                  <th className="px-6 py-4 text-sm font-semibold text-dark-brown/70">Customer</th>
                  <th className="px-6 py-4 text-sm font-semibold text-dark-brown/70">Date</th>
                  <th className="px-6 py-4 text-sm font-semibold text-dark-brown/70 text-right">Amount</th>
                  <th className="px-6 py-4 text-sm font-semibold text-dark-brown/70">Invoice</th>
                  <th className="px-6 py-4 text-sm font-semibold text-dark-brown/70 text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => (
                  <tr key={o.id} className="border-b border-primary/5 hover:bg-cream/60 transition-colors">
                    <td className="px-6 py-4 font-semibold text-primary">{o.order_number}</td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${CHANNEL_COLORS[o.channel] || 'bg-dark-brown/20 text-dark-brown'}`}>
                        {CHANNEL_LABELS[o.channel] || o.channel}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-dark-brown">
                      <div>{o.customer_name || '—'}</div>
                      {o.customer_phone && <div className="text-xs text-dark-brown/50">{o.customer_phone}</div>}
                    </td>
                    <td className="px-6 py-4 text-dark-brown/70">{format(new Date(o.order_date), 'MMM d, yyyy')}</td>
                    <td className="px-6 py-4 text-right font-semibold text-dark-brown">
                      ₹{Number(o.total_amount).toLocaleString('en-IN')}
                    </td>
                    <td className="px-6 py-4 text-dark-brown/70">{invoiceMap[o.id] || '—'}</td>
                    <td className="px-6 py-4 text-right">
                      {invoiceMap[o.id] ? (
                        <button
                          onClick={() => navigate(`/invoices/${o.id}`)}
                          className="px-3 py-1.5 bg-white border-2 border-primary/10 text-dark-brown rounded-lg text-sm font-medium hover:border-primary/30 transition-all duration-300"
                        >
                          View Invoice
                        </button>
                      ) : (
                        <AdminOnly>
                          <button
                            onClick={() => generateInvoice(o.id)}
                            disabled={generatingId === o.id}
                            className="px-3 py-1.5 rounded-lg text-sm text-white font-medium bg-gradient-to-b from-[#3B6720] to-[#2A4B14] border border-[#1E3A0D] shadow-[inset_0_1px_0_rgba(255,255,255,.2)] hover:-translate-y-[1px] transition-transform disabled:opacity-50 disabled:hover:translate-y-0"
                          >
                            {generatingId === o.id ? 'Generating...' : 'Generate Invoice'}
                          </button>
                        </AdminOnly>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <p className="text-sm text-dark-brown/50 mt-6">
        GST is calculated assuming Shopify order totals are inclusive of tax, split as CGST + SGST when the
        customer's shipping state matches Organitto's registered state (Haryana), or IGST otherwise. The
        customer's actual shipping state from Shopify is used automatically when available.
      </p>
    </div>
  );
}
