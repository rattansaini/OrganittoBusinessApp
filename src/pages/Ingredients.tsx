import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, AlertTriangle, Clock, TrendingDown, Package, Grid, List } from 'lucide-react';
import Header from '../components/Header';
import AddIngredientStockModal from '../components/AddIngredientStockModal';
import { supabase } from '../lib/supabase';
import { differenceInDays, format } from 'date-fns';

export default function Ingredients() {
  const [ingredients, setIngredients] = useState<any[]>([]);
  const [filteredIngredients, setFilteredIngredients] = useState<any[]>([]);
  const [vendors, setVendors] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [alerts, setAlerts] = useState({
    expired: 0,
    expiring15d: 0,
    expiring30d: 0,
    lowStock: 0,
    reorderNeeded: 0,
  });

  useEffect(() => {
    fetchIngredients();
    fetchVendors();
  }, []);

  useEffect(() => {
    filterIngredients();
    calculateAlerts();
  }, [ingredients, searchQuery, statusFilter]);

  const fetchIngredients = async () => {
    try {
      const { data, error } = await supabase
        .from('ingredient_inventory_summary')
        .select('*')
        .order('common_name');

      if (error) throw error;
      setIngredients(data || []);
    } catch (error) {
      console.error('Error fetching ingredients:', error);
    }
  };

  const fetchVendors = async () => {
    try {
      const { data, error } = await supabase
        .from('vendors')
        .select('id, name')
        .order('name');

      if (error) throw error;
      setVendors(data || []);
    } catch (error) {
      console.error('Error fetching vendors:', error);
    }
  };

  const filterIngredients = () => {
    let filtered = ingredients;

    if (statusFilter !== 'all') {
      filtered = filtered.filter(ing => ing.inventory_status === statusFilter);
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(ing =>
        ing.common_name?.toLowerCase().includes(query) ||
        ing.botanical_name?.toLowerCase().includes(query) ||
        ing.type?.toLowerCase().includes(query)
      );
    }

    setFilteredIngredients(filtered);
  };

  const calculateAlerts = () => {
    const now = new Date();
    const expired = ingredients.filter(ing => {
      if (!ing.earliest_expiry) return false;
      return differenceInDays(new Date(ing.earliest_expiry), now) < 0;
    }).length;

    const expiring15d = ingredients.filter(ing => {
      if (!ing.earliest_expiry) return false;
      const days = differenceInDays(new Date(ing.earliest_expiry), now);
      return days >= 0 && days < 15;
    }).length;

    const expiring30d = ingredients.filter(ing => {
      if (!ing.earliest_expiry) return false;
      const days = differenceInDays(new Date(ing.earliest_expiry), now);
      return days >= 15 && days < 30;
    }).length;

    const lowStock = ingredients.filter(ing => ing.inventory_status === 'low_stock').length;
    const reorderNeeded = ingredients.filter(ing =>
      ing.total_stock < ing.reorder_level && ing.reorder_level > 0
    ).length;

    setAlerts({ expired, expiring15d, expiring30d, lowStock, reorderNeeded });
  };

  const getExpiryColor = (expiryDate: string | null) => {
    if (!expiryDate) return 'text-dark-brown/40';
    const daysUntilExpiry = differenceInDays(new Date(expiryDate), new Date());
    if (daysUntilExpiry < 0) return 'text-soft-red';
    if (daysUntilExpiry <= 15) return 'text-soft-red';
    if (daysUntilExpiry <= 30) return 'text-accent';
    if (daysUntilExpiry <= 60) return 'text-amber-500';
    return 'text-sage';
  };

  const getStatusBadge = (status: string) => {
    const badges: any = {
      good_stock: { label: 'Good Stock', color: 'bg-sage/10 text-sage', icon: '🟢' },
      low_stock: { label: 'Low Stock', color: 'bg-amber-500/10 text-amber-500', icon: '🟡' },
      expiring_soon: { label: 'Expiring Soon', color: 'bg-accent/10 text-accent', icon: '🟠' },
      expiring_30d: { label: 'Expiring <30d', color: 'bg-amber-500/10 text-amber-500', icon: '🟡' },
      expired: { label: 'Expired', color: 'bg-soft-red/10 text-soft-red', icon: '🔴' },
      out_of_stock: { label: 'Out of Stock', color: 'bg-dark-brown/10 text-dark-brown', icon: '⚫' },
    };
    return badges[status] || badges.good_stock;
  };

  const getTypeColor = (type: string) => {
    const colors: any = {
      herb: 'bg-sage/10 text-sage',
      oil: 'bg-amber-500/10 text-amber-500',
      powder: 'bg-primary/10 text-primary',
      extract: 'bg-accent/10 text-accent',
      base: 'bg-blue-500/10 text-blue-500',
      preservative: 'bg-purple-500/10 text-purple-500',
      fragrance: 'bg-pink-500/10 text-pink-500',
      active: 'bg-primary/10 text-primary',
    };
    return colors[type.toLowerCase()] || 'bg-dark-brown/10 text-dark-brown';
  };

  return (
    <div className="min-h-screen bg-cream">
      <Header />

      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="font-heading text-4xl font-bold text-primary mb-2">
              Ingredient Inventory & Expiry Management
            </h1>
            <p className="text-dark-brown/70">Track stock levels, expiry dates, and reorder alerts</p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-secondary to-accent text-white rounded-xl font-semibold hover:shadow-soft-lg transition-all"
          >
            <Plus className="w-5 h-5" />
            Add Ingredient Stock
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          <button
            onClick={() => setStatusFilter('expired')}
            className={`bg-white rounded-xl shadow-soft p-4 hover:shadow-soft-lg transition-all text-left ${
              statusFilter === 'expired' ? 'ring-2 ring-soft-red' : ''
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-2xl">🔴</span>
              <span className={`text-3xl font-bold ${alerts.expired > 0 ? 'text-soft-red' : 'text-dark-brown/20'}`}>
                {alerts.expired}
              </span>
            </div>
            <p className="text-sm font-semibold text-dark-brown/70">Expired</p>
          </button>

          <button
            onClick={() => setStatusFilter('expiring_soon')}
            className={`bg-white rounded-xl shadow-soft p-4 hover:shadow-soft-lg transition-all text-left ${
              statusFilter === 'expiring_soon' ? 'ring-2 ring-soft-red' : ''
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-2xl">🟠</span>
              <span className={`text-3xl font-bold ${alerts.expiring15d > 0 ? 'text-soft-red' : 'text-dark-brown/20'}`}>
                {alerts.expiring15d}
              </span>
            </div>
            <p className="text-sm font-semibold text-dark-brown/70">Expiring {'<'}15 days</p>
          </button>

          <button
            onClick={() => setStatusFilter('expiring_30d')}
            className={`bg-white rounded-xl shadow-soft p-4 hover:shadow-soft-lg transition-all text-left ${
              statusFilter === 'expiring_30d' ? 'ring-2 ring-amber-500' : ''
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-2xl">🟡</span>
              <span className={`text-3xl font-bold ${alerts.expiring30d > 0 ? 'text-amber-500' : 'text-dark-brown/20'}`}>
                {alerts.expiring30d}
              </span>
            </div>
            <p className="text-sm font-semibold text-dark-brown/70">Expiring 15-30 days</p>
          </button>

          <button
            onClick={() => setStatusFilter('low_stock')}
            className={`bg-white rounded-xl shadow-soft p-4 hover:shadow-soft-lg transition-all text-left ${
              statusFilter === 'low_stock' ? 'ring-2 ring-blue-500' : ''
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-2xl">🔵</span>
              <span className={`text-3xl font-bold ${alerts.lowStock > 0 ? 'text-blue-500' : 'text-dark-brown/20'}`}>
                {alerts.lowStock}
              </span>
            </div>
            <p className="text-sm font-semibold text-dark-brown/70">Low Stock</p>
          </button>

          <button
            onClick={() => setStatusFilter(alerts.reorderNeeded > 0 ? 'low_stock' : 'all')}
            className={`bg-white rounded-xl shadow-soft p-4 hover:shadow-soft-lg transition-all text-left ${
              alerts.reorderNeeded > 0 ? 'ring-2 ring-sage' : ''
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-2xl">🟢</span>
              <span className={`text-3xl font-bold ${alerts.reorderNeeded > 0 ? 'text-sage' : 'text-dark-brown/20'}`}>
                {alerts.reorderNeeded}
              </span>
            </div>
            <p className="text-sm font-semibold text-dark-brown/70">Reorder Needed</p>
          </button>
        </div>

        <div className="bg-white rounded-xl shadow-soft p-4 mb-6">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => setStatusFilter('all')}
                className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                  statusFilter === 'all'
                    ? 'bg-primary text-white shadow-soft'
                    : 'bg-dark-brown/5 text-dark-brown hover:bg-dark-brown/10'
                }`}
              >
                All ({ingredients.length})
              </button>
              <button
                onClick={() => setStatusFilter('good_stock')}
                className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                  statusFilter === 'good_stock'
                    ? 'bg-primary text-white shadow-soft'
                    : 'bg-dark-brown/5 text-dark-brown hover:bg-dark-brown/10'
                }`}
              >
                Good Stock
              </button>
            </div>

            <div className="flex items-center gap-3 w-full lg:w-auto">
              <div className="relative flex-1 lg:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-brown/40" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search ingredients..."
                  className="w-full pl-10 pr-4 py-2 border-2 border-dark-brown/10 rounded-lg focus:border-accent focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-2 bg-dark-brown/5 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded ${
                    viewMode === 'list' ? 'bg-white shadow-soft' : ''
                  }`}
                >
                  <List className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded ${
                    viewMode === 'grid' ? 'bg-white shadow-soft' : ''
                  }`}
                >
                  <Grid className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {viewMode === 'list' ? (
          <div className="bg-white rounded-xl shadow-soft overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-cream border-b-2 border-dark-brown/5">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-bold text-dark-brown">Ingredient</th>
                    <th className="px-4 py-3 text-left text-sm font-bold text-dark-brown">Type</th>
                    <th className="px-4 py-3 text-left text-sm font-bold text-dark-brown">Current Stock</th>
                    <th className="px-4 py-3 text-left text-sm font-bold text-dark-brown">Reorder Level</th>
                    <th className="px-4 py-3 text-left text-sm font-bold text-dark-brown">Expiry Date</th>
                    <th className="px-4 py-3 text-left text-sm font-bold text-dark-brown">Days Left</th>
                    <th className="px-4 py-3 text-left text-sm font-bold text-dark-brown">Status</th>
                    <th className="px-4 py-3 text-left text-sm font-bold text-dark-brown">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredIngredients.map((ingredient, index) => {
                    const statusBadge = getStatusBadge(ingredient.inventory_status);
                    const daysUntilExpiry = ingredient.earliest_expiry
                      ? differenceInDays(new Date(ingredient.earliest_expiry), new Date())
                      : null;

                    return (
                      <tr
                        key={ingredient.ingredient_id}
                        className={`border-t border-dark-brown/5 hover:bg-cream/50 transition-colors ${
                          ingredient.inventory_status === 'expired' ? 'bg-soft-red/5' :
                          ingredient.inventory_status === 'expiring_soon' ? 'bg-accent/5' : ''
                        }`}
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            {ingredient.image_url ? (
                              <img
                                src={ingredient.image_url}
                                alt={ingredient.common_name}
                                className="w-10 h-10 rounded-lg object-cover"
                              />
                            ) : (
                              <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                                <Package className="w-5 h-5 text-primary" />
                              </div>
                            )}
                            <div>
                              <p className="font-semibold text-dark-brown">{ingredient.common_name}</p>
                              {ingredient.botanical_name && (
                                <p className="text-xs text-dark-brown/60 italic">{ingredient.botanical_name}</p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-3 py-1 rounded-full text-xs font-bold capitalize ${getTypeColor(ingredient.type)}`}>
                            {ingredient.type}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div>
                            <p className="font-bold text-lg text-primary">
                              {ingredient.total_stock || 0} {ingredient.default_unit}
                            </p>
                            {ingredient.active_lots > 0 && (
                              <p className="text-xs text-dark-brown/60">{ingredient.active_lots} active lots</p>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-sm text-dark-brown/70">
                            {ingredient.reorder_level || 0} {ingredient.default_unit}
                          </p>
                        </td>
                        <td className="px-4 py-3">
                          {ingredient.earliest_expiry ? (
                            <p className={`font-semibold ${getExpiryColor(ingredient.earliest_expiry)}`}>
                              {format(new Date(ingredient.earliest_expiry), 'MMM dd, yyyy')}
                            </p>
                          ) : (
                            <p className="text-dark-brown/40">No stock</p>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {daysUntilExpiry !== null ? (
                            <span className={`font-bold ${getExpiryColor(ingredient.earliest_expiry)}`}>
                              {daysUntilExpiry >= 0 ? `${daysUntilExpiry}d` : 'Expired'}
                            </span>
                          ) : (
                            <span className="text-dark-brown/40">-</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-3 py-1 rounded-full text-xs font-bold ${statusBadge.color}`}>
                            <span className="mr-1">{statusBadge.icon}</span>
                            {statusBadge.label}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <Link
                            to={`/ingredients/${ingredient.ingredient_id}`}
                            className="px-4 py-2 bg-primary/10 hover:bg-primary/20 text-primary rounded-lg font-semibold transition-colors text-sm"
                          >
                            View Details
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {filteredIngredients.length === 0 && (
              <div className="text-center py-12">
                <Package className="w-16 h-16 text-dark-brown/20 mx-auto mb-4" />
                <h3 className="font-heading text-xl font-bold text-dark-brown/60 mb-2">
                  No ingredients found
                </h3>
                <p className="text-dark-brown/40 mb-4">
                  {searchQuery ? 'Try adjusting your search' : 'Add your first ingredient to start tracking'}
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredIngredients.map(ingredient => {
              const statusBadge = getStatusBadge(ingredient.inventory_status);
              const daysUntilExpiry = ingredient.earliest_expiry
                ? differenceInDays(new Date(ingredient.earliest_expiry), new Date())
                : null;

              return (
                <Link
                  key={ingredient.ingredient_id}
                  to={`/ingredients/${ingredient.ingredient_id}`}
                  className="bg-white rounded-xl shadow-soft hover:shadow-soft-lg transition-all overflow-hidden"
                >
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        {ingredient.image_url ? (
                          <img
                            src={ingredient.image_url}
                            alt={ingredient.common_name}
                            className="w-16 h-16 rounded-lg object-cover"
                          />
                        ) : (
                          <div className="w-16 h-16 bg-primary/10 rounded-lg flex items-center justify-center">
                            <Package className="w-8 h-8 text-primary" />
                          </div>
                        )}
                        <div>
                          <h3 className="font-semibold text-dark-brown">{ingredient.common_name}</h3>
                          {ingredient.botanical_name && (
                            <p className="text-xs text-dark-brown/60 italic">{ingredient.botanical_name}</p>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <p className="text-sm text-dark-brown/60 mb-1">Current Stock</p>
                        <p className="text-2xl font-bold text-primary">
                          {ingredient.total_stock || 0} {ingredient.default_unit}
                        </p>
                      </div>

                      {ingredient.earliest_expiry && (
                        <div>
                          <p className="text-sm text-dark-brown/60 mb-1">Expiry</p>
                          <p className={`font-semibold ${getExpiryColor(ingredient.earliest_expiry)}`}>
                            {format(new Date(ingredient.earliest_expiry), 'MMM dd, yyyy')}
                            {daysUntilExpiry !== null && (
                              <span className="text-xs ml-2">
                                ({daysUntilExpiry >= 0 ? `${daysUntilExpiry}d left` : 'Expired'})
                              </span>
                            )}
                          </p>
                        </div>
                      )}

                      <div>
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${statusBadge.color}`}>
                          <span className="mr-1">{statusBadge.icon}</span>
                          {statusBadge.label}
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {showAddModal && (
        <AddIngredientStockModal
          vendors={vendors}
          onClose={() => setShowAddModal(false)}
          onSuccess={() => {
            setShowAddModal(false);
            fetchIngredients();
          }}
        />
      )}
    </div>
  );
}
