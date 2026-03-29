import { useEffect, useState } from 'react';
import { Calendar, DollarSign, TrendingUp, Package } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { format } from 'date-fns';

interface IngredientPurchaseHistoryTabProps {
  ingredientId: string;
  ingredient: any;
}

export default function IngredientPurchaseHistoryTab({ ingredientId, ingredient }: IngredientPurchaseHistoryTabProps) {
  const [purchases, setPurchases] = useState<any[]>([]);
  const [stats, setStats] = useState({
    totalPurchases: 0,
    totalQuantity: 0,
    totalSpent: 0,
    avgCostPerUnit: 0,
  });

  useEffect(() => {
    fetchPurchases();
  }, [ingredientId]);

  const fetchPurchases = async () => {
    try {
      const { data, error } = await supabase
        .from('ingredient_stock')
        .select('*, vendors(name)')
        .eq('ingredient_id', ingredientId)
        .order('purchase_date', { ascending: false });

      if (error) throw error;
      setPurchases(data || []);

      const totalPurchases = data.length;
      const totalQuantity = data.reduce((sum, p) => sum + (p.original_quantity || 0), 0);
      const totalSpent = data.reduce((sum, p) => sum + ((p.cost_per_unit || 0) * (p.original_quantity || 0)), 0);
      const avgCostPerUnit = totalSpent / (totalQuantity || 1);

      setStats({ totalPurchases, totalQuantity, totalSpent, avgCostPerUnit });
    } catch (error) {
      console.error('Error fetching purchases:', error);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: any = {
      active: 'bg-sage/10 text-sage',
      used: 'bg-dark-brown/10 text-dark-brown',
      expired: 'bg-soft-red/10 text-soft-red',
    };
    return colors[status] || 'bg-dark-brown/10 text-dark-brown';
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-primary/10 rounded-xl p-6">
          <p className="text-dark-brown/60 text-sm mb-1">Total Purchases</p>
          <p className="text-3xl font-bold text-primary">{stats.totalPurchases}</p>
        </div>

        <div className="bg-sage/10 rounded-xl p-6">
          <p className="text-dark-brown/60 text-sm mb-1">Total Quantity</p>
          <p className="text-3xl font-bold text-sage">
            {stats.totalQuantity.toFixed(2)} {ingredient.default_unit}
          </p>
        </div>

        <div className="bg-accent/10 rounded-xl p-6">
          <p className="text-dark-brown/60 text-sm mb-1">Total Spent</p>
          <p className="text-3xl font-bold text-accent">₹{stats.totalSpent.toFixed(0)}</p>
        </div>

        <div className="bg-blue-500/10 rounded-xl p-6">
          <p className="text-dark-brown/60 text-sm mb-1">Avg Cost/Unit</p>
          <p className="text-3xl font-bold text-blue-500">₹{stats.avgCostPerUnit.toFixed(2)}</p>
        </div>
      </div>

      <div className="bg-white border-2 border-dark-brown/5 rounded-xl p-6">
        <h3 className="font-heading text-lg font-bold text-primary mb-4">Purchase Timeline</h3>

        {purchases.length > 0 ? (
          <div className="space-y-4">
            {purchases.map(purchase => (
              <div
                key={purchase.id}
                className="p-4 bg-cream/50 rounded-lg"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <Calendar className="w-5 h-5 text-primary" />
                      <h4 className="font-semibold text-dark-brown">
                        {format(new Date(purchase.purchase_date), 'MMMM dd, yyyy')}
                      </h4>
                    </div>
                    <p className="text-sm text-dark-brown/70">
                      <span className="font-semibold">{purchase.vendors?.name || 'Unknown Vendor'}</span>
                      {purchase.invoice_number && (
                        <span className="ml-2 text-dark-brown/60">• Invoice: {purchase.invoice_number}</span>
                      )}
                    </p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold capitalize ${getStatusColor(purchase.status)}`}>
                    {purchase.status}
                  </span>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-3 pt-3 border-t border-dark-brown/10">
                  <div>
                    <p className="text-xs text-dark-brown/60 mb-1">Quantity</p>
                    <p className="font-bold text-primary">
                      {purchase.original_quantity} {purchase.unit}
                    </p>
                    {purchase.status === 'active' && purchase.quantity < purchase.original_quantity && (
                      <p className="text-xs text-dark-brown/60 mt-1">
                        {purchase.quantity} {purchase.unit} remaining
                      </p>
                    )}
                  </div>
                  <div>
                    <p className="text-xs text-dark-brown/60 mb-1">Cost/Unit</p>
                    <p className="font-semibold text-dark-brown">
                      {purchase.cost_per_unit ? `₹${purchase.cost_per_unit}` : '-'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-dark-brown/60 mb-1">Total Cost</p>
                    <p className="font-semibold text-dark-brown">
                      {purchase.cost_per_unit
                        ? `₹${(purchase.cost_per_unit * purchase.original_quantity).toFixed(2)}`
                        : '-'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-dark-brown/60 mb-1">Expiry Date</p>
                    <p className="text-sm text-dark-brown">
                      {format(new Date(purchase.expiry_date), 'MMM dd, yyyy')}
                    </p>
                  </div>
                </div>

                {purchase.lot_number && (
                  <div className="mt-3 pt-3 border-t border-dark-brown/10">
                    <p className="text-xs text-dark-brown/60">
                      Lot: <span className="font-mono text-dark-brown">{purchase.lot_number}</span>
                    </p>
                  </div>
                )}

                {purchase.notes && (
                  <div className="mt-3 pt-3 border-t border-dark-brown/10">
                    <p className="text-sm text-dark-brown/70">{purchase.notes}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Package className="w-16 h-16 text-dark-brown/20 mx-auto mb-4" />
            <p className="text-dark-brown/60">No purchase history recorded</p>
          </div>
        )}
      </div>
    </div>
  );
}
