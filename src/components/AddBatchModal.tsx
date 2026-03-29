import { useState, useEffect } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { format, addMonths } from 'date-fns';

interface AddBatchModalProps {
  products: any[];
  onClose: () => void;
  onSuccess: () => void;
}

export default function AddBatchModal({ products, onClose, onSuccess }: AddBatchModalProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [formData, setFormData] = useState({
    batchNumber: '',
    manufacturingDate: format(new Date(), 'yyyy-MM-dd'),
    batchSize: '',
    expiryDate: '',
    storageLocation: '',
    qcNotes: '',
  });
  const [ingredients, setIngredients] = useState<any[]>([]);
  const [qcChecklist, setQcChecklist] = useState({
    ingredientsVerified: false,
    formulaFollowed: false,
    phTestPassed: false,
    visualInspectionPassed: false,
    packagingChecked: false,
    labelsApplied: false,
    batchApproved: false,
  });

  useEffect(() => {
    if (selectedProduct) {
      generateBatchNumber();
      calculateExpiryDate();
      loadProductIngredients();
    }
  }, [selectedProduct]);

  const generateBatchNumber = () => {
    const date = format(new Date(), 'yyyyMMdd');
    const productCode = selectedProduct?.name?.substring(0, 3).toUpperCase() || 'PRD';
    const seq = '001';
    setFormData(prev => ({
      ...prev,
      batchNumber: `BT-${productCode}-${date}-${seq}`,
    }));
  };

  const calculateExpiryDate = () => {
    const shelfLife = selectedProduct?.shelf_life || 24;
    const expiry = addMonths(new Date(formData.manufacturingDate), shelfLife);
    setFormData(prev => ({
      ...prev,
      expiryDate: format(expiry, 'yyyy-MM-dd'),
    }));
  };

  const loadProductIngredients = async () => {
    if (!selectedProduct?.id) return;

    try {
      const { data, error } = await supabase
        .from('product_ingredients')
        .select('*')
        .eq('product_id', selectedProduct.id);

      if (error) throw error;

      if (data && data.length > 0) {
        setIngredients(
          data.map(ing => ({
            name: ing.ingredient_name,
            lotNumber: '',
            supplierBatchNumber: '',
            vendorId: null,
            ingredientExpiryDate: '',
            quantityUsed: ing.quantity || '',
            unit: ing.unit || 'kg',
          }))
        );
      } else {
        setIngredients([]);
      }
    } catch (error) {
      console.error('Error loading ingredients:', error);
    }
  };

  const addIngredient = () => {
    setIngredients([
      ...ingredients,
      {
        name: '',
        lotNumber: '',
        supplierBatchNumber: '',
        vendorId: null,
        ingredientExpiryDate: '',
        quantityUsed: '',
        unit: 'kg',
      },
    ]);
  };

  const removeIngredient = (index: number) => {
    setIngredients(ingredients.filter((_, i) => i !== index));
  };

  const updateIngredient = (index: number, field: string, value: any) => {
    const updated = [...ingredients];
    updated[index] = { ...updated[index], [field]: value };
    setIngredients(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedProduct || !formData.batchNumber || !formData.batchSize) {
      alert('Please fill in all required fields');
      return;
    }

    setLoading(true);

    try {
      const { data: batchData, error: batchError } = await supabase
        .from('batches')
        .insert([
          {
            batch_number: formData.batchNumber,
            product_id: selectedProduct.id,
            manufacturing_date: formData.manufacturingDate,
            expiry_date: formData.expiryDate,
            batch_size: parseInt(formData.batchSize),
            units_in_stock: parseInt(formData.batchSize),
            storage_location: formData.storageLocation,
            qc_checklist: qcChecklist,
            qc_notes: formData.qcNotes,
            qc_approved: qcChecklist.batchApproved,
            status: 'active',
            created_by: user?.id,
          },
        ])
        .select()
        .single();

      if (batchError) throw batchError;

      if (ingredients.length > 0 && batchData) {
        const ingredientRecords = ingredients
          .filter(ing => ing.name)
          .map(ing => ({
            batch_id: batchData.id,
            ingredient_name: ing.name,
            lot_number: ing.lotNumber,
            supplier_batch_number: ing.supplierBatchNumber,
            vendor_id: ing.vendorId,
            ingredient_expiry_date: ing.ingredientExpiryDate || null,
            quantity_used: ing.quantityUsed ? parseFloat(ing.quantityUsed) : null,
            unit: ing.unit,
          }));

        if (ingredientRecords.length > 0) {
          const { error: ingredientsError } = await supabase
            .from('batch_ingredients')
            .insert(ingredientRecords);

          if (ingredientsError) throw ingredientsError;
        }
      }

      onSuccess();
    } catch (error) {
      console.error('Error creating batch:', error);
      alert('Error creating batch. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-primary/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-soft-lg max-w-5xl w-full my-8">
        <div className="sticky top-0 bg-white border-b-2 border-dark-brown/5 px-6 py-4 rounded-t-2xl flex items-center justify-between">
          <h2 className="font-heading text-2xl font-bold text-primary">Create New Batch</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-dark-brown/5 rounded-lg transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
          <div>
            <h3 className="font-heading text-lg font-bold text-primary mb-4">Batch Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-dark-brown mb-2">
                  Product <span className="text-soft-red">*</span>
                </label>
                <select
                  value={selectedProduct?.id || ''}
                  onChange={(e) => {
                    const product = products.find(p => p.id === e.target.value);
                    setSelectedProduct(product);
                  }}
                  required
                  className="w-full px-4 py-3 border-2 border-dark-brown/10 rounded-xl focus:border-accent focus:outline-none"
                >
                  <option value="">Select a product</option>
                  {products.map(product => (
                    <option key={product.id} value={product.id}>
                      {product.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-dark-brown mb-2">
                  Batch Number <span className="text-soft-red">*</span>
                </label>
                <input
                  type="text"
                  value={formData.batchNumber}
                  onChange={(e) => setFormData({ ...formData, batchNumber: e.target.value })}
                  placeholder="BT-PRD-20241215-001"
                  required
                  className="w-full px-4 py-3 border-2 border-dark-brown/10 rounded-xl focus:border-accent focus:outline-none font-mono"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-dark-brown mb-2">
                  Batch Size (units) <span className="text-soft-red">*</span>
                </label>
                <input
                  type="number"
                  value={formData.batchSize}
                  onChange={(e) => setFormData({ ...formData, batchSize: e.target.value })}
                  placeholder="500"
                  required
                  min="1"
                  className="w-full px-4 py-3 border-2 border-dark-brown/10 rounded-xl focus:border-accent focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-dark-brown mb-2">
                  Manufacturing Date <span className="text-soft-red">*</span>
                </label>
                <input
                  type="date"
                  value={formData.manufacturingDate}
                  onChange={(e) => {
                    setFormData({ ...formData, manufacturingDate: e.target.value });
                    if (selectedProduct) calculateExpiryDate();
                  }}
                  max={format(new Date(), 'yyyy-MM-dd')}
                  required
                  className="w-full px-4 py-3 border-2 border-dark-brown/10 rounded-xl focus:border-accent focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-dark-brown mb-2">
                  Expiry Date <span className="text-soft-red">*</span>
                </label>
                <input
                  type="date"
                  value={formData.expiryDate}
                  onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                  required
                  className="w-full px-4 py-3 border-2 border-dark-brown/10 rounded-xl focus:border-accent focus:outline-none"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-dark-brown mb-2">
                  Storage Location
                </label>
                <input
                  type="text"
                  value={formData.storageLocation}
                  onChange={(e) => setFormData({ ...formData, storageLocation: e.target.value })}
                  placeholder="e.g., Section A, Shelf 3"
                  className="w-full px-4 py-3 border-2 border-dark-brown/10 rounded-xl focus:border-accent focus:outline-none"
                />
              </div>
            </div>
          </div>

          <div className="border-t-2 border-dark-brown/5 pt-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-heading text-lg font-bold text-primary">
                Ingredients Used (Lot Tracking)
              </h3>
              <button
                type="button"
                onClick={addIngredient}
                className="flex items-center gap-2 px-3 py-2 bg-primary/10 hover:bg-primary/20 text-primary rounded-lg font-semibold transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add Ingredient
              </button>
            </div>

            {ingredients.length > 0 ? (
              <div className="space-y-4">
                {ingredients.map((ingredient, index) => (
                  <div key={index} className="bg-cream/50 rounded-xl p-4">
                    <div className="flex items-start justify-between mb-3">
                      <h4 className="font-semibold text-dark-brown">Ingredient #{index + 1}</h4>
                      <button
                        type="button"
                        onClick={() => removeIngredient(index)}
                        className="p-1 hover:bg-soft-red/10 text-soft-red rounded transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-dark-brown mb-1">
                          Ingredient Name
                        </label>
                        <input
                          type="text"
                          value={ingredient.name}
                          onChange={(e) => updateIngredient(index, 'name', e.target.value)}
                          placeholder="e.g., Ashwagandha Powder"
                          className="w-full px-3 py-2 border-2 border-dark-brown/10 rounded-lg focus:border-accent focus:outline-none text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-dark-brown mb-1">
                          Lot Number
                        </label>
                        <input
                          type="text"
                          value={ingredient.lotNumber}
                          onChange={(e) => updateIngredient(index, 'lotNumber', e.target.value)}
                          placeholder="Internal lot number"
                          className="w-full px-3 py-2 border-2 border-dark-brown/10 rounded-lg focus:border-accent focus:outline-none text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-dark-brown mb-1">
                          Supplier Batch Number
                        </label>
                        <input
                          type="text"
                          value={ingredient.supplierBatchNumber}
                          onChange={(e) => updateIngredient(index, 'supplierBatchNumber', e.target.value)}
                          placeholder="Supplier's batch"
                          className="w-full px-3 py-2 border-2 border-dark-brown/10 rounded-lg focus:border-accent focus:outline-none text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-dark-brown mb-1">
                          Quantity Used
                        </label>
                        <div className="flex gap-2">
                          <input
                            type="number"
                            value={ingredient.quantityUsed}
                            onChange={(e) => updateIngredient(index, 'quantityUsed', e.target.value)}
                            placeholder="Amount"
                            step="0.01"
                            className="flex-1 px-3 py-2 border-2 border-dark-brown/10 rounded-lg focus:border-accent focus:outline-none text-sm"
                          />
                          <select
                            value={ingredient.unit}
                            onChange={(e) => updateIngredient(index, 'unit', e.target.value)}
                            className="px-3 py-2 border-2 border-dark-brown/10 rounded-lg focus:border-accent focus:outline-none text-sm"
                          >
                            <option value="kg">kg</option>
                            <option value="g">g</option>
                            <option value="l">l</option>
                            <option value="ml">ml</option>
                          </select>
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-dark-brown mb-1">
                          Ingredient Expiry Date
                        </label>
                        <input
                          type="date"
                          value={ingredient.ingredientExpiryDate}
                          onChange={(e) => updateIngredient(index, 'ingredientExpiryDate', e.target.value)}
                          className="w-full px-3 py-2 border-2 border-dark-brown/10 rounded-lg focus:border-accent focus:outline-none text-sm"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-dark-brown/60 text-center py-4">
                No ingredients added yet. Add ingredients to enable full traceability.
              </p>
            )}
          </div>

          <div className="border-t-2 border-dark-brown/5 pt-6">
            <h3 className="font-heading text-lg font-bold text-primary mb-4">Quality Control</h3>
            <div className="bg-cream/50 rounded-xl p-4 space-y-3">
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={qcChecklist.ingredientsVerified}
                  onChange={(e) => setQcChecklist({ ...qcChecklist, ingredientsVerified: e.target.checked })}
                  className="w-5 h-5 text-sage focus:ring-sage rounded"
                />
                <span className="text-sm font-semibold text-dark-brown">All ingredients verified</span>
              </label>
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={qcChecklist.formulaFollowed}
                  onChange={(e) => setQcChecklist({ ...qcChecklist, formulaFollowed: e.target.checked })}
                  className="w-5 h-5 text-sage focus:ring-sage rounded"
                />
                <span className="text-sm font-semibold text-dark-brown">Formula followed correctly</span>
              </label>
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={qcChecklist.phTestPassed}
                  onChange={(e) => setQcChecklist({ ...qcChecklist, phTestPassed: e.target.checked })}
                  className="w-5 h-5 text-sage focus:ring-sage rounded"
                />
                <span className="text-sm font-semibold text-dark-brown">pH test passed (if applicable)</span>
              </label>
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={qcChecklist.visualInspectionPassed}
                  onChange={(e) => setQcChecklist({ ...qcChecklist, visualInspectionPassed: e.target.checked })}
                  className="w-5 h-5 text-sage focus:ring-sage rounded"
                />
                <span className="text-sm font-semibold text-dark-brown">Visual inspection passed</span>
              </label>
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={qcChecklist.packagingChecked}
                  onChange={(e) => setQcChecklist({ ...qcChecklist, packagingChecked: e.target.checked })}
                  className="w-5 h-5 text-sage focus:ring-sage rounded"
                />
                <span className="text-sm font-semibold text-dark-brown">Packaging quality checked</span>
              </label>
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={qcChecklist.labelsApplied}
                  onChange={(e) => setQcChecklist({ ...qcChecklist, labelsApplied: e.target.checked })}
                  className="w-5 h-5 text-sage focus:ring-sage rounded"
                />
                <span className="text-sm font-semibold text-dark-brown">Labels applied correctly</span>
              </label>
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={qcChecklist.batchApproved}
                  onChange={(e) => setQcChecklist({ ...qcChecklist, batchApproved: e.target.checked })}
                  className="w-5 h-5 text-sage focus:ring-sage rounded"
                />
                <span className="text-sm font-semibold text-dark-brown">Batch approved for distribution</span>
              </label>

              <div className="pt-3 border-t border-dark-brown/10">
                <label className="block text-sm font-semibold text-dark-brown mb-2">
                  QC Notes
                </label>
                <textarea
                  value={formData.qcNotes}
                  onChange={(e) => setFormData({ ...formData, qcNotes: e.target.value })}
                  placeholder="Any additional quality control notes..."
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
            {loading ? 'Creating...' : 'Create Batch'}
          </button>
        </div>
      </div>
    </div>
  );
}
