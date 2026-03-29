import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Save, X } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

interface IngredientsTabProps {
  productId: string;
}

const ingredientTypes = [
  'Herb', 'Oil', 'Powder', 'Extract', 'Base', 'Preservative', 'Fragrance', 'Active', 'Other'
];

const units = ['g', 'ml', 'kg', 'L', '%', 'drops'];

const ayurvedicProperties = [
  'Cooling', 'Heating', 'Vata-balancing', 'Pitta-balancing', 'Kapha-balancing',
  'Anti-inflammatory', 'Antimicrobial', 'Moisturizing', 'Detoxifying', 'Rejuvenating'
];

export default function IngredientsTab({ productId }: IngredientsTabProps) {
  const { user } = useAuth();
  const [ingredients, setIngredients] = useState<any[]>([]);
  const [versions, setVersions] = useState<any[]>([]);
  const [currentVersion, setCurrentVersion] = useState<any>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    ingredient_name: '',
    botanical_name: '',
    type: '',
    quantity: '',
    unit: 'g',
    vendor: '',
    cost_per_unit: '',
    ayurvedic_properties: [] as string[],
    notes: '',
  });

  useEffect(() => {
    fetchData();
  }, [productId]);

  const fetchData = async () => {
    try {
      const [ingredientsRes, versionsRes] = await Promise.all([
        supabase
          .from('product_ingredients')
          .select('*')
          .eq('product_id', productId)
          .order('created_at', { ascending: true }),
        supabase
          .from('formula_versions')
          .select('*')
          .eq('product_id', productId)
          .order('created_at', { ascending: false }),
      ]);

      if (ingredientsRes.error) throw ingredientsRes.error;
      if (versionsRes.error) throw versionsRes.error;

      setIngredients(ingredientsRes.data || []);
      setVersions(versionsRes.data || []);

      const current = versionsRes.data?.find(v => v.is_current);
      setCurrentVersion(current);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editingId) {
        const { error } = await supabase
          .from('product_ingredients')
          .update({
            ...formData,
            quantity: parseFloat(formData.quantity) || 0,
            cost_per_unit: parseFloat(formData.cost_per_unit) || 0,
          })
          .eq('id', editingId);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('product_ingredients')
          .insert([{
            product_id: productId,
            ...formData,
            quantity: parseFloat(formData.quantity) || 0,
            cost_per_unit: parseFloat(formData.cost_per_unit) || 0,
          }]);

        if (error) throw error;
      }

      resetForm();
      fetchData();
    } catch (error) {
      console.error('Error saving ingredient:', error);
    }
  };

  const handleEdit = (ingredient: any) => {
    setFormData({
      ingredient_name: ingredient.ingredient_name,
      botanical_name: ingredient.botanical_name || '',
      type: ingredient.type || '',
      quantity: ingredient.quantity?.toString() || '',
      unit: ingredient.unit || 'g',
      vendor: ingredient.vendor || '',
      cost_per_unit: ingredient.cost_per_unit?.toString() || '',
      ayurvedic_properties: ingredient.ayurvedic_properties || [],
      notes: ingredient.notes || '',
    });
    setEditingId(ingredient.id);
    setShowAddModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this ingredient?')) return;

    try {
      const { error } = await supabase
        .from('product_ingredients')
        .delete()
        .eq('id', id);

      if (error) throw error;
      fetchData();
    } catch (error) {
      console.error('Error deleting ingredient:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      ingredient_name: '',
      botanical_name: '',
      type: '',
      quantity: '',
      unit: 'g',
      vendor: '',
      cost_per_unit: '',
      ayurvedic_properties: [],
      notes: '',
    });
    setEditingId(null);
    setShowAddModal(false);
  };

  const toggleProperty = (property: string) => {
    setFormData(prev => ({
      ...prev,
      ayurvedic_properties: prev.ayurvedic_properties.includes(property)
        ? prev.ayurvedic_properties.filter(p => p !== property)
        : [...prev.ayurvedic_properties, property],
    }));
  };

  const totalCost = ingredients.reduce((sum, ing) => {
    return sum + ((ing.quantity || 0) * (ing.cost_per_unit || 0));
  }, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="font-heading text-2xl font-bold text-primary">Ingredients List</h3>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-sage to-primary text-white rounded-xl font-semibold hover:shadow-soft transition-all"
        >
          <Plus className="w-5 h-5" />
          Add Ingredient
        </button>
      </div>

      <div className="bg-white rounded-xl border-2 border-dark-brown/5 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-cream/50 border-b-2 border-dark-brown/5">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold text-dark-brown">Ingredient</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-dark-brown">Type</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-dark-brown">Quantity</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-dark-brown">Vendor</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-dark-brown">Cost/Unit</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-dark-brown">Total Cost</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-dark-brown">Properties</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-dark-brown">Actions</th>
              </tr>
            </thead>
            <tbody>
              {ingredients.map((ingredient, index) => (
                <tr
                  key={ingredient.id}
                  className={`border-b border-dark-brown/5 ${
                    index % 2 === 0 ? 'bg-white' : 'bg-cream/20'
                  }`}
                >
                  <td className="px-4 py-3">
                    <p className="font-semibold text-dark-brown">{ingredient.ingredient_name}</p>
                    {ingredient.botanical_name && (
                      <p className="text-sm text-dark-brown/60 italic">{ingredient.botanical_name}</p>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-1 bg-accent/10 text-accent rounded-full text-xs font-semibold">
                      {ingredient.type || '-'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="font-semibold text-dark-brown">
                      {ingredient.quantity || 0} {ingredient.unit}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-dark-brown/70">
                    {ingredient.vendor || '-'}
                  </td>
                  <td className="px-4 py-3 text-sm font-semibold text-dark-brown">
                    ₹{ingredient.cost_per_unit?.toFixed(2) || '0.00'}
                  </td>
                  <td className="px-4 py-3 text-sm font-bold text-accent">
                    ₹{((ingredient.quantity || 0) * (ingredient.cost_per_unit || 0)).toFixed(2)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {(ingredient.ayurvedic_properties || []).slice(0, 2).map((prop: string) => (
                        <span
                          key={prop}
                          className="px-2 py-0.5 bg-sage/10 text-sage rounded text-xs font-semibold"
                        >
                          {prop}
                        </span>
                      ))}
                      {(ingredient.ayurvedic_properties || []).length > 2 && (
                        <span className="text-xs text-dark-brown/60">
                          +{(ingredient.ayurvedic_properties || []).length - 2}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(ingredient)}
                        className="p-2 text-accent hover:bg-accent/10 rounded-lg transition-colors"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(ingredient.id)}
                        className="p-2 text-soft-red hover:bg-soft-red/10 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-accent/5 border-t-2 border-accent/20">
              <tr>
                <td colSpan={5} className="px-4 py-3 text-right font-bold text-dark-brown">
                  Total Raw Material Cost:
                </td>
                <td className="px-4 py-3 font-bold text-xl text-accent">
                  ₹{totalCost.toFixed(2)}
                </td>
                <td colSpan={2}></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {ingredients.length === 0 && (
        <div className="text-center py-12 bg-cream/30 rounded-xl">
          <span className="text-6xl mb-4 block">🌿</span>
          <p className="text-dark-brown/60 mb-4">No ingredients added yet</p>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-6 py-3 bg-gradient-to-r from-sage to-primary text-white font-semibold rounded-xl hover:shadow-soft transition-all"
          >
            Add Your First Ingredient
          </button>
        </div>
      )}

      {showAddModal && (
        <div className="fixed inset-0 bg-primary/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-soft-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-gradient-to-r from-sage to-primary p-6 rounded-t-2xl flex items-center justify-between">
              <h3 className="font-heading text-2xl font-bold text-white">
                {editingId ? 'Edit Ingredient' : 'Add New Ingredient'}
              </h3>
              <button
                onClick={resetForm}
                className="w-10 h-10 bg-white/20 hover:bg-white/30 rounded-lg flex items-center justify-center transition-colors"
              >
                <X className="w-6 h-6 text-white" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-dark-brown mb-2">
                    Ingredient Name <span className="text-soft-red">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.ingredient_name}
                    onChange={(e) => setFormData({ ...formData, ingredient_name: e.target.value })}
                    placeholder="e.g., Neem Extract"
                    className="w-full px-4 py-3 border-2 border-dark-brown/10 rounded-xl focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-dark-brown mb-2">
                    Botanical Name
                  </label>
                  <input
                    type="text"
                    value={formData.botanical_name}
                    onChange={(e) => setFormData({ ...formData, botanical_name: e.target.value })}
                    placeholder="e.g., Azadirachta indica"
                    className="w-full px-4 py-3 border-2 border-dark-brown/10 rounded-xl focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-dark-brown mb-2">
                    Type
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-dark-brown/10 rounded-xl focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                  >
                    <option value="">Select type</option>
                    {ingredientTypes.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-dark-brown mb-2">
                    Quantity
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                    placeholder="100"
                    className="w-full px-4 py-3 border-2 border-dark-brown/10 rounded-xl focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-dark-brown mb-2">
                    Unit
                  </label>
                  <select
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-dark-brown/10 rounded-xl focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                  >
                    {units.map(unit => (
                      <option key={unit} value={unit}>{unit}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-dark-brown mb-2">
                    Vendor/Source
                  </label>
                  <input
                    type="text"
                    value={formData.vendor}
                    onChange={(e) => setFormData({ ...formData, vendor: e.target.value })}
                    placeholder="Supplier name"
                    className="w-full px-4 py-3 border-2 border-dark-brown/10 rounded-xl focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-dark-brown mb-2">
                    Cost per Unit (₹)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.cost_per_unit}
                    onChange={(e) => setFormData({ ...formData, cost_per_unit: e.target.value })}
                    placeholder="0.00"
                    className="w-full px-4 py-3 border-2 border-dark-brown/10 rounded-xl focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-dark-brown mb-2">
                  Ayurvedic Properties
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {ayurvedicProperties.map(property => (
                    <label
                      key={property}
                      className={`cursor-pointer px-3 py-2 rounded-lg border-2 transition-all ${
                        formData.ayurvedic_properties.includes(property)
                          ? 'border-sage bg-sage/10 text-sage font-semibold'
                          : 'border-dark-brown/10 hover:border-sage/50 text-dark-brown'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={formData.ayurvedic_properties.includes(property)}
                        onChange={() => toggleProperty(property)}
                        className="sr-only"
                      />
                      <span className="text-sm">{property}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-dark-brown mb-2">
                  Notes
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Additional notes about this ingredient..."
                  rows={3}
                  className="w-full px-4 py-3 border-2 border-dark-brown/10 rounded-xl focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20 resize-none"
                />
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={resetForm}
                  className="flex-1 px-6 py-3 bg-dark-brown/5 text-dark-brown font-semibold rounded-xl hover:bg-dark-brown/10 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-sage to-primary text-white font-semibold rounded-xl hover:shadow-soft-lg transition-all"
                >
                  {editingId ? 'Update Ingredient' : 'Add Ingredient'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
