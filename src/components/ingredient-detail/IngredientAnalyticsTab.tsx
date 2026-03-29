import { useEffect, useState } from 'react';
import { TrendingUp, TrendingDown, DollarSign, AlertCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface IngredientAnalyticsTabProps {
  ingredientId: string;
  ingredient: any;
}

export default function IngredientAnalyticsTab({ ingredientId, ingredient }: IngredientAnalyticsTabProps) {
  const [analytics, setAnalytics] = useState<any>({
    turnoverRate: 0,
    wasteQuantity: 0,
    wasteCost: 0,
    minPrice: 0,
    maxPrice: 0,
    avgPrice: 0,
    currentPrice: 0,
    totalUsed: 0,
    totalPurchased: 0,
  });

  useEffect(() => {
    fetchAnalytics();
  }, [ingredientId]);

  const fetchAnalytics = async () => {
    try {
      const [stockResult, usageResult] = await Promise.all([
        supabase
          .from('ingredient_stock')
          .select('*')
          .eq('ingredient_id', ingredientId),
        supabase
          .from('ingredient_usage')
          .select('quantity')
          .eq('ingredient_id', ingredientId)
      ]);

      if (stockResult.error) throw stockResult.error;
      if (usageResult.error) throw usageResult.error;

      const stock = stockResult.data || [];
      const usage = usageResult.data || [];

      const expiredStock = stock.filter(s => s.status === 'expired');
      const wasteQuantity = expiredStock.reduce((sum, s) => sum + (s.quantity || 0), 0);
      const wasteCost = expiredStock.reduce(
        (sum, s) => sum + ((s.cost_per_unit || 0) * (s.quantity || 0)),
        0
      );

      const prices = stock.map(s => s.cost_per_unit).filter(p => p > 0);
      const minPrice = prices.length > 0 ? Math.min(...prices) : 0;
      const maxPrice = prices.length > 0 ? Math.max(...prices) : 0;
      const avgPrice = prices.length > 0 ? prices.reduce((a, b) => a + b, 0) / prices.length : 0;

      const recentStock = stock
        .filter(s => s.cost_per_unit > 0)
        .sort((a, b) => new Date(b.purchase_date).getTime() - new Date(a.purchase_date).getTime());
      const currentPrice = recentStock.length > 0 ? recentStock[0].cost_per_unit : 0;

      const totalUsed = usage.reduce((sum, u) => sum + (u.quantity || 0), 0);
      const totalPurchased = stock.reduce((sum, s) => sum + (s.original_quantity || 0), 0);

      setAnalytics({
        turnoverRate: totalPurchased > 0 ? (totalUsed / totalPurchased) * 100 : 0,
        wasteQuantity,
        wasteCost,
        minPrice,
        maxPrice,
        avgPrice,
        currentPrice,
        totalUsed,
        totalPurchased,
      });
    } catch (error) {
      console.error('Error fetching analytics:', error);
    }
  };

  const wastePercentage = analytics.totalPurchased > 0
    ? (analytics.wasteQuantity / analytics.totalPurchased) * 100
    : 0;

  const priceVsAvg = analytics.avgPrice > 0
    ? ((analytics.currentPrice - analytics.avgPrice) / analytics.avgPrice) * 100
    : 0;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="bg-primary/10 rounded-xl p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-dark-brown/60 text-sm">Turnover Rate</p>
            <TrendingUp className="w-5 h-5 text-primary" />
          </div>
          <p className="text-3xl font-bold text-primary">{analytics.turnoverRate.toFixed(1)}%</p>
          <p className="text-xs text-dark-brown/60 mt-1">Usage efficiency</p>
        </div>

        <div className="bg-soft-red/10 rounded-xl p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-dark-brown/60 text-sm">Waste Quantity</p>
            <AlertCircle className="w-5 h-5 text-soft-red" />
          </div>
          <p className="text-3xl font-bold text-soft-red">
            {analytics.wasteQuantity.toFixed(2)} {ingredient.default_unit}
          </p>
          <p className="text-xs text-dark-brown/60 mt-1">{wastePercentage.toFixed(1)}% of total purchased</p>
        </div>

        <div className="bg-accent/10 rounded-xl p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-dark-brown/60 text-sm">Waste Cost</p>
            <DollarSign className="w-5 h-5 text-accent" />
          </div>
          <p className="text-3xl font-bold text-accent">₹{analytics.wasteCost.toFixed(0)}</p>
          <p className="text-xs text-dark-brown/60 mt-1">Lost value from expiry</p>
        </div>
      </div>

      <div className="bg-white border-2 border-dark-brown/5 rounded-xl p-6">
        <h3 className="font-heading text-lg font-bold text-primary mb-4">Cost Analysis</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="p-4 bg-cream/50 rounded-lg">
              <p className="text-sm text-dark-brown/60 mb-1">Minimum Price Paid</p>
              <p className="text-2xl font-bold text-sage">₹{analytics.minPrice.toFixed(2)}</p>
            </div>

            <div className="p-4 bg-cream/50 rounded-lg">
              <p className="text-sm text-dark-brown/60 mb-1">Maximum Price Paid</p>
              <p className="text-2xl font-bold text-soft-red">₹{analytics.maxPrice.toFixed(2)}</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="p-4 bg-cream/50 rounded-lg">
              <p className="text-sm text-dark-brown/60 mb-1">Average Price</p>
              <p className="text-2xl font-bold text-primary">₹{analytics.avgPrice.toFixed(2)}</p>
            </div>

            <div className="p-4 bg-cream/50 rounded-lg">
              <p className="text-sm text-dark-brown/60 mb-1">Current Price vs Average</p>
              <div className="flex items-center gap-2">
                <p className={`text-2xl font-bold ${priceVsAvg > 0 ? 'text-soft-red' : 'text-sage'}`}>
                  {priceVsAvg > 0 ? '+' : ''}{priceVsAvg.toFixed(1)}%
                </p>
                {priceVsAvg > 0 ? (
                  <TrendingUp className="w-5 h-5 text-soft-red" />
                ) : (
                  <TrendingDown className="w-5 h-5 text-sage" />
                )}
              </div>
              <p className="text-xs text-dark-brown/60 mt-1">₹{analytics.currentPrice.toFixed(2)} per unit</p>
            </div>
          </div>
        </div>
      </div>

      {wastePercentage > 10 && (
        <div className="bg-accent/10 border-2 border-accent/20 rounded-xl p-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-6 h-6 text-accent flex-shrink-0 mt-1" />
            <div>
              <h4 className="font-semibold text-dark-brown mb-2">Waste Reduction Recommendations</h4>
              <ul className="space-y-2 text-sm text-dark-brown/70">
                <li>• Consider reducing purchase quantities to match usage rate</li>
                <li>• Implement FIFO (First In, First Out) more strictly</li>
                <li>• Review storage conditions to extend shelf life</li>
                <li>• Adjust reorder level to: {(analytics.totalUsed / 6).toFixed(2)} {ingredient.default_unit} (based on 6-month usage)</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white border-2 border-dark-brown/5 rounded-xl p-6">
        <h3 className="font-heading text-lg font-bold text-primary mb-4">Usage Statistics</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-cream/50 rounded-lg text-center">
            <p className="text-sm text-dark-brown/60 mb-2">Total Purchased</p>
            <p className="text-3xl font-bold text-primary">
              {analytics.totalPurchased.toFixed(2)}
            </p>
            <p className="text-sm text-dark-brown/60 mt-1">{ingredient.default_unit}</p>
          </div>

          <div className="p-4 bg-cream/50 rounded-lg text-center">
            <p className="text-sm text-dark-brown/60 mb-2">Total Used</p>
            <p className="text-3xl font-bold text-sage">
              {analytics.totalUsed.toFixed(2)}
            </p>
            <p className="text-sm text-dark-brown/60 mt-1">{ingredient.default_unit}</p>
          </div>

          <div className="p-4 bg-cream/50 rounded-lg text-center">
            <p className="text-sm text-dark-brown/60 mb-2">Utilization Rate</p>
            <p className="text-3xl font-bold text-accent">
              {analytics.turnoverRate.toFixed(1)}%
            </p>
            <p className="text-sm text-dark-brown/60 mt-1">Used vs Purchased</p>
          </div>
        </div>
      </div>
    </div>
  );
}
