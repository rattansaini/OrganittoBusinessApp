import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Printer, ArrowLeft } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { format } from 'date-fns';
import { PageLoader } from '../components/LoadingState';

interface OrderItem {
  id: string;
  product_name: string;
  sku: string | null;
  quantity: number;
  unit_price: number;
  total_price: number;
}

interface OrderData {
  id: string;
  order_number: string;
  customer_name: string | null;
  customer_email: string | null;
  total_amount: number;
  order_date: string;
  sales_order_items: OrderItem[];
}

interface InvoiceData {
  invoice_number: string;
  invoice_date: string;
  billing_state: string;
  gst_rate: number;
}

interface BusinessSettings {
  business_name: string;
  brand_name: string;
  gstin: string | null;
  address_line1: string | null;
  address_line2: string | null;
  city: string | null;
  state: string;
  pincode: string | null;
}

export default function InvoiceDetail() {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const [order, setOrder] = useState<OrderData | null>(null);
  const [invoice, setInvoice] = useState<InvoiceData | null>(null);
  const [settings, setSettings] = useState<BusinessSettings | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (orderId) fetchData(orderId);
  }, [orderId]);

  const fetchData = async (id: string) => {
    setLoading(true);
    try {
      const [orderRes, invoiceRes, settingsRes] = await Promise.all([
        supabase.from('sales_orders').select('*, sales_order_items(*)').eq('id', id).maybeSingle(),
        supabase.from('invoices').select('invoice_number, invoice_date, billing_state, gst_rate').eq('order_id', id).maybeSingle(),
        supabase.from('business_settings').select('*').limit(1).maybeSingle(),
      ]);

      setOrder(orderRes.data);
      setInvoice(invoiceRes.data);
      setSettings(settingsRes.data);
    } catch (error) {
      console.error('Error fetching invoice:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <PageLoader label="Loading invoice..." />;
  }

  if (!order || !invoice || !settings) {
    return (
      <div className="p-12 text-center text-dark-brown/60">
        Invoice not found. Go back to Invoices and generate it first.
      </div>
    );
  }

  const gstRate = Number(invoice.gst_rate);
  const total = Number(order.total_amount);
  const subtotal = total / (1 + gstRate / 100);
  const taxAmount = total - subtotal;
  const sameState = invoice.billing_state?.trim().toLowerCase() === settings.state?.trim().toLowerCase();
  const cgst = sameState ? taxAmount / 2 : 0;
  const sgst = sameState ? taxAmount / 2 : 0;
  const igst = sameState ? 0 : taxAmount;

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6 print:hidden">
        <button
          onClick={() => navigate('/invoices')}
          className="flex items-center gap-2 text-dark-brown hover:text-primary transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Invoices
        </button>
        <button
          onClick={() => window.print()}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white font-medium bg-gradient-to-b from-[#3B6720] to-[#2A4B14] border border-[#1E3A0D] shadow-[inset_0_1px_0_rgba(255,255,255,.2)] shadow-e1 hover:-translate-y-[1px] transition-transform"
        >
          <Printer className="w-4 h-4" />
          Print / Save as PDF
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-soft-lg p-8 md:p-12">
        <div className="flex items-start justify-between mb-8 pb-8 border-b-2 border-primary/10">
          <div>
            <h1 className="font-heading text-3xl font-bold text-primary mb-1">{settings.brand_name}</h1>
            <p className="text-dark-brown/70 text-sm">{settings.business_name}</p>
            {settings.address_line1 && <p className="text-dark-brown/60 text-sm">{settings.address_line1}</p>}
            {settings.address_line2 && <p className="text-dark-brown/60 text-sm">{settings.address_line2}</p>}
            <p className="text-dark-brown/60 text-sm">
              {[settings.city, settings.state, settings.pincode].filter(Boolean).join(', ')}
            </p>
            {settings.gstin && <p className="text-dark-brown/60 text-sm mt-1">GSTIN: {settings.gstin}</p>}
          </div>
          <div className="text-right">
            <h2 className="font-heading text-2xl font-bold text-dark-brown mb-1">TAX INVOICE</h2>
            <p className="text-dark-brown/70 text-sm">Invoice #: {invoice.invoice_number}</p>
            <p className="text-dark-brown/70 text-sm">
              Date: {format(new Date(invoice.invoice_date), 'MMM d, yyyy')}
            </p>
            <p className="text-dark-brown/70 text-sm">Order #: {order.order_number}</p>
          </div>
        </div>

        <div className="mb-8">
          <p className="text-xs font-semibold text-dark-brown/50 uppercase mb-1">Billed To</p>
          <p className="font-semibold text-dark-brown">{order.customer_name || 'Customer'}</p>
          {order.customer_email && <p className="text-dark-brown/60 text-sm">{order.customer_email}</p>}
          <p className="text-dark-brown/60 text-sm">Place of Supply: {invoice.billing_state}</p>
        </div>

        <table className="w-full mb-8">
          <thead>
            <tr className="border-b-2 border-primary/10 text-left">
              <th className="py-3 text-body font-normal text-dark-brown/70">Item</th>
              <th className="py-3 text-body font-normal text-dark-brown/70">SKU</th>
              <th className="py-3 text-sm font-semibold text-dark-brown/70 text-right">Qty</th>
              <th className="py-3 text-sm font-semibold text-dark-brown/70 text-right">Unit Price</th>
              <th className="py-3 text-sm font-semibold text-dark-brown/70 text-right">Amount</th>
            </tr>
          </thead>
          <tbody>
            {order.sales_order_items.map((item) => (
              <tr key={item.id} className="border-b border-primary/5">
                <td className="py-3 text-dark-brown">{item.product_name}</td>
                <td className="py-3 text-dark-brown/60 text-sm">{item.sku || '—'}</td>
                <td className="py-3 text-right text-dark-brown">{item.quantity}</td>
                <td className="py-3 text-right text-dark-brown">
                  ₹{Number(item.unit_price).toLocaleString('en-IN')}
                </td>
                <td className="py-3 text-right text-dark-brown">
                  ₹{Number(item.total_price).toLocaleString('en-IN')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="flex justify-end">
          <div className="w-full max-w-xs space-y-2">
            <div className="flex justify-between text-dark-brown/70 text-sm">
              <span>Taxable Value</span>
              <span>₹{subtotal.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
            </div>
            {sameState ? (
              <>
                <div className="flex justify-between text-dark-brown/70 text-sm">
                  <span>CGST ({(gstRate / 2).toFixed(1)}%)</span>
                  <span>₹{cgst.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between text-dark-brown/70 text-sm">
                  <span>SGST ({(gstRate / 2).toFixed(1)}%)</span>
                  <span>₹{sgst.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
                </div>
              </>
            ) : (
              <div className="flex justify-between text-dark-brown/70 text-sm">
                <span>IGST ({gstRate.toFixed(1)}%)</span>
                <span>₹{igst.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-primary text-lg pt-2 border-t-2 border-primary/10">
              <span>Total</span>
              <span>₹{total.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
            </div>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-primary/10 text-xs text-dark-brown/50">
          <p>This is a computer-generated invoice. GST computed on the assumption that the order total is tax-inclusive.</p>
        </div>
      </div>
    </div>
  );
}
