import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, Receipt } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { format } from 'date-fns';
import Header from '../components/Header';
import StatsCard from '../components/StatsCard';

interface OrderRow {
  id: string;
  order_number: string;
  customer_name: string | null;
  customer_phone: string | null;
  shipping_state: string | null;
  total_amount: number;
  order_date: string;
}

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
        supabase.from('sales_orders').select('id, order_number, customer_name, customer_phone, shipping_state, total_amount, order_date').order('order_date', { ascending: false }),
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

          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-soft-lg overflow-hidden">
            {loading ? (
              <div className="p-12 text-center text-dark-brown/60">Loading orders...</div>
            ) : orders.length === 0 ? (
              <div className="p-12 text-center text-dark-brown/60">No orders synced yet.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b-2 border-primary/10 text-left">
                      <th className="px-6 py-4 text-sm font-semibold text-dark-brown/70">Order</th>
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
                            <button
                              onClick={() => generateInvoice(o.id)}
                              disabled={generatingId === o.id}
                              className="px-3 py-1.5 bg-primary text-cream rounded-lg text-sm font-medium hover:bg-primary/90 transition-all duration-300 disabled:opacity-50"
                            >
                              {generatingId === o.id ? 'Generating...' : 'Generate Invoice'}
                            </button>
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
      </div>
    </div>
  );
}
