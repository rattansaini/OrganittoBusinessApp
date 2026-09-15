import { Fragment, useEffect, useState } from 'react';
import { ShoppingBag, Package, IndianRupee, RefreshCw } from 'lucide-react';
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

  const totalRevenue = orders.reduce((sum, o) => sum + Number(o.total_amount), 0);
  const totalItems = orders.reduce(
    (sum, o) => sum + o.sales_order_items.reduce((s, i) => s + i.quantity, 0),
    0
  );

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
              <p className="text-dark-brown/70 text-lg">Synced from your Shopify store</p>
            </div>
            <button
              onClick={fetchOrders}
              className="flex items-center gap-2 px-4 py-2.5 bg-white/80 border-2 border-primary/10 rounded-xl text-dark-brown hover:border-primary/30 transition-all duration-300"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
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
              value={orders.length.toString()}
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

          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-soft-lg overflow-hidden">
            {loading ? (
              <div className="p-12 text-center text-dark-brown/60">Loading orders...</div>
            ) : orders.length === 0 ? (
              <div className="p-12 text-center text-dark-brown/60">
                No orders synced yet. New Shopify orders will appear here automatically.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b-2 border-primary/10 text-left">
                      <th className="px-6 py-4 text-sm font-semibold text-dark-brown/70">Order</th>
                      <th className="px-6 py-4 text-sm font-semibold text-dark-brown/70">Customer</th>
                      <th className="px-6 py-4 text-sm font-semibold text-dark-brown/70">Date</th>
                      <th className="px-6 py-4 text-sm font-semibold text-dark-brown/70">Payment</th>
                      <th className="px-6 py-4 text-sm font-semibold text-dark-brown/70">Fulfillment</th>
                      <th className="px-6 py-4 text-sm font-semibold text-dark-brown/70 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map((order) => (
                      <Fragment key={order.id}>
                        <tr
                          onClick={() => setExpandedId(expandedId === order.id ? null : order.id)}
                          className="border-b border-primary/5 hover:bg-cream/60 cursor-pointer transition-colors"
                        >
                          <td className="px-6 py-4 font-semibold text-primary">{order.order_number}</td>
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
                            <td colSpan={6} className="px-6 py-4">
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
