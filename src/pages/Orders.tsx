import { Fragment, useEffect, useMemo, useState } from 'react';
import { ShoppingBag, Package, IndianRupee, RefreshCw, Plus, X, Save } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { format } from 'date-fns';
import Header from '../components/Header';
import StatsCard from '../components/StatsCard';

interface OrderItem {
  id: string;
  product_name: string;
  sku: string | null;
  quantity: number;
  unit_price: number;
  total_price: number;
}

interface SalesOrder {
  id: string;
  channel: string;
  order_number: string;
  customer_name: string | null;
  customer_email: string | null;
  customer_phone: string | null;
  total_amount: number;
  currency: string;
  financial_status: string | null;
  fulfillment_status: string | null;
  order_date: string;
  sales_order_items: OrderItem[];
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

const statusColor = (status: string | null) => {
  const s = (status || '').toLowerCase();
  if (s === 'paid' || s === 'fulfilled') return 'bg-sage/20 text-sage';
  if (s === 'pending' || s === 'partial') return 'bg-accent/20 text-accent';
  if (s === 'refunded' || s === 'cancelled') return 'bg-soft-red/20 text-soft-red';
  return 'bg-dark-brown/10 text-dark-brown/70';
};

export default function Orders() {
  const [orders, setOrders] = useState<SalesOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [channelFilter, setChannelFilter] = useState<string>('all');
  const [showAddForm, setShowAddForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [newOrder, setNewOrder] = useState({
    channel: 'amazon',
    order_number: '',
    customer_name: '',
    customer_phone: '',
    order_date: format(new Date(), 'yyyy-MM-dd'),
    total_amount: '',
  });

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('sales_orders')
        .select('*, sales_order_items(*)')
        .order('order_date', { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const addManualOrder = async () => {
    if (!newOrder.order_number.trim() || !newOrder.total_amount) return;
    setSaving(true);
    try {
      const { error } = await supabase.from('sales_orders').insert({
        channel: newOrder.channel,
        order_number: newOrder.order_number.trim(),
        customer_name: newOrder.customer_name.trim() || null,
        customer_phone: newOrder.customer_phone.trim() || null,
        total_amount: parseFloat(newOrder.total_amount),
        currency: 'INR',
        financial_status: 'paid',
        fulfillment_status: 'fulfilled',
        order_date: newOrder.order_date,
      });

      if (error) throw error;
      setNewOrder({
        channel: 'amazon',
        order_number: '',
        customer_name: '',
        customer_phone: '',
        order_date: format(new Date(), 'yyyy-MM-dd'),
        total_amount: '',
      });
      setShowAddForm(false);
      await fetchOrders();
    } catch (error) {
      console.error('Error adding order:', error);
    } finally {
      setSaving(false);
    }
  };

  const filteredOrders = channelFilter === 'all' ? orders : orders.filter((o) => o.channel === channelFilter);

  const totalRevenue = filteredOrders.reduce((sum, o) => sum + Number(o.total_amount), 0);
  const totalItems = filteredOrders.reduce(
    (sum, o) => sum + o.sales_order_items.reduce((s, i) => s + i.quantity, 0),
    0
  );

  const channelTotals = useMemo(() => {
    const totals: Record<string, number> = {};
    orders.forEach((o) => {
      totals[o.channel] = (totals[o.channel] || 0) + Number(o.total_amount);
    });
    return totals;
  }, [orders]);

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
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="font-heading text-4xl md:text-5xl font-bold text-primary mb-2">
                Sales Orders
              </h2>
              <p className="text-dark-brown/70 text-lg">From your website and marketplaces</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowAddForm(!showAddForm)}
                className="flex items-center gap-2 px-4 py-2.5 bg-primary text-cream rounded-xl font-medium hover:bg-primary/90 transition-all duration-300 shadow-soft"
              >
                <Plus className="w-4 h-4" />
                Add Order
              </button>
              <button
                onClick={fetchOrders}
                className="flex items-center gap-2 px-4 py-2.5 bg-white/80 border-2 border-primary/10 rounded-xl text-dark-brown hover:border-primary/30 transition-all duration-300"
              >
                <RefreshCw className="w-4 h-4" />
                Refresh
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <StatsCard
              title="Total Revenue"
              value={`₹${totalRevenue.toLocaleString('en-IN')}`}
              icon={IndianRupee}
              iconBgColor="bg-primary/20"
              iconColor="text-primary"
              valueColor="text-primary"
            />
            <StatsCard
              title="Total Orders"
              value={filteredOrders.length.toString()}
              icon={ShoppingBag}
              iconBgColor="bg-accent/20"
              iconColor="text-accent"
              valueColor="text-dark-brown"
            />
            <StatsCard
              title="Items Sold"
              value={totalItems.toString()}
              icon={Package}
              iconBgColor="bg-sage/20"
              iconColor="text-sage"
              valueColor="text-dark-brown"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 mb-8">
            <button
              onClick={() => setChannelFilter('all')}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-300 ${
                channelFilter === 'all' ? 'bg-primary text-cream' : 'bg-white/80 border-2 border-primary/10 text-dark-brown'
              }`}
            >
              All Channels
            </button>
            {Object.entries(channelTotals).map(([channel, amount]) => (
              <button
                key={channel}
                onClick={() => setChannelFilter(channel)}
                className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-300 ${
                  channelFilter === channel ? 'bg-primary text-cream' : `${CHANNEL_COLORS[channel] || 'bg-dark-brown/20 text-dark-brown'}`
                }`}
              >
                {CHANNEL_LABELS[channel] || channel}: ₹{amount.toLocaleString('en-IN')}
              </button>
            ))}
          </div>

          {showAddForm && (
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-soft-lg p-6 mb-8 border-2 border-primary/10">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-heading text-xl font-bold text-primary">Add Order</h3>
                <button onClick={() => setShowAddForm(false)} className="text-dark-brown/60 hover:text-dark-brown">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <p className="text-sm text-dark-brown/60 mb-4">
                For orders placed on Amazon, Nykaa, Flipkart, Myntra or other channels that aren't auto-synced.
                Website orders sync automatically from Shopify — no need to add those here.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <select
                  value={newOrder.channel}
                  onChange={(e) => setNewOrder({ ...newOrder, channel: e.target.value })}
                  className="px-4 py-2.5 rounded-xl border-2 border-primary/10 focus:border-primary/30 focus:outline-none bg-white"
                >
                  <option value="amazon">Amazon</option>
                  <option value="nykaa">Nykaa</option>
                  <option value="flipkart">Flipkart</option>
                  <option value="myntra">Myntra</option>
                  <option value="other">Other</option>
                </select>
                <input
                  type="text"
                  placeholder="Order number *"
                  value={newOrder.order_number}
                  onChange={(e) => setNewOrder({ ...newOrder, order_number: e.target.value })}
                  className="px-4 py-2.5 rounded-xl border-2 border-primary/10 focus:border-primary/30 focus:outline-none bg-white"
                />
                <input
                  type="number"
                  placeholder="Amount (₹) *"
                  value={newOrder.total_amount}
                  onChange={(e) => setNewOrder({ ...newOrder, total_amount: e.target.value })}
                  className="px-4 py-2.5 rounded-xl border-2 border-primary/10 focus:border-primary/30 focus:outline-none bg-white"
                />
                <input
                  type="text"
                  placeholder="Customer name (optional)"
                  value={newOrder.customer_name}
                  onChange={(e) => setNewOrder({ ...newOrder, customer_name: e.target.value })}
                  className="px-4 py-2.5 rounded-xl border-2 border-primary/10 focus:border-primary/30 focus:outline-none bg-white"
                />
                <input
                  type="text"
                  placeholder="Customer phone (optional)"
                  value={newOrder.customer_phone}
                  onChange={(e) => setNewOrder({ ...newOrder, customer_phone: e.target.value })}
                  className="px-4 py-2.5 rounded-xl border-2 border-primary/10 focus:border-primary/30 focus:outline-none bg-white"
                />
                <input
                  type="date"
                  value={newOrder.order_date}
                  onChange={(e) => setNewOrder({ ...newOrder, order_date: e.target.value })}
                  className="px-4 py-2.5 rounded-xl border-2 border-primary/10 focus:border-primary/30 focus:outline-none bg-white"
                />
              </div>
              <button
                onClick={addManualOrder}
                disabled={saving || !newOrder.order_number.trim() || !newOrder.total_amount}
                className="mt-4 flex items-center gap-2 px-5 py-2.5 bg-primary text-cream rounded-xl font-medium hover:bg-primary/90 transition-all duration-300 disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                Save Order
              </button>
            </div>
          )}

          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-soft-lg overflow-hidden">
            {loading ? (
              <div className="p-12 text-center text-dark-brown/60">Loading orders...</div>
            ) : filteredOrders.length === 0 ? (
              <div className="p-12 text-center text-dark-brown/60">
                No orders yet. Website orders sync automatically; add Amazon, Nykaa, Flipkart or Myntra orders with "Add Order".
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b-2 border-primary/10 text-left">
                      <th className="px-6 py-4 text-sm font-semibold text-dark-brown/70">Order</th>
                      <th className="px-6 py-4 text-sm font-semibold text-dark-brown/70">Source</th>
                      <th className="px-6 py-4 text-sm font-semibold text-dark-brown/70">Customer</th>
                      <th className="px-6 py-4 text-sm font-semibold text-dark-brown/70">Date</th>
                      <th className="px-6 py-4 text-sm font-semibold text-dark-brown/70">Payment</th>
                      <th className="px-6 py-4 text-sm font-semibold text-dark-brown/70">Fulfillment</th>
                      <th className="px-6 py-4 text-sm font-semibold text-dark-brown/70 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredOrders.map((order) => (
                      <Fragment key={order.id}>
                        <tr
                          onClick={() => setExpandedId(expandedId === order.id ? null : order.id)}
                          className="border-b border-primary/5 hover:bg-cream/60 cursor-pointer transition-colors"
                        >
                          <td className="px-6 py-4 font-semibold text-primary">{order.order_number}</td>
                          <td className="px-6 py-4">
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${CHANNEL_COLORS[order.channel] || 'bg-dark-brown/20 text-dark-brown'}`}>
                              {CHANNEL_LABELS[order.channel] || order.channel}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-dark-brown">
                            <div>{order.customer_name || '—'}</div>
                            {order.customer_phone && (
                              <div className="text-xs text-dark-brown/50">{order.customer_phone}</div>
                            )}
                          </td>
                          <td className="px-6 py-4 text-dark-brown/70">
                            {format(new Date(order.order_date), 'MMM d, yyyy')}
                          </td>
                          <td className="px-6 py-4">
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusColor(order.financial_status)}`}>
                              {order.financial_status || 'Unknown'}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusColor(order.fulfillment_status)}`}>
                              {order.fulfillment_status || 'Unfulfilled'}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right font-semibold text-dark-brown">
                            ₹{Number(order.total_amount).toLocaleString('en-IN')}
                          </td>
                        </tr>
                        {expandedId === order.id && (
                          <tr key={`${order.id}-detail`} className="bg-cream/40">
                            <td colSpan={7} className="px-6 py-4">
                              {order.sales_order_items.length === 0 ? (
                                <p className="text-sm text-dark-brown/50">No line items recorded for this order.</p>
                              ) : (
                                <div className="space-y-2">
                                  {order.sales_order_items.map((item) => (
                                    <div key={item.id} className="flex items-center justify-between text-sm">
                                      <span className="text-dark-brown">
                                        {item.product_name} {item.sku ? `(${item.sku})` : ''} × {item.quantity}
                                      </span>
                                      <span className="text-dark-brown/70">
                                        ₹{Number(item.total_price).toLocaleString('en-IN')}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </td>
                          </tr>
                        )}
                      </Fragment>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
