import { useEffect, useState } from 'react';
import { MapPin, Users, CheckCircle, TrendingUp, Package } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { differenceInDays, format } from 'date-fns';

interface BatchOverviewTabProps {
  batch: any;
  onUpdate: () => void;
}

export default function BatchOverviewTab({ batch }: BatchOverviewTabProps) {
  const [ingredients, setIngredients] = useState<any[]>([]);

  useEffect(() => {
    fetchIngredients();
  }, [batch.id]);

  const fetchIngredients = async () => {
    try {
      const { data, error } = await supabase
        .from('batch_ingredients')
        .select('*, vendors(name)')
        .eq('batch_id', batch.id);

      if (error) throw error;
      setIngredients(data || []);
    } catch (error) {
      console.error('Error fetching ingredients:', error);
    }
  };

  const daysUntilExpiry = differenceInDays(new Date(batch.expiry_date), new Date());
  const stockPercentage = (batch.units_in_stock / batch.batch_size) * 100;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-cream/50 rounded-xl p-6">
          <h3 className="font-heading text-lg font-bold text-primary mb-4">Batch Information</h3>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                <Package className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-dark-brown/60">Batch Number</p>
                <p className="font-mono font-bold text-dark-brown">{batch.batch_number}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                <span className="text-xl">📅</span>
              </div>
              <div>
                <p className="text-sm text-dark-brown/60">Manufacturing Date</p>
                <p className="font-semibold text-dark-brown">
                  {format(new Date(batch.manufacturing_date), 'MMMM dd, yyyy')}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                <span className="text-xl">⏰</span>
              </div>
              <div>
                <p className="text-sm text-dark-brown/60">Expiry Date</p>
                <p className="font-semibold text-dark-brown">
                  {format(new Date(batch.expiry_date), 'MMMM dd, yyyy')}
                </p>
                <p className={`text-xs mt-1 font-semibold ${
                  daysUntilExpiry < 0 ? 'text-soft-red' :
                  daysUntilExpiry <= 30 ? 'text-accent' :
                  daysUntilExpiry <= 60 ? 'text-amber-500' : 'text-sage'
                }`}>
                  {daysUntilExpiry >= 0 ? `${daysUntilExpiry} days remaining` : 'Expired'}
                </p>
              </div>
            </div>

            {batch.storage_location && (
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <MapPin className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-dark-brown/60">Storage Location</p>
                  <p className="font-semibold text-dark-brown">{batch.storage_location}</p>
                </div>
              </div>
            )}

            {batch.qc_approved && (
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-sage/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <CheckCircle className="w-5 h-5 text-sage" />
                </div>
                <div>
                  <p className="text-sm text-dark-brown/60">Quality Control</p>
                  <p className="font-semibold text-sage">Approved</p>
                  {batch.qc_approved_date && (
                    <p className="text-xs text-dark-brown/60 mt-1">
                      on {format(new Date(batch.qc_approved_date), 'MMM dd, yyyy')}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-gradient-to-br from-primary to-sage rounded-xl p-6 text-white">
            <h3 className="font-heading text-lg font-bold mb-4">Current Stock Status</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-white/80 text-sm mb-1">Total Produced</p>
                <p className="text-3xl font-bold">{batch.batch_size}</p>
              </div>
              <div>
                <p className="text-white/80 text-sm mb-1">In Stock</p>
                <p className="text-3xl font-bold">{batch.units_in_stock}</p>
              </div>
              <div>
                <p className="text-white/80 text-sm mb-1">Sold</p>
                <p className="text-3xl font-bold">{batch.units_sold || 0}</p>
              </div>
              <div>
                <p className="text-white/80 text-sm mb-1">Damaged</p>
                <p className="text-3xl font-bold">{batch.units_damaged || 0}</p>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-white/20">
              <div className="flex items-center justify-between mb-2">
                <span className="text-white/80 text-sm">Stock Remaining</span>
                <span className="font-bold">{stockPercentage.toFixed(1)}%</span>
              </div>
              <div className="w-full bg-white/20 rounded-full h-3 overflow-hidden">
                <div
                  className="h-full bg-white transition-all"
                  style={{ width: `${stockPercentage}%` }}
                />
              </div>
            </div>
          </div>

          {batch.products && (
            <div className="bg-cream/50 rounded-xl p-6">
              <h3 className="font-heading text-lg font-bold text-primary mb-4">Product Details</h3>
              <div className="flex items-start gap-4">
                {batch.products.images && batch.products.images[0] && (
                  <img
                    src={batch.products.images[0]}
                    alt={batch.products.name}
                    className="w-20 h-20 rounded-lg object-cover"
                  />
                )}
                <div>
                  <p className="font-semibold text-dark-brown mb-1">{batch.products.name}</p>
                  <p className="text-sm text-dark-brown/60">
                    Batch: {batch.batch_number}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {ingredients.length > 0 && (
        <div className="bg-white border-2 border-dark-brown/5 rounded-xl p-6">
          <h3 className="font-heading text-lg font-bold text-primary mb-4">
            Ingredient Traceability
          </h3>
          <p className="text-sm text-dark-brown/60 mb-4">
            Complete ingredient lot tracking for full traceability
          </p>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-cream">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-bold text-dark-brown">Ingredient</th>
                  <th className="px-4 py-3 text-left text-sm font-bold text-dark-brown">Lot Number</th>
                  <th className="px-4 py-3 text-left text-sm font-bold text-dark-brown">Supplier Batch</th>
                  <th className="px-4 py-3 text-left text-sm font-bold text-dark-brown">Vendor</th>
                  <th className="px-4 py-3 text-left text-sm font-bold text-dark-brown">Quantity Used</th>
                  <th className="px-4 py-3 text-left text-sm font-bold text-dark-brown">Expiry</th>
                </tr>
              </thead>
              <tbody>
                {ingredients.map((ingredient, index) => (
                  <tr
                    key={ingredient.id}
                    className={`border-t border-dark-brown/5 ${
                      index % 2 === 0 ? 'bg-white' : 'bg-cream/20'
                    }`}
                  >
                    <td className="px-4 py-3 font-semibold text-dark-brown">
                      {ingredient.ingredient_name}
                    </td>
                    <td className="px-4 py-3 font-mono text-sm text-dark-brown/70">
                      {ingredient.lot_number || '-'}
                    </td>
                    <td className="px-4 py-3 font-mono text-sm text-dark-brown/70">
                      {ingredient.supplier_batch_number || '-'}
                    </td>
                    <td className="px-4 py-3 text-sm text-dark-brown/70">
                      {ingredient.vendors?.name || '-'}
                    </td>
                    <td className="px-4 py-3 text-sm text-dark-brown">
                      {ingredient.quantity_used ? `${ingredient.quantity_used} ${ingredient.unit}` : '-'}
                    </td>
                    <td className="px-4 py-3 text-sm text-dark-brown/70">
                      {ingredient.ingredient_expiry_date
                        ? format(new Date(ingredient.ingredient_expiry_date), 'MMM dd, yyyy')
                        : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
