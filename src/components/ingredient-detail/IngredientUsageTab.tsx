import { useEffect, useState } from 'react';
import { Beaker, Calendar, Package } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { format } from 'date-fns';
import { Link } from 'react-router-dom';

interface IngredientUsageTabProps {
  ingredientId: string;
  ingredient: any;
}

export default function IngredientUsageTab({ ingredientId, ingredient }: IngredientUsageTabProps) {
  const [usageLog, setUsageLog] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [totalUsed, setTotalUsed] = useState(0);

  useEffect(() => {
    fetchUsageLog();
    fetchProductsUsingIngredient();
  }, [ingredientId]);

  const fetchUsageLog = async () => {
    try {
      const { data, error } = await supabase
        .from('ingredient_usage')
        .select('*, batches(batch_number), products(name)')
        .eq('ingredient_id', ingredientId)
        .order('usage_date', { ascending: false });

      if (error) throw error;
      setUsageLog(data || []);

      const total = data.reduce((sum, u) => sum + (u.quantity || 0), 0);
      setTotalUsed(total);
    } catch (error) {
      console.error('Error fetching usage:', error);
    }
  };

  const fetchProductsUsingIngredient = async () => {
    try {
      const { data, error } = await supabase
        .from('product_ingredients')
        .select('*, products(id, name, images)')
        .eq('ingredient_name', ingredient.common_name);

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-primary/10 rounded-xl p-6">
          <p className="text-dark-brown/60 text-sm mb-1">Total Used (Lifetime)</p>
          <p className="text-3xl font-bold text-primary">
            {totalUsed.toFixed(2)} {ingredient.default_unit}
          </p>
        </div>

        <div className="bg-sage/10 rounded-xl p-6">
          <p className="text-dark-brown/60 text-sm mb-1">Usage Instances</p>
          <p className="text-3xl font-bold text-sage">{usageLog.length}</p>
        </div>

        <div className="bg-accent/10 rounded-xl p-6">
          <p className="text-dark-brown/60 text-sm mb-1">Used in Products</p>
          <p className="text-3xl font-bold text-accent">{products.length}</p>
        </div>
      </div>

      {products.length > 0 && (
        <div className="bg-white border-2 border-dark-brown/5 rounded-xl p-6">
          <h3 className="font-heading text-lg font-bold text-primary mb-4">Products Using This Ingredient</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {products.map(prod => (
              <Link
                key={prod.id}
                to={`/products/${prod.products.id}`}
                className="p-4 bg-cream/50 rounded-lg hover:shadow-soft transition-all"
              >
                <div className="flex items-center gap-3">
                  {prod.products.images && prod.products.images[0] ? (
                    <img
                      src={prod.products.images[0]}
                      alt={prod.products.name}
                      className="w-12 h-12 rounded-lg object-cover"
                    />
                  ) : (
                    <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                      <Beaker className="w-6 h-6 text-primary" />
                    </div>
                  )}
                  <div>
                    <p className="font-semibold text-dark-brown">{prod.products.name}</p>
                    <p className="text-sm text-dark-brown/60">
                      {prod.quantity} {prod.unit} per batch
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      <div className="bg-white border-2 border-dark-brown/5 rounded-xl p-6">
        <h3 className="font-heading text-lg font-bold text-primary mb-4">Usage History</h3>

        {usageLog.length > 0 ? (
          <div className="space-y-3">
            {usageLog.map(usage => (
              <div key={usage.id} className="p-4 bg-cream/50 rounded-lg">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Calendar className="w-4 h-4 text-dark-brown/60" />
                      <span className="font-semibold text-dark-brown">
                        {format(new Date(usage.usage_date), 'MMMM dd, yyyy')}
                      </span>
                    </div>
                    <p className="text-sm text-dark-brown/70 capitalize">
                      Used for: {usage.used_for?.replace('_', ' ')}
                    </p>
                  </div>
                  <span className="font-bold text-primary text-lg">
                    {usage.quantity} {ingredient.default_unit}
                  </span>
                </div>

                {usage.batches && (
                  <div className="mt-2 pt-2 border-t border-dark-brown/10">
                    <p className="text-sm text-dark-brown/60">
                      Batch: <Link to={`/batches/${usage.batch_id}`} className="font-mono text-primary hover:underline">
                        {usage.batches.batch_number}
                      </Link>
                    </p>
                  </div>
                )}

                {usage.products && (
                  <div className="mt-2 pt-2 border-t border-dark-brown/10">
                    <p className="text-sm text-dark-brown/60">
                      Product: <span className="font-semibold text-dark-brown">{usage.products.name}</span>
                    </p>
                  </div>
                )}

                {usage.notes && (
                  <div className="mt-2 pt-2 border-t border-dark-brown/10">
                    <p className="text-sm text-dark-brown/70 italic">{usage.notes}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Package className="w-16 h-16 text-dark-brown/20 mx-auto mb-4" />
            <p className="text-dark-brown/60">No usage recorded yet</p>
          </div>
        )}
      </div>
    </div>
  );
}
