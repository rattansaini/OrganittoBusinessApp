import { useState, useEffect } from 'react';
import { X, Plus } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { format, addMonths } from 'date-fns';

interface AddIngredientStockModalProps {
  vendors: any[];
  onClose: () => void;
  onSuccess: () => void;
}

export default function AddIngredientStockModal({ vendors, onClose, onSuccess }: AddIngredientStockModalProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [ingredients, setIngredients] = useState<any[]>([]);
  const [showNewIngredient, setShowNewIngredient] = useState(false);
  const [selectedIngredient, setSelectedIngredient] = useState<any>(null);

  const [formData, setFormData] = useState({
    ingredientId: '',
    purchaseDate: format(new Date(), 'yyyy-MM-dd'),
    quantity: '',
    expiryDate: '',
    lotNumber: '',
    vendorId: '',
    costPerUnit: '',
    invoiceNumber: '',
    storageLocation: '',
    notes: '',
  });

  const [newIngredientData, setNewIngredientData] = useState({
    commonName: '',
    botanicalName: '',
    type: 'herb',
    category: 'raw_material',
    defaultUnit: 'kg',
    typicalShelfLifeMonths: '24',
    reorderLevel: '',
    preferredVendorId: '',
    storageConditions: '',
  });

  useEffect(() => {
    fetchIngredients();
  }, []);

  useEffect(() => {
    if (selectedIngredient) {
      const shelfLife = selectedIngredient.typical_shelf_life_months || 24;
      const expiry = addMonths(new Date(formData.purchaseDate), shelfLife);
      setFormData(prev => ({
        ...prev,
        expiryDate: format(expiry, 'yyyy-MM-dd'),
      }));
    }
  }, [selectedIngredient, formData.purchaseDate]);

  const fetchIngredients = async () => {
    try {
      const { data, error } = await supabase
        .from('ingredients')
        .select('*')
        .order('common_name');

      if (error) throw error;
      setIngredients(data || []);
    } catch (error) {
      console.error('Error fetching ingredients:', error);
    }
  };

  const handleCreateNewIngredient = async () => {
    if (!newIngredientData.commonName) {
      alert('Please enter ingredient name');
      return null;
    }

    try {
      const { data, error } = await supabase
        .from('ingredients')
        .insert([
          {
            common_name: newIngredientData.commonName,
            botanical_name: newIngredientData.botanicalName,
            type: newIngredientData.type,
            category: newIngredientData.category,
            default_unit: newIngredientData.defaultUnit,
            typical_shelf_life_months: parseInt(newIngredientData.typicalShelfLifeMonths),
            reorder_level: newIngredientData.reorderLevel ? parseFloat(newIngredientData.reorderLevel) : 0,
            preferred_vendor_id: newIngredientData.preferredVendorId || null,
            storage_conditions: newIngredientData.storageConditions,
          },
        ])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating ingredient:', error);
      alert('Error creating ingredient');
      return null;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    let ingredientId = formData.ingredientId;

    if (showNewIngredient) {
      const newIngredient = await handleCreateNewIngredient();
      if (!newIngredient) return;
      ingredientId = newIngredient.id;
    }

    if (!ingredientId || !formData.quantity || !formData.purchaseDate || !formData.expiryDate) {
      alert('Please fill in all required fields');
      return;
    }

    setLoading(true);

    try {
      const quantity = parseFloat(formData.quantity);
      const unit = selectedIngredient?.default_unit || newIngredientData.defaultUnit;

      const { error } = await supabase
        .from('ingredient_stock')
        .insert([
          {
            ingredient_id: ingredientId,
            purchase_date: formData.purchaseDate,
            expiry_date: formData.expiryDate,
            quantity: quantity,
            original_quantity: quantity,
            unit: unit,
            lot_number: formData.lotNumber,
            vendor_id: formData.vendorId || null,
            cost_per_unit: formData.costPerUnit ? parseFloat(formData.costPerUnit) : null,
            invoice_number: formData.invoiceNumber,
            storage_location: formData.storageLocation,
            status: 'active',
            notes: formData.notes,
            purchased_by: user?.id,
          },
        ]);

      if (error) throw error;

      onSuccess();
    } catch (error) {
      console.error('Error adding stock:', error);
      alert('Error adding stock. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-primary/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-soft-lg max-w-4xl w-full my-8">
        <div className="sticky top-0 bg-white border-b-2 border-dark-brown/5 px-6 py-4 rounded-t-2xl flex items-center justify-between">
          <h2 className="font-heading text-2xl font-bold text-primary">
            {showNewIngredient ? 'Add New Ingredient & Stock' : 'Add Ingredient Stock'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-dark-brown/5 rounded-lg transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
          {!showNewIngredient ? (
            <div>
              <div className="flex items-center justify-between mb-4">
                <label className="block text-sm font-semibold text-dark-brown">
                  Select Ingredient <span className="text-soft-red">*</span>
                </label>
                <button
                  type="button"
                  onClick={() => setShowNewIngredient(true)}
                  className="text-sm text-primary font-semibold hover:underline"
                >
                  + Or add new ingredient
                </button>
              </div>
              <select
                value={formData.ingredientId}
                onChange={(e) => {
                  setFormData({ ...formData, ingredientId: e.target.value });
                  const ingredient = ingredients.find(ing => ing.id === e.target.value);
                  setSelectedIngredient(ingredient);
                }}
                required
                className="w-full px-4 py-3 border-2 border-dark-brown/10 rounded-xl focus:border-accent focus:outline-none"
              >
                <option value="">Select an ingredient</option>
                {ingredients.map(ingredient => (
                  <option key={ingredient.id} value={ingredient.id}>
                    {ingredient.common_name} {ingredient.botanical_name && `(${ingredient.botanical_name})`}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div className="bg-cream/50 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-heading text-lg font-bold text-primary">New Ingredient Details</h3>
                <button
                  type="button"
                  onClick={() => setShowNewIngredient(false)}
                  className="text-sm text-dark-brown/60 hover:text-dark-brown"
                >
                  Cancel
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-dark-brown mb-2">
                    Common Name <span className="text-soft-red">*</span>
                  </label>
                  <input
                    type="text"
                    value={newIngredientData.commonName}
                    onChange={(e) => setNewIngredientData({ ...newIngredientData, commonName: e.target.value })}
                    placeholder="e.g., Ashwagandha Powder"
                    required
                    className="w-full px-4 py-3 border-2 border-dark-brown/10 rounded-xl focus:border-accent focus:outline-none"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-dark-brown mb-2">
                    Botanical/Scientific Name
                  </label>
                  <input
                    type="text"
                    value={newIngredientData.botanicalName}
                    onChange={(e) => setNewIngredientData({ ...newIngredientData, botanicalName: e.target.value })}
                    placeholder="e.g., Withania somnifera"
                    className="w-full px-4 py-3 border-2 border-dark-brown/10 rounded-xl focus:border-accent focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-dark-brown mb-2">
                    Type <span className="text-soft-red">*</span>
                  </label>
                  <select
                    value={newIngredientData.type}
                    onChange={(e) => setNewIngredientData({ ...newIngredientData, type: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-dark-brown/10 rounded-xl focus:border-accent focus:outline-none"
                  >
                    <option value="herb">Herb</option>
                    <option value="oil">Oil</option>
                    <option value="powder">Powder</option>
                    <option value="extract">Extract</option>
                    <option value="base">Base</option>
                    <option value="preservative">Preservative</option>
                    <option value="fragrance">Fragrance</option>
                    <option value="active">Active Ingredient</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-dark-brown mb-2">
                    Category <span className="text-soft-red">*</span>
                  </label>
                  <select
                    value={newIngredientData.category}
                    onChange={(e) => setNewIngredientData({ ...newIngredientData, category: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-dark-brown/10 rounded-xl focus:border-accent focus:outline-none"
                  >
                    <option value="raw_material">Raw Material</option>
                    <option value="active_ingredient">Active Ingredient</option>
                    <option value="base">Base</option>
                    <option value="preservative">Preservative</option>
                    <option value="packaging">Packaging</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-dark-brown mb-2">
                    Default Unit <span className="text-soft-red">*</span>
                  </label>
                  <select
                    value={newIngredientData.defaultUnit}
                    onChange={(e) => setNewIngredientData({ ...newIngredientData, defaultUnit: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-dark-brown/10 rounded-xl focus:border-accent focus:outline-none"
                  >
                    <option value="kg">kg (Kilograms)</option>
                    <option value="g">g (Grams)</option>
                    <option value="L">L (Liters)</option>
                    <option value="ml">ml (Milliliters)</option>
                    <option value="pieces">Pieces</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-dark-brown mb-2">
                    Typical Shelf Life (months)
                  </label>
                  <input
                    type="number"
                    value={newIngredientData.typicalShelfLifeMonths}
                    onChange={(e) => setNewIngredientData({ ...newIngredientData, typicalShelfLifeMonths: e.target.value })}
                    min="1"
                    className="w-full px-4 py-3 border-2 border-dark-brown/10 rounded-xl focus:border-accent focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-dark-brown mb-2">
                    Reorder Level
                  </label>
                  <input
                    type="number"
                    value={newIngredientData.reorderLevel}
                    onChange={(e) => setNewIngredientData({ ...newIngredientData, reorderLevel: e.target.value })}
                    placeholder="Minimum stock threshold"
                    step="0.01"
                    className="w-full px-4 py-3 border-2 border-dark-brown/10 rounded-xl focus:border-accent focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-dark-brown mb-2">
                    Preferred Vendor
                  </label>
                  <select
                    value={newIngredientData.preferredVendorId}
                    onChange={(e) => setNewIngredientData({ ...newIngredientData, preferredVendorId: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-dark-brown/10 rounded-xl focus:border-accent focus:outline-none"
                  >
                    <option value="">Select vendor</option>
                    {vendors.map(vendor => (
                      <option key={vendor.id} value={vendor.id}>
                        {vendor.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-dark-brown mb-2">
                    Storage Conditions
                  </label>
                  <textarea
                    value={newIngredientData.storageConditions}
                    onChange={(e) => setNewIngredientData({ ...newIngredientData, storageConditions: e.target.value })}
                    placeholder="e.g., Store in cool, dry place away from direct sunlight"
                    rows={2}
                    className="w-full px-4 py-3 border-2 border-dark-brown/10 rounded-xl focus:border-accent focus:outline-none resize-none"
                  />
                </div>
              </div>
            </div>
          )}

          <div className="border-t-2 border-dark-brown/5 pt-6">
            <h3 className="font-heading text-lg font-bold text-primary mb-4">Stock Purchase Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-dark-brown mb-2">
                  Purchase Date <span className="text-soft-red">*</span>
                </label>
                <input
                  type="date"
                  value={formData.purchaseDate}
                  onChange={(e) => setFormData({ ...formData, purchaseDate: e.target.value })}
                  max={format(new Date(), 'yyyy-MM-dd')}
                  required
                  className="w-full px-4 py-3 border-2 border-dark-brown/10 rounded-xl focus:border-accent focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-dark-brown mb-2">
                  Quantity Purchased <span className="text-soft-red">*</span>
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                    placeholder="Amount"
                    step="0.01"
                    min="0"
                    required
                    className="flex-1 px-4 py-3 border-2 border-dark-brown/10 rounded-xl focus:border-accent focus:outline-none"
                  />
                  <div className="px-4 py-3 bg-dark-brown/5 rounded-xl font-semibold text-dark-brown flex items-center">
                    {selectedIngredient?.default_unit || newIngredientData.defaultUnit}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-dark-brown mb-2">
                  Expiry Date <span className="text-soft-red">*</span>
                </label>
                <input
                  type="date"
                  value={formData.expiryDate}
                  onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                  min={formData.purchaseDate}
                  required
                  className="w-full px-4 py-3 border-2 border-dark-brown/10 rounded-xl focus:border-accent focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-dark-brown mb-2">
                  Lot/Batch Number
                </label>
                <input
                  type="text"
                  value={formData.lotNumber}
                  onChange={(e) => setFormData({ ...formData, lotNumber: e.target.value })}
                  placeholder="Supplier's lot number"
                  className="w-full px-4 py-3 border-2 border-dark-brown/10 rounded-xl focus:border-accent focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-dark-brown mb-2">
                  Vendor <span className="text-soft-red">*</span>
                </label>
                <select
                  value={formData.vendorId}
                  onChange={(e) => setFormData({ ...formData, vendorId: e.target.value })}
                  required
                  className="w-full px-4 py-3 border-2 border-dark-brown/10 rounded-xl focus:border-accent focus:outline-none"
                >
                  <option value="">Select vendor</option>
                  {vendors.map(vendor => (
                    <option key={vendor.id} value={vendor.id}>
                      {vendor.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-dark-brown mb-2">
                  Cost per Unit
                </label>
                <input
                  type="number"
                  value={formData.costPerUnit}
                  onChange={(e) => setFormData({ ...formData, costPerUnit: e.target.value })}
                  placeholder="₹ per unit"
                  step="0.01"
                  min="0"
                  className="w-full px-4 py-3 border-2 border-dark-brown/10 rounded-xl focus:border-accent focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-dark-brown mb-2">
                  Invoice Number
                </label>
                <input
                  type="text"
                  value={formData.invoiceNumber}
                  onChange={(e) => setFormData({ ...formData, invoiceNumber: e.target.value })}
                  placeholder="Purchase invoice number"
                  className="w-full px-4 py-3 border-2 border-dark-brown/10 rounded-xl focus:border-accent focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-dark-brown mb-2">
                  Storage Location
                </label>
                <input
                  type="text"
                  value={formData.storageLocation}
                  onChange={(e) => setFormData({ ...formData, storageLocation: e.target.value })}
                  placeholder="e.g., Section B, Shelf 5"
                  className="w-full px-4 py-3 border-2 border-dark-brown/10 rounded-xl focus:border-accent focus:outline-none"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-dark-brown mb-2">
                  Notes
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Quality observations, storage instructions, etc."
                  rows={3}
                  className="w-full px-4 py-3 border-2 border-dark-brown/10 rounded-xl focus:border-accent focus:outline-none resize-none"
                />
              </div>
            </div>
          </div>
        </form>

        <div className="sticky bottom-0 bg-cream/90 backdrop-blur-sm border-t-2 border-dark-brown/5 px-6 py-4 rounded-b-2xl flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-6 py-3 bg-white border-2 border-dark-brown/10 text-dark-brown font-semibold rounded-xl hover:bg-dark-brown/5 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="flex-1 px-6 py-3 bg-gradient-to-r from-sage to-primary text-white font-semibold rounded-xl hover:shadow-soft-lg transition-all disabled:opacity-50"
          >
            {loading ? 'Adding...' : 'Add to Inventory'}
          </button>
        </div>
      </div>
    </div>
  );
}
