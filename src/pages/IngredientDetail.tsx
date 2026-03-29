import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Edit, Trash2, Plus, BarChart3, Package, Beaker, TrendingUp, FileText } from 'lucide-react';
import Header from '../components/Header';
import IngredientOverviewTab from '../components/ingredient-detail/IngredientOverviewTab';
import IngredientPurchaseHistoryTab from '../components/ingredient-detail/IngredientPurchaseHistoryTab';
import IngredientUsageTab from '../components/ingredient-detail/IngredientUsageTab';
import IngredientAnalyticsTab from '../components/ingredient-detail/IngredientAnalyticsTab';
import IngredientDocumentsTab from '../components/ingredient-detail/IngredientDocumentsTab';
import { supabase } from '../lib/supabase';
import { differenceInDays } from 'date-fns';

const tabs = [
  { id: 'overview', label: 'Overview & Stock', icon: BarChart3 },
  { id: 'purchase', label: 'Purchase History', icon: Package },
  { id: 'usage', label: 'Usage in Products', icon: Beaker },
  { id: 'analytics', label: 'Analytics', icon: TrendingUp },
  { id: 'documents', label: 'Documents', icon: FileText },
];

export default function IngredientDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [ingredient, setIngredient] = useState<any>(null);
  const [summary, setSummary] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchIngredient();
      fetchSummary();
    }
  }, [id]);

  const fetchIngredient = async () => {
    try {
      const { data, error } = await supabase
        .from('ingredients')
        .select('*, vendors(name)')
        .eq('id', id)
        .maybeSingle();

      if (error) throw error;
      setIngredient(data);
    } catch (error) {
      console.error('Error fetching ingredient:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSummary = async () => {
    try {
      const { data, error } = await supabase
        .from('ingredient_inventory_summary')
        .select('*')
        .eq('ingredient_id', id)
        .maybeSingle();

      if (error) throw error;
      setSummary(data);
    } catch (error) {
      console.error('Error fetching summary:', error);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this ingredient? This action cannot be undone.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('ingredients')
        .delete()
        .eq('id', id);

      if (error) throw error;
      navigate('/ingredients');
    } catch (error) {
      console.error('Error deleting ingredient:', error);
      alert('Error deleting ingredient');
    }
  };

  const getStatusBadge = () => {
    if (!summary) return null;

    const badges: any = {
      good_stock: { label: 'Good Stock', color: 'bg-sage/10 text-sage', icon: '🟢' },
      low_stock: { label: 'Low Stock', color: 'bg-amber-500/10 text-amber-500', icon: '🟡' },
      expiring_soon: { label: 'Expiring Soon', color: 'bg-accent/10 text-accent', icon: '🟠' },
      expiring_30d: { label: 'Expiring <30d', color: 'bg-amber-500/10 text-amber-500', icon: '🟡' },
      expired: { label: 'Expired', color: 'bg-soft-red/10 text-soft-red', icon: '🔴' },
      out_of_stock: { label: 'Out of Stock', color: 'bg-dark-brown/10 text-dark-brown', icon: '⚫' },
    };

    return badges[summary.inventory_status] || badges.good_stock;
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
    return colors[type?.toLowerCase()] || 'bg-dark-brown/10 text-dark-brown';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-cream">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center py-12">
            <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-dark-brown/60">Loading ingredient details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!ingredient) {
    return (
      <div className="min-h-screen bg-cream">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center py-12">
            <p className="text-xl text-dark-brown/60">Ingredient not found</p>
            <button
              onClick={() => navigate('/ingredients')}
              className="mt-4 px-6 py-3 bg-primary text-white rounded-xl font-semibold"
            >
              Back to Ingredients
            </button>
          </div>
        </div>
      </div>
    );
  }

  const statusBadge = getStatusBadge();
  const daysUntilExpiry = summary?.earliest_expiry
    ? differenceInDays(new Date(summary.earliest_expiry), new Date())
    : null;

  return (
    <div className="min-h-screen bg-cream">
      <Header />

      <div className="container mx-auto px-4 py-8">
        <button
          onClick={() => navigate('/ingredients')}
          className="flex items-center gap-2 text-dark-brown hover:text-primary mb-6 font-semibold transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Ingredients
        </button>

        <div className="bg-white rounded-2xl shadow-soft p-6 mb-6">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-start gap-4 mb-3">
                {ingredient.image_url ? (
                  <img
                    src={ingredient.image_url}
                    alt={ingredient.common_name}
                    className="w-20 h-20 rounded-lg object-cover"
                  />
                ) : (
                  <div className="w-20 h-20 bg-primary/10 rounded-lg flex items-center justify-center">
                    <Package className="w-10 h-10 text-primary" />
                  </div>
                )}
                <div>
                  <h1 className="font-heading text-3xl font-bold text-primary mb-1">
                    {ingredient.common_name}
                  </h1>
                  {ingredient.botanical_name && (
                    <p className="text-lg italic text-dark-brown/70 mb-2">
                      {ingredient.botanical_name}
                    </p>
                  )}
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold capitalize ${getTypeColor(ingredient.type)}`}>
                      {ingredient.type}
                    </span>
                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-dark-brown/5 text-dark-brown capitalize">
                      {ingredient.category?.replace('_', ' ')}
                    </span>
                    {statusBadge && (
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${statusBadge.color}`}>
                        <span className="mr-1">{statusBadge.icon}</span>
                        {statusBadge.label}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              <button className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-primary to-sage text-white rounded-xl font-semibold hover:shadow-soft-lg transition-all">
                <Plus className="w-4 h-4" />
                Add Stock
              </button>
              <button className="flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-xl font-semibold hover:bg-primary/20 transition-colors">
                <Edit className="w-4 h-4" />
                Edit
              </button>
              <button
                onClick={handleDelete}
                className="flex items-center gap-2 px-4 py-2 bg-soft-red/10 text-soft-red rounded-xl font-semibold hover:bg-soft-red/20 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                Delete
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t-2 border-dark-brown/5">
            <div>
              <p className="text-sm text-dark-brown/60 mb-1">Total Stock</p>
              <p className="font-bold text-2xl text-sage">
                {summary?.total_stock || 0} {ingredient.default_unit}
              </p>
            </div>
            <div>
              <p className="text-sm text-dark-brown/60 mb-1">Reorder Level</p>
              <p className="font-semibold text-dark-brown">
                {ingredient.reorder_level || 0} {ingredient.default_unit}
              </p>
            </div>
            <div>
              <p className="text-sm text-dark-brown/60 mb-1">Active Lots</p>
              <p className="font-semibold text-dark-brown">{summary?.active_lots || 0}</p>
            </div>
            <div>
              <p className="text-sm text-dark-brown/60 mb-1">Days Until Expiry</p>
              <p className={`font-semibold ${
                daysUntilExpiry === null ? 'text-dark-brown/40' :
                daysUntilExpiry < 0 ? 'text-soft-red' :
                daysUntilExpiry <= 15 ? 'text-soft-red' :
                daysUntilExpiry <= 30 ? 'text-accent' : 'text-sage'
              }`}>
                {daysUntilExpiry !== null ? (daysUntilExpiry >= 0 ? `${daysUntilExpiry} days` : 'Expired') : 'No stock'}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-soft overflow-hidden">
          <div className="border-b-2 border-dark-brown/5 overflow-x-auto">
            <div className="flex">
              {tabs.map(tab => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-6 py-4 font-semibold transition-all whitespace-nowrap ${
                      activeTab === tab.id
                        ? 'text-primary border-b-4 border-primary bg-primary/5'
                        : 'text-dark-brown/60 hover:text-primary hover:bg-primary/5'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="p-6">
            {activeTab === 'overview' && <IngredientOverviewTab ingredientId={id!} ingredient={ingredient} summary={summary} onUpdate={() => { fetchIngredient(); fetchSummary(); }} />}
            {activeTab === 'purchase' && <IngredientPurchaseHistoryTab ingredientId={id!} ingredient={ingredient} />}
            {activeTab === 'usage' && <IngredientUsageTab ingredientId={id!} ingredient={ingredient} />}
            {activeTab === 'analytics' && <IngredientAnalyticsTab ingredientId={id!} ingredient={ingredient} />}
            {activeTab === 'documents' && <IngredientDocumentsTab ingredientId={id!} />}
          </div>
        </div>
      </div>
    </div>
  );
}
