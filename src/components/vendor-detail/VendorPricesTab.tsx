import { useEffect, useState } from 'react';
import { Plus, TrendingUp, Package, Edit, Trash2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface VendorPricesTabProps {
  vendorId: string;
}

export default function VendorPricesTab({ vendorId }: VendorPricesTabProps) {
  const [prices, setPrices] = useState<any[]>([]);

  useEffect(() => {
    fetchPrices();
  }, [vendorId]);

  const fetchPrices = async () => {
    try {
      const { data, error } = await supabase
        .from('vendor_prices')
        .select('*')
        .eq('vendor_id', vendorId)
        .order('product_name');

      if (error) throw error;
      setPrices(data || []);
    } catch (error) {
      console.error('Error fetching prices:', error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h3 className="font-heading text-xl font-bold text-primary">Price List</h3>
        <button className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-primary to-sage text-white rounded-xl font-semibold hover:shadow-soft-lg transition-all">
          <Plus className="w-5 h-5" />
          Add Price Item
        </button>
      </div>

      {prices.length > 0 ? (
        <div className="bg-white border-2 border-dark-brown/5 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-cream">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-bold text-dark-brown">Product/Service</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-dark-brown">Category</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-dark-brown">Unit</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-dark-brown">Price</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-dark-brown">MOQ</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-dark-brown">Lead Time</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-dark-brown">Last Updated</th>
                  <th className="px-6 py-4 text-right text-sm font-bold text-dark-brown">Actions</th>
                </tr>
              </thead>
              <tbody>
                {prices.map((price, index) => (
                  <tr
                    key={price.id}
                    className={`border-t border-dark-brown/5 hover:bg-cream/50 transition-colors ${
                      index % 2 === 0 ? 'bg-white' : 'bg-cream/20'
                    }`}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Package className="w-4 h-4 text-primary" />
                        <span className="font-semibold text-dark-brown">{price.product_name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-xs font-semibold">
                        {price.category || 'General'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-dark-brown/70">{price.unit}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-lg font-bold text-sage">₹{parseFloat(price.price).toFixed(2)}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-dark-brown">{price.moq || '-'}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-dark-brown">
                        {price.lead_time ? `${price.lead_time} days` : '-'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-dark-brown/60">
                        {new Date(price.updated_at).toLocaleDateString()}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button className="p-2 hover:bg-primary/10 text-primary rounded-lg transition-colors">
                          <TrendingUp className="w-4 h-4" />
                        </button>
                        <button className="p-2 hover:bg-accent/10 text-accent rounded-lg transition-colors">
                          <Edit className="w-4 h-4" />
                        </button>
                        <button className="p-2 hover:bg-soft-red/10 text-soft-red rounded-lg transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="text-center py-12 bg-white border-2 border-dark-brown/5 rounded-xl">
          <Package className="w-16 h-16 text-dark-brown/20 mx-auto mb-4" />
          <h3 className="font-heading text-xl font-bold text-dark-brown/60 mb-2">
            No price items found
          </h3>
          <p className="text-dark-brown/40 mb-4">Add price items to track vendor pricing</p>
          <button className="px-6 py-3 bg-gradient-to-r from-primary to-sage text-white rounded-xl font-semibold hover:shadow-soft-lg transition-all">
            Add Price Item
          </button>
        </div>
      )}
    </div>
  );
}
