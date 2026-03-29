import { useEffect, useState } from 'react';
import { MapPin, Calendar, DollarSign, AlertTriangle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { differenceInDays, format } from 'date-fns';

interface IngredientOverviewTabProps {
  ingredientId: string;
  ingredient: any;
  summary: any;
  onUpdate: () => void;
}

export default function IngredientOverviewTab({ ingredientId, ingredient, summary }: IngredientOverviewTabProps) {
  const [lots, setLots] = useState<any[]>([]);

  useEffect(() => {
    fetchLots();
  }, [ingredientId]);

  const fetchLots = async () => {
    try {
      const { data, error } = await supabase
        .from('ingredient_stock')
        .select('*, vendors(name)')
        .eq('ingredient_id', ingredientId)
        .eq('status', 'active')
        .order('expiry_date', { ascending: true });

      if (error) throw error;
      setLots(data || []);
    } catch (error) {
      console.error('Error fetching lots:', error);
    }
  };

  const getExpiryColor = (expiryDate: string) => {
    const daysUntilExpiry = differenceInDays(new Date(expiryDate), new Date());
    if (daysUntilExpiry < 0) return 'text-soft-red';
    if (daysUntilExpiry <= 15) return 'text-soft-red';
    if (daysUntilExpiry <= 30) return 'text-accent';
    if (daysUntilExpiry <= 60) return 'text-amber-500';
    return 'text-sage';
  };

  const stockPercentage = ingredient.reorder_level > 0
    ? ((summary?.total_stock || 0) / ingredient.reorder_level) * 100
    : 100;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-gradient-to-br from-primary to-sage rounded-xl p-6 text-white">
          <h3 className="font-heading text-lg font-bold mb-4">Current Stock Status</h3>
          <div className="text-center">
            <p className="text-white/80 text-sm mb-2">Total Quantity</p>
            <p className="text-5xl font-bold mb-1">{summary?.total_stock || 0}</p>
            <p className="text-xl text-white/90">{ingredient.default_unit}</p>
          </div>

          {ingredient.reorder_level > 0 && (
            <div className="mt-6 pt-6 border-t border-white/20">
              <div className="flex items-center justify-between mb-2">
                <span className="text-white/80 text-sm">Stock Level</span>
                <span className="font-bold">
                  {stockPercentage >= 100 ? 'Good' : stockPercentage >= 50 ? 'Low' : 'Critical'}
                </span>
              </div>
              <div className="w-full bg-white/20 rounded-full h-3 overflow-hidden">
                <div
                  className={`h-full transition-all ${
                    stockPercentage >= 100 ? 'bg-white' : stockPercentage >= 50 ? 'bg-amber-300' : 'bg-red-300'
                  }`}
                  style={{ width: `${Math.min(stockPercentage, 100)}%` }}
                />
              </div>
              <p className="text-white/70 text-xs mt-2">
                Reorder level: {ingredient.reorder_level} {ingredient.default_unit}
              </p>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="bg-cream/50 rounded-xl p-4">
            <h4 className="font-semibold text-dark-brown mb-3">Ingredient Information</h4>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-dark-brown/60">Type</span>
                <span className="text-sm font-semibold text-dark-brown capitalize">{ingredient.type}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-dark-brown/60">Category</span>
                <span className="text-sm font-semibold text-dark-brown capitalize">
                  {ingredient.category?.replace('_', ' ')}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-dark-brown/60">Default Unit</span>
                <span className="text-sm font-semibold text-dark-brown">{ingredient.default_unit}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-dark-brown/60">Shelf Life</span>
                <span className="text-sm font-semibold text-dark-brown">
                  {ingredient.typical_shelf_life_months} months
                </span>
              </div>
              {ingredient.preferred_vendor_id && (
                <div className="flex justify-between">
                  <span className="text-sm text-dark-brown/60">Preferred Vendor</span>
                  <span className="text-sm font-semibold text-dark-brown">{ingredient.vendors?.name}</span>
                </div>
              )}
            </div>
          </div>

          {ingredient.storage_conditions && (
            <div className="bg-cream/50 rounded-xl p-4">
              <h4 className="font-semibold text-dark-brown mb-2">Storage Conditions</h4>
              <p className="text-sm text-dark-brown/70">{ingredient.storage_conditions}</p>
            </div>
          )}
        </div>
      </div>

      {summary?.earliest_expiry && (
        <div className="bg-accent/10 border-2 border-accent/20 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-6 h-6 text-accent" />
            <div>
              <p className="font-semibold text-dark-brown">Expiry Alert</p>
              <p className="text-sm text-dark-brown/70">
                Earliest lot expires on {format(new Date(summary.earliest_expiry), 'MMMM dd, yyyy')}
                {' '}
                ({differenceInDays(new Date(summary.earliest_expiry), new Date())} days remaining)
              </p>
            </div>
          </div>
        </div>
      )}

      {lots.length > 0 && (
        <div className="bg-white border-2 border-dark-brown/5 rounded-xl p-6">
          <h3 className="font-heading text-lg font-bold text-primary mb-4">Stock by Lot/Batch</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-cream">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-bold text-dark-brown">Lot Number</th>
                  <th className="px-4 py-3 text-left text-sm font-bold text-dark-brown">Purchase Date</th>
                  <th className="px-4 py-3 text-left text-sm font-bold text-dark-brown">Expiry Date</th>
                  <th className="px-4 py-3 text-left text-sm font-bold text-dark-brown">Quantity</th>
                  <th className="px-4 py-3 text-left text-sm font-bold text-dark-brown">Vendor</th>
                  <th className="px-4 py-3 text-left text-sm font-bold text-dark-brown">Storage</th>
                </tr>
              </thead>
              <tbody>
                {lots.map((lot, index) => {
                  const daysUntilExpiry = differenceInDays(new Date(lot.expiry_date), new Date());
                  return (
                    <tr
                      key={lot.id}
                      className={`border-t border-dark-brown/5 ${
                        index % 2 === 0 ? 'bg-white' : 'bg-cream/20'
                      } ${daysUntilExpiry < 15 ? 'bg-soft-red/5' : ''}`}
                    >
                      <td className="px-4 py-3 font-mono text-sm text-dark-brown">
                        {lot.lot_number || '-'}
                      </td>
                      <td className="px-4 py-3 text-sm text-dark-brown/70">
                        {format(new Date(lot.purchase_date), 'MMM dd, yyyy')}
                      </td>
                      <td className="px-4 py-3">
                        <p className={`font-semibold ${getExpiryColor(lot.expiry_date)}`}>
                          {format(new Date(lot.expiry_date), 'MMM dd, yyyy')}
                        </p>
                        <p className={`text-xs ${getExpiryColor(lot.expiry_date)}`}>
                          {daysUntilExpiry >= 0 ? `${daysUntilExpiry}d left` : 'Expired'}
                        </p>
                      </td>
                      <td className="px-4 py-3 font-bold text-primary">
                        {lot.quantity} {lot.unit}
                      </td>
                      <td className="px-4 py-3 text-sm text-dark-brown/70">
                        {lot.vendors?.name || '-'}
                      </td>
                      <td className="px-4 py-3 text-sm text-dark-brown/70">
                        {lot.storage_location || '-'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
