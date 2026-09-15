import { useEffect, useState } from 'react';
import { Package, AlertTriangle, Plus, Save, X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import StatsCard from '../components/StatsCard';
import { TableSkeleton } from '../components/LoadingState';
import AdminOnly from '../components/AdminOnly';

interface InventoryItem {
  id: string;
  product_name: string;
  sku: string | null;
  quantity_available: number;
  reorder_level: number;
  updated_at: string;
}

export default function Inventory() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editQty, setEditQty] = useState('');
  const [editReorder, setEditReorder] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [newProduct, setNewProduct] = useState({ product_name: '', sku: '', quantity_available: '', reorder_level: '10' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchInventory();
  }, []);

  const fetchInventory = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('finished_goods_inventory')
        .select('*')
        .order('product_name', { ascending: true });

      if (error) throw error;
      setItems(data || []);
    } catch (error) {
      console.error('Error fetching inventory:', error);
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (item: InventoryItem) => {
    setEditingId(item.id);
    setEditQty(item.quantity_available.toString());
    setEditReorder(item.reorder_level.toString());
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditQty('');
    setEditReorder('');
  };

  const saveEdit = async (id: string) => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('finished_goods_inventory')
        .update({
          quantity_available: parseInt(editQty, 10) || 0,
          reorder_level: parseInt(editReorder, 10) || 0,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (error) throw error;
      await fetchInventory();
      cancelEdit();
    } catch (error) {
      console.error('Error updating inventory:', error);
    } finally {
      setSaving(false);
    }
  };

  const addProduct = async () => {
    if (!newProduct.product_name.trim()) return;
    setSaving(true);
    try {
      const { error } = await supabase.from('finished_goods_inventory').insert({
        product_name: newProduct.product_name.trim(),
        sku: newProduct.sku.trim() || null,
        quantity_available: parseInt(newProduct.quantity_available, 10) || 0,
        reorder_level: parseInt(newProduct.reorder_level, 10) || 10,
      });

      if (error) throw error;
      setNewProduct({ product_name: '', sku: '', quantity_available: '', reorder_level: '10' });
      setShowAddForm(false);
      await fetchInventory();
    } catch (error) {
      console.error('Error adding product:', error);
    } finally {
      setSaving(false);
    }
  };

  const totalUnits = items.reduce((sum, i) => sum + i.quantity_available, 0);
  const lowStockItems = items.filter((i) => i.quantity_available <= i.reorder_level);

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="font-heading text-4xl md:text-5xl font-bold text-primary mb-2">
            Finished Goods Inventory
          </h2>
          <p className="text-dark-brown/70 text-lg">Track stock levels for packed, ready-to-ship products</p>
        </div>
        <AdminOnly>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="flex items-center gap-2 px-4 py-2.5 bg-primary text-cream rounded-xl font-medium hover:bg-primary/90 transition-all duration-300 shadow-soft"
          >
            <Plus className="w-4 h-4" />
            Add Product
          </button>
        </AdminOnly>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <StatsCard
          title="Total Units in Stock"
          value={totalUnits.toString()}
          icon={Package}
          iconBgColor="bg-primary/20"
          iconColor="text-primary"
          valueColor="text-primary"
        />
        <StatsCard
          title="Products Tracked"
          value={items.length.toString()}
          icon={Package}
          iconBgColor="bg-accent/20"
          iconColor="text-accent"
          valueColor="text-dark-brown"
        />
        <StatsCard
          title="Low Stock Alerts"
          value={lowStockItems.length.toString()}
          icon={AlertTriangle}
          iconBgColor="bg-soft-red/20"
          iconColor="text-soft-red"
          valueColor={lowStockItems.length > 0 ? 'text-soft-red' : 'text-dark-brown'}
        />
      </div>

      {showAddForm && (
        <div className="bg-panel border border-edge rounded-2xl shadow-e2 p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-heading text-xl font-bold text-primary">Add New Product</h3>
            <button onClick={() => setShowAddForm(false)} className="text-dark-brown/60 hover:text-dark-brown">
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <input
              type="text"
              placeholder="Product name"
              value={newProduct.product_name}
              onChange={(e) => setNewProduct({ ...newProduct, product_name: e.target.value })}
              className="px-4 py-2.5 rounded-xl border-2 border-primary/10 focus:border-primary/30 focus:outline-none bg-white"
            />
            <input
              type="text"
              placeholder="SKU (optional)"
              value={newProduct.sku}
              onChange={(e) => setNewProduct({ ...newProduct, sku: e.target.value })}
              className="px-4 py-2.5 rounded-xl border-2 border-primary/10 focus:border-primary/30 focus:outline-none bg-white"
            />
            <input
              type="number"
              placeholder="Stock quantity"
              value={newProduct.quantity_available}
              onChange={(e) => setNewProduct({ ...newProduct, quantity_available: e.target.value })}
              className="px-4 py-2.5 rounded-xl border-2 border-primary/10 focus:border-primary/30 focus:outline-none bg-white"
            />
            <input
              type="number"
              placeholder="Reorder level"
              value={newProduct.reorder_level}
              onChange={(e) => setNewProduct({ ...newProduct, reorder_level: e.target.value })}
              className="px-4 py-2.5 rounded-xl border-2 border-primary/10 focus:border-primary/30 focus:outline-none bg-white"
            />
          </div>
          <button
            onClick={addProduct}
            disabled={saving || !newProduct.product_name.trim()}
            className="mt-4 flex items-center gap-2 px-5 py-2.5 bg-primary text-cream rounded-xl font-medium hover:bg-primary/90 transition-all duration-300 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            Save Product
          </button>
        </div>
      )}

      <div className="bg-panel border border-edge rounded-2xl shadow-e2 overflow-hidden">
        {loading ? (
          <TableSkeleton rows={6} columns={5} />
        ) : items.length === 0 ? (
          <div className="p-12 text-center text-dark-brown/60">
            No products yet. Click "Add Product" to start tracking stock.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-primary/10 text-left">
                  <th className="px-6 py-4 text-sm font-semibold text-dark-brown/70">Product</th>
                  <th className="px-6 py-4 text-sm font-semibold text-dark-brown/70">SKU</th>
                  <th className="px-6 py-4 text-sm font-semibold text-dark-brown/70 text-right">Stock</th>
                  <th className="px-6 py-4 text-sm font-semibold text-dark-brown/70 text-right">Reorder Level</th>
                  <th className="px-6 py-4 text-sm font-semibold text-dark-brown/70">Status</th>
                  <th className="px-6 py-4 text-sm font-semibold text-dark-brown/70 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => {
                  const isLow = item.quantity_available <= item.reorder_level;
                  const isEditing = editingId === item.id;
                  return (
                    <tr key={item.id} className="border-b border-primary/5 hover:bg-cream/60 transition-colors">
                      <td className="px-6 py-4 font-semibold text-dark-brown">{item.product_name}</td>
                      <td className="px-6 py-4 text-dark-brown/70">{item.sku || '—'}</td>
                      <td className="px-6 py-4 text-right">
                        {isEditing ? (
                          <input
                            type="number"
                            value={editQty}
                            onChange={(e) => setEditQty(e.target.value)}
                            className="w-20 px-2 py-1 rounded-lg border-2 border-primary/20 text-right focus:outline-none focus:border-primary/40"
                          />
                        ) : (
                          <span className={`font-semibold ${isLow ? 'text-soft-red' : 'text-dark-brown'}`}>
                            {item.quantity_available}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        {isEditing ? (
                          <input
                            type="number"
                            value={editReorder}
                            onChange={(e) => setEditReorder(e.target.value)}
                            className="w-20 px-2 py-1 rounded-lg border-2 border-primary/20 text-right focus:outline-none focus:border-primary/40"
                          />
                        ) : (
                          <span className="text-dark-brown/70">{item.reorder_level}</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {isLow ? (
                          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-soft-red/20 text-soft-red">
                            <AlertTriangle className="w-3 h-3" />
                            Low Stock
                          </span>
                        ) : (
                          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-sage/20 text-sage">
                            In Stock
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        {isEditing ? (
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => saveEdit(item.id)}
                              disabled={saving}
                              className="px-3 py-1.5 bg-primary text-cream rounded-lg text-sm font-medium hover:bg-primary/90 transition-all duration-300"
                            >
                              Save
                            </button>
                            <button
                              onClick={cancelEdit}
                              className="px-3 py-1.5 bg-dark-brown/10 text-dark-brown rounded-lg text-sm font-medium hover:bg-dark-brown/20 transition-all duration-300"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <AdminOnly>
                            <button
                              onClick={() => startEdit(item)}
                              className="px-3 py-1.5 bg-white border-2 border-primary/10 text-dark-brown rounded-lg text-sm font-medium hover:border-primary/30 transition-all duration-300"
                            >
                              Update Stock
                            </button>
                          </AdminOnly>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
