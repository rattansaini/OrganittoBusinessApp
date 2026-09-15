import { useEffect, useState } from 'react';
import { Users, IndianRupee, ShoppingBag, Plus, X, Save } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { format } from 'date-fns';
import StatsCard from '../components/StatsCard';
import { TableSkeleton } from '../components/LoadingState';
import AdminOnly from '../components/AdminOnly';

interface Customer {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  city: string | null;
  state: string | null;
  notes: string | null;
  total_orders: number;
  total_spent: number;
  last_order_date: string | null;
}

export default function Customers() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [newCustomer, setNewCustomer] = useState({ name: '', email: '', phone: '', city: '', state: '', notes: '' });

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .order('total_spent', { ascending: false });

      if (error) throw error;
      setCustomers(data || []);
    } catch (error) {
      console.error('Error fetching customers:', error);
    } finally {
      setLoading(false);
    }
  };

  const addCustomer = async () => {
    if (!newCustomer.name.trim() || !newCustomer.phone.trim()) return;
    setSaving(true);
    try {
      const { error } = await supabase.from('customers').insert({
        name: newCustomer.name.trim(),
        email: newCustomer.email.trim() || null,
        phone: newCustomer.phone.trim() || null,
        city: newCustomer.city.trim() || null,
        state: newCustomer.state.trim() || null,
        notes: newCustomer.notes.trim() || null,
      });

      if (error) throw error;
      setNewCustomer({ name: '', email: '', phone: '', city: '', state: '', notes: '' });
      setShowAddForm(false);
      await fetchCustomers();
    } catch (error) {
      console.error('Error adding customer:', error);
    } finally {
      setSaving(false);
    }
  };

  const filtered = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.phone || '').includes(searchTerm)
  );

  const totalCustomers = customers.length;
  const totalRevenue = customers.reduce((sum, c) => sum + Number(c.total_spent), 0);
  const repeatCustomers = customers.filter((c) => c.total_orders > 1).length;

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="font-heading text-4xl md:text-5xl font-bold text-primary mb-2">Customers</h2>
          <p className="text-dark-brown/70 text-lg">Everyone who has bought from Organitto</p>
        </div>
        <AdminOnly>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="flex items-center gap-2 px-4 py-2.5 bg-primary text-cream rounded-xl font-medium hover:bg-primary/90 transition-all duration-300 shadow-soft"
          >
            <Plus className="w-4 h-4" />
            Add Customer
          </button>
        </AdminOnly>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <StatsCard
          title="Total Customers"
          value={totalCustomers.toString()}
          icon={Users}
          iconBgColor="bg-primary/20"
          iconColor="text-primary"
          valueColor="text-primary"
        />
        <StatsCard
          title="Total Revenue"
          value={`₹${totalRevenue.toLocaleString('en-IN')}`}
          icon={IndianRupee}
          iconBgColor="bg-accent/20"
          iconColor="text-accent"
          valueColor="text-dark-brown"
        />
        <StatsCard
          title="Repeat Customers"
          value={repeatCustomers.toString()}
          icon={ShoppingBag}
          iconBgColor="bg-sage/20"
          iconColor="text-sage"
          valueColor="text-dark-brown"
        />
      </div>

      {showAddForm && (
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-soft-lg p-6 mb-8 border-2 border-primary/10">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-heading text-xl font-bold text-primary">Add Customer</h3>
            <button onClick={() => setShowAddForm(false)} className="text-dark-brown/60 hover:text-dark-brown">
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <input
              type="text"
              placeholder="Name *"
              value={newCustomer.name}
              onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })}
              className="px-4 py-2.5 rounded-xl border-2 border-primary/10 focus:border-primary/30 focus:outline-none bg-white"
            />
            <input
              type="text"
              placeholder="Phone *"
              value={newCustomer.phone}
              onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })}
              className="px-4 py-2.5 rounded-xl border-2 border-primary/10 focus:border-primary/30 focus:outline-none bg-white"
            />
            <input
              type="email"
              placeholder="Email (optional)"
              value={newCustomer.email}
              onChange={(e) => setNewCustomer({ ...newCustomer, email: e.target.value })}
              className="px-4 py-2.5 rounded-xl border-2 border-primary/10 focus:border-primary/30 focus:outline-none bg-white"
            />
            <input
              type="text"
              placeholder="City"
              value={newCustomer.city}
              onChange={(e) => setNewCustomer({ ...newCustomer, city: e.target.value })}
              className="px-4 py-2.5 rounded-xl border-2 border-primary/10 focus:border-primary/30 focus:outline-none bg-white"
            />
            <input
              type="text"
              placeholder="State"
              value={newCustomer.state}
              onChange={(e) => setNewCustomer({ ...newCustomer, state: e.target.value })}
              className="px-4 py-2.5 rounded-xl border-2 border-primary/10 focus:border-primary/30 focus:outline-none bg-white"
            />
            <input
              type="text"
              placeholder="Notes"
              value={newCustomer.notes}
              onChange={(e) => setNewCustomer({ ...newCustomer, notes: e.target.value })}
              className="px-4 py-2.5 rounded-xl border-2 border-primary/10 focus:border-primary/30 focus:outline-none bg-white"
            />
          </div>
          <button
            onClick={addCustomer}
            disabled={saving || !newCustomer.name.trim() || !newCustomer.phone.trim()}
            className="mt-4 flex items-center gap-2 px-5 py-2.5 bg-primary text-cream rounded-xl font-medium hover:bg-primary/90 transition-all duration-300 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            Save Customer
          </button>
        </div>
      )}

      <div className="mb-6">
        <input
          type="text"
          placeholder="Search by name, email or phone..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full md:w-96 px-4 py-2.5 rounded-xl border-2 border-primary/10 focus:border-primary/30 focus:outline-none bg-white"
        />
      </div>

      <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-soft-lg overflow-hidden">
        {loading ? (
          <TableSkeleton rows={6} columns={6} />
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-dark-brown/60">No customers found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-primary/10 text-left">
                  <th className="px-6 py-4 text-sm font-semibold text-dark-brown/70">Name</th>
                  <th className="px-6 py-4 text-sm font-semibold text-dark-brown/70">Phone</th>
                  <th className="px-6 py-4 text-sm font-semibold text-dark-brown/70">Email</th>
                  <th className="px-6 py-4 text-sm font-semibold text-dark-brown/70">Location</th>
                  <th className="px-6 py-4 text-sm font-semibold text-dark-brown/70 text-right">Orders</th>
                  <th className="px-6 py-4 text-sm font-semibold text-dark-brown/70 text-right">Total Spent</th>
                  <th className="px-6 py-4 text-sm font-semibold text-dark-brown/70">Last Order</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((c) => (
                  <tr key={c.id} className="border-b border-primary/5 hover:bg-cream/60 transition-colors">
                    <td className="px-6 py-4 font-semibold text-dark-brown">{c.name}</td>
                    <td className="px-6 py-4 text-dark-brown font-medium">{c.phone || '—'}</td>
                    <td className="px-6 py-4 text-dark-brown/70 text-sm">{c.email || '—'}</td>
                    <td className="px-6 py-4 text-dark-brown/70">
                      {[c.city, c.state].filter(Boolean).join(', ') || '—'}
                    </td>
                    <td className="px-6 py-4 text-right text-dark-brown">{c.total_orders}</td>
                    <td className="px-6 py-4 text-right font-semibold text-primary">
                      ₹{Number(c.total_spent).toLocaleString('en-IN')}
                    </td>
                    <td className="px-6 py-4 text-dark-brown/70">
                      {c.last_order_date ? format(new Date(c.last_order_date), 'MMM d, yyyy') : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
