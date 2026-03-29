import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, Grid3x3, List, Phone, Mail, Star, TrendingUp, Users, AlertCircle, Award } from 'lucide-react';
import Header from '../components/Header';
import AddVendorModal from '../components/AddVendorModal';
import { supabase } from '../lib/supabase';

const categories = [
  { id: 'all', label: 'All Vendors', icon: '🏢', color: 'bg-dark-brown/10' },
  { id: 'Raw Materials', label: 'Raw Materials', icon: '🌿', color: 'bg-sage/20' },
  { id: 'Packaging', label: 'Packaging', icon: '📦', color: 'bg-secondary/20' },
  { id: 'Printing', label: 'Printing', icon: '🖨️', color: 'bg-blue-500/20' },
  { id: 'Logistics', label: 'Logistics', icon: '🚚', color: 'bg-accent/20' },
  { id: 'Lab Testing', label: 'Lab Testing', icon: '🔬', color: 'bg-purple-500/20' },
  { id: 'Other', label: 'Other', icon: '🔧', color: 'bg-dark-brown/20' },
];

export default function Vendors() {
  const [vendors, setVendors] = useState<any[]>([]);
  const [filteredVendors, setFilteredVendors] = useState<any[]>([]);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    pendingPayments: 0,
    avgRating: 0,
  });

  useEffect(() => {
    fetchVendors();
  }, []);

  useEffect(() => {
    filterVendors();
  }, [vendors, selectedCategory, searchQuery]);

  const fetchVendors = async () => {
    try {
      const { data: vendorsData, error } = await supabase
        .from('vendors')
        .select('*')
        .order('name');

      if (error) throw error;

      const { data: transactionsData } = await supabase
        .from('vendor_transactions')
        .select('vendor_id, amount, status');

      const vendorsWithStats = (vendorsData || []).map(vendor => {
        const vendorTransactions = transactionsData?.filter(t => t.vendor_id === vendor.id) || [];
        const totalSpent = vendorTransactions.reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0);
        const pendingAmount = vendorTransactions
          .filter(t => t.status === 'pending')
          .reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0);

        return {
          ...vendor,
          totalSpent,
          pendingAmount,
        };
      });

      setVendors(vendorsWithStats);

      const totalVendors = vendorsWithStats.length;
      const activeVendors = vendorsWithStats.filter(v => v.totalSpent > 0).length;
      const totalPending = vendorsWithStats.reduce((sum, v) => sum + v.pendingAmount, 0);
      const avgRating = vendorsWithStats.reduce((sum, v) => sum + (v.current_rating || 0), 0) / (totalVendors || 1);

      setStats({
        total: totalVendors,
        active: activeVendors,
        pendingPayments: totalPending,
        avgRating,
      });
    } catch (error) {
      console.error('Error fetching vendors:', error);
    }
  };

  const filterVendors = () => {
    let filtered = vendors;

    if (selectedCategory !== 'all') {
      filtered = filtered.filter(v => v.category === selectedCategory);
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(v =>
        v.name?.toLowerCase().includes(query) ||
        v.contact_person?.toLowerCase().includes(query) ||
        v.email?.toLowerCase().includes(query) ||
        v.phone?.includes(query)
      );
    }

    setFilteredVendors(filtered);
  };

  const getCategoryColor = (category: string) => {
    const cat = categories.find(c => c.id === category);
    return cat?.color || 'bg-dark-brown/10';
  };

  const getCategoryIcon = (category: string) => {
    const cat = categories.find(c => c.id === category);
    return cat?.icon || '🏢';
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map(star => (
          <Star
            key={star}
            className={`w-4 h-4 ${
              star <= rating ? 'fill-amber-400 text-amber-400' : 'text-dark-brown/20'
            }`}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-cream">
      <Header />

      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="font-heading text-4xl font-bold text-primary mb-2">
              Vendor & Supplier Directory
            </h1>
            <p className="text-dark-brown/70">Manage your business relationships</p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-secondary to-accent text-white rounded-xl font-semibold hover:shadow-soft-lg transition-all"
          >
            <Plus className="w-5 h-5" />
            Add Vendor
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow-soft p-6">
            <div className="flex items-center justify-between mb-2">
              <Users className="w-8 h-8 text-primary" />
              <span className="text-3xl font-bold text-primary">{stats.total}</span>
            </div>
            <p className="text-sm font-semibold text-dark-brown/70">Total Vendors</p>
          </div>

          <div className="bg-white rounded-xl shadow-soft p-6">
            <div className="flex items-center justify-between mb-2">
              <TrendingUp className="w-8 h-8 text-sage" />
              <span className="text-3xl font-bold text-sage">{stats.active}</span>
            </div>
            <p className="text-sm font-semibold text-dark-brown/70">Active Vendors</p>
          </div>

          <div className="bg-white rounded-xl shadow-soft p-6">
            <div className="flex items-center justify-between mb-2">
              <AlertCircle className="w-8 h-8 text-soft-red" />
              <span className="text-3xl font-bold text-soft-red">
                ₹{stats.pendingPayments.toFixed(0)}
              </span>
            </div>
            <p className="text-sm font-semibold text-dark-brown/70">Pending Payments</p>
          </div>

          <div className="bg-white rounded-xl shadow-soft p-6">
            <div className="flex items-center justify-between mb-2">
              <Award className="w-8 h-8 text-amber-500" />
              <span className="text-3xl font-bold text-amber-500">{stats.avgRating.toFixed(1)}</span>
            </div>
            <p className="text-sm font-semibold text-dark-brown/70">Average Rating</p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-soft p-4 mb-6">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
            <div className="flex items-center gap-2 overflow-x-auto w-full lg:w-auto">
              {categories.map(cat => {
                const count = cat.id === 'all'
                  ? vendors.length
                  : vendors.filter(v => v.category === cat.id).length;
                return (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-all whitespace-nowrap ${
                      selectedCategory === cat.id
                        ? 'bg-primary text-white shadow-soft'
                        : 'bg-dark-brown/5 text-dark-brown hover:bg-dark-brown/10'
                    }`}
                  >
                    <span>{cat.icon}</span>
                    <span>{cat.label}</span>
                    <span className="px-2 py-0.5 bg-white/20 rounded-full text-xs">
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="flex items-center gap-3 w-full lg:w-auto">
              <div className="relative flex-1 lg:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-brown/40" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search vendors..."
                  className="w-full pl-10 pr-4 py-2 border-2 border-dark-brown/10 rounded-lg focus:border-accent focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-1 p-1 bg-dark-brown/5 rounded-lg">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-lg transition-all ${
                    viewMode === 'grid'
                      ? 'bg-white shadow-soft text-primary'
                      : 'text-dark-brown/60 hover:text-primary'
                  }`}
                >
                  <Grid3x3 className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-lg transition-all ${
                    viewMode === 'list'
                      ? 'bg-white shadow-soft text-primary'
                      : 'text-dark-brown/60 hover:text-primary'
                  }`}
                >
                  <List className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredVendors.map(vendor => (
              <Link
                key={vendor.id}
                to={`/vendors/${vendor.id}`}
                className="bg-white rounded-xl shadow-soft hover:shadow-soft-lg transition-all overflow-hidden border-l-4 border-transparent hover:border-primary group"
              >
                <div className={`h-2 ${getCategoryColor(vendor.category)}`} />
                <div className="p-6">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="font-heading text-xl font-bold text-primary group-hover:text-accent transition-colors mb-1">
                        {vendor.name}
                      </h3>
                      <span className={`inline-flex items-center gap-1 px-3 py-1 ${getCategoryColor(vendor.category)} rounded-full text-sm font-semibold`}>
                        <span>{getCategoryIcon(vendor.category)}</span>
                        {vendor.category}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 mb-4">
                    {renderStars(vendor.current_rating || 3)}
                    <span className="text-sm text-dark-brown/60 ml-2">
                      ({vendor.current_rating?.toFixed(1) || '3.0'})
                    </span>
                  </div>

                  <div className="space-y-2 mb-4">
                    {vendor.phone && (
                      <div className="flex items-center gap-2 text-sm text-dark-brown/70">
                        <Phone className="w-4 h-4" />
                        <span>{vendor.phone}</span>
                      </div>
                    )}
                    {vendor.email && (
                      <div className="flex items-center gap-2 text-sm text-dark-brown/70">
                        <Mail className="w-4 h-4" />
                        <span className="truncate">{vendor.email}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t-2 border-dark-brown/5">
                    <div>
                      <p className="text-xs text-dark-brown/60">Total Spent</p>
                      <p className="text-lg font-bold text-sage">
                        ₹{vendor.totalSpent?.toFixed(0) || '0'}
                      </p>
                    </div>
                    {vendor.pendingAmount > 0 && (
                      <div className="px-3 py-1 bg-soft-red/10 text-soft-red rounded-full text-sm font-bold">
                        ₹{vendor.pendingAmount.toFixed(0)} due
                      </div>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-soft overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-cream">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-bold text-dark-brown">Vendor Name</th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-dark-brown">Category</th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-dark-brown">Contact</th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-dark-brown">Rating</th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-dark-brown">Total Spent</th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-dark-brown">Pending</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredVendors.map((vendor, index) => (
                    <tr
                      key={vendor.id}
                      className={`border-t border-dark-brown/5 hover:bg-cream/50 transition-colors ${
                        index % 2 === 0 ? 'bg-white' : 'bg-cream/20'
                      }`}
                    >
                      <td className="px-6 py-4">
                        <Link
                          to={`/vendors/${vendor.id}`}
                          className="font-semibold text-primary hover:text-accent transition-colors"
                        >
                          {vendor.name}
                        </Link>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1 px-3 py-1 ${getCategoryColor(vendor.category)} rounded-full text-sm font-semibold`}>
                          <span>{getCategoryIcon(vendor.category)}</span>
                          {vendor.category}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          {vendor.phone && (
                            <div className="flex items-center gap-2 text-sm text-dark-brown/70">
                              <Phone className="w-3 h-3" />
                              {vendor.phone}
                            </div>
                          )}
                          {vendor.email && (
                            <div className="flex items-center gap-2 text-sm text-dark-brown/70">
                              <Mail className="w-3 h-3" />
                              {vendor.email}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {renderStars(vendor.current_rating || 3)}
                          <span className="text-sm text-dark-brown/60">
                            {vendor.current_rating?.toFixed(1) || '3.0'}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-bold text-sage">
                          ₹{vendor.totalSpent?.toFixed(0) || '0'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {vendor.pendingAmount > 0 ? (
                          <span className="px-3 py-1 bg-soft-red/10 text-soft-red rounded-full text-sm font-bold">
                            ₹{vendor.pendingAmount.toFixed(0)}
                          </span>
                        ) : (
                          <span className="text-sm text-dark-brown/40">-</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {filteredVendors.length === 0 && (
          <div className="text-center py-12">
            <Users className="w-16 h-16 text-dark-brown/20 mx-auto mb-4" />
            <h3 className="font-heading text-xl font-bold text-dark-brown/60 mb-2">
              No vendors found
            </h3>
            <p className="text-dark-brown/40 mb-4">
              {searchQuery ? 'Try adjusting your search' : 'Add your first vendor to get started'}
            </p>
            {!searchQuery && (
              <button
                onClick={() => setShowAddModal(true)}
                className="px-6 py-3 bg-gradient-to-r from-primary to-sage text-white rounded-xl font-semibold hover:shadow-soft-lg transition-all"
              >
                Add Vendor
              </button>
            )}
          </div>
        )}
      </div>

      {showAddModal && (
        <AddVendorModal
          onClose={() => setShowAddModal(false)}
          onSuccess={() => {
            setShowAddModal(false);
            fetchVendors();
          }}
        />
      )}
    </div>
  );
}
