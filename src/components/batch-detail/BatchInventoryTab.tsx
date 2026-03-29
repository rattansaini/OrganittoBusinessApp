import { useEffect, useState } from 'react';
import { Plus, Package, TrendingDown, Calendar } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { format } from 'date-fns';

interface BatchInventoryTabProps {
  batchId: string;
  batch: any;
  onUpdate: () => void;
}

export default function BatchInventoryTab({ batchId, batch, onUpdate }: BatchInventoryTabProps) {
  const [dispatches, setDispatches] = useState<any[]>([]);
  const [adjustments, setAdjustments] = useState<any[]>([]);

  useEffect(() => {
    fetchDispatches();
    fetchAdjustments();
  }, [batchId]);

  const fetchDispatches = async () => {
    try {
      const { data, error } = await supabase
        .from('batch_dispatches')
        .select('*')
        .eq('batch_id', batchId)
        .order('dispatch_date', { ascending: false });

      if (error) throw error;
      setDispatches(data || []);
    } catch (error) {
      console.error('Error fetching dispatches:', error);
    }
  };

  const fetchAdjustments = async () => {
    try {
      const { data, error } = await supabase
        .from('batch_stock_adjustments')
        .select('*')
        .eq('batch_id', batchId)
        .order('adjustment_date', { ascending: false });

      if (error) throw error;
      setAdjustments(data || []);
    } catch (error) {
      console.error('Error fetching adjustments:', error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-primary to-sage rounded-xl p-6 text-white">
          <p className="text-white/80 text-sm mb-1">Total Units</p>
          <p className="text-3xl font-bold">{batch.batch_size}</p>
        </div>

        <div className="bg-sage/10 rounded-xl p-6">
          <p className="text-dark-brown/60 text-sm mb-1">In Stock</p>
          <p className="text-3xl font-bold text-sage">{batch.units_in_stock}</p>
        </div>

        <div className="bg-blue-500/10 rounded-xl p-6">
          <p className="text-dark-brown/60 text-sm mb-1">Sold/Dispatched</p>
          <p className="text-3xl font-bold text-blue-500">{batch.units_sold || 0}</p>
        </div>

        <div className="bg-soft-red/10 rounded-xl p-6">
          <p className="text-dark-brown/60 text-sm mb-1">Damaged</p>
          <p className="text-3xl font-bold text-soft-red">{batch.units_damaged || 0}</p>
        </div>
      </div>

      <div className="bg-white border-2 border-dark-brown/5 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-heading text-lg font-bold text-primary">Dispatch History</h3>
          <button className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-primary to-sage text-white rounded-xl font-semibold hover:shadow-soft-lg transition-all">
            <Plus className="w-4 h-4" />
            Record Dispatch
          </button>
        </div>

        {dispatches.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-cream">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-bold text-dark-brown">Date</th>
                  <th className="px-4 py-3 text-left text-sm font-bold text-dark-brown">Dispatch To</th>
                  <th className="px-4 py-3 text-left text-sm font-bold text-dark-brown">Quantity</th>
                  <th className="px-4 py-3 text-left text-sm font-bold text-dark-brown">Invoice #</th>
                  <th className="px-4 py-3 text-left text-sm font-bold text-dark-brown">Method</th>
                  <th className="px-4 py-3 text-left text-sm font-bold text-dark-brown">Status</th>
                </tr>
              </thead>
              <tbody>
                {dispatches.map((dispatch, index) => (
                  <tr
                    key={dispatch.id}
                    className={`border-t border-dark-brown/5 ${
                      index % 2 === 0 ? 'bg-white' : 'bg-cream/20'
                    }`}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-dark-brown/40" />
                        <span className="text-sm font-semibold text-dark-brown">
                          {format(new Date(dispatch.dispatch_date), 'MMM dd, yyyy')}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-semibold text-dark-brown">
                      {dispatch.dispatch_to}
                    </td>
                    <td className="px-4 py-3 font-bold text-primary">
                      {dispatch.quantity} units
                    </td>
                    <td className="px-4 py-3 text-sm text-dark-brown/70 font-mono">
                      {dispatch.invoice_number || '-'}
                    </td>
                    <td className="px-4 py-3 text-sm text-dark-brown/70">
                      {dispatch.dispatch_method || '-'}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                        dispatch.status === 'delivered'
                          ? 'bg-sage/10 text-sage'
                          : 'bg-accent/10 text-accent'
                      }`}>
                        {dispatch.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8">
            <Package className="w-12 h-12 text-dark-brown/20 mx-auto mb-2" />
            <p className="text-sm text-dark-brown/60 mb-4">No dispatches recorded</p>
            <button className="px-6 py-3 bg-gradient-to-r from-primary to-sage text-white rounded-xl font-semibold hover:shadow-soft-lg transition-all">
              Record First Dispatch
            </button>
          </div>
        )}
      </div>

      {adjustments.length > 0 && (
        <div className="bg-white border-2 border-dark-brown/5 rounded-xl p-6">
          <h3 className="font-heading text-lg font-bold text-primary mb-4">Stock Adjustments</h3>
          <div className="space-y-3">
            {adjustments.map(adjustment => (
              <div
                key={adjustment.id}
                className="p-4 bg-cream/50 rounded-lg flex items-start gap-4"
              >
                <div className="w-10 h-10 bg-soft-red/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <TrendingDown className="w-5 h-5 text-soft-red" />
                </div>
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-1">
                    <h4 className="font-semibold text-dark-brown capitalize">
                      {adjustment.adjustment_type}
                    </h4>
                    <span className="font-bold text-soft-red">-{adjustment.quantity} units</span>
                  </div>
                  <p className="text-sm text-dark-brown/70 mb-1">{adjustment.reason}</p>
                  <p className="text-xs text-dark-brown/60">
                    {format(new Date(adjustment.adjustment_date), 'MMM dd, yyyy')}
                  </p>
                  {adjustment.notes && (
                    <p className="text-xs text-dark-brown/60 mt-2 italic">{adjustment.notes}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
