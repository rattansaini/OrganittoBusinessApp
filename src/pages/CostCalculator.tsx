import { useState, useEffect } from 'react';
import { Save, Download, Calculator, Plus, Trash2 } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, LineChart, Line, XAxis, YAxis, CartesianGrid, BarChart, Bar } from 'recharts';
import Header from '../components/Header';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface Ingredient {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  costPerUnit: number;
  total: number;
}

interface PackagingComponent {
  id: string;
  name: string;
  quantity: number;
  costPerPiece: number;
  total: number;
}

interface OtherCost {
  id: string;
  description: string;
  amount: number;
}

export default function CostCalculator() {
  const { user } = useAuth();
  const [products, setProducts] = useState<any[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<string>('');
  const [productName, setProductName] = useState('');
  const [batchSize, setBatchSize] = useState(100);

  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [packagingComponents, setPackagingComponents] = useState<PackagingComponent[]>([
    { id: '1', name: 'Primary Container (Bottle/Jar)', quantity: 1, costPerPiece: 0, total: 0 },
    { id: '2', name: 'Label/Sticker', quantity: 1, costPerPiece: 0, total: 0 },
    { id: '3', name: 'Secondary Packaging (Box)', quantity: 1, costPerPiece: 0, total: 0 },
  ]);
  const [otherPackaging, setOtherPackaging] = useState<OtherCost[]>([]);

  const [labourHours, setLabourHours] = useState(0);
  const [labourCostPerHour, setLabourCostPerHour] = useState(0);
  const [electricity, setElectricity] = useState(0);
  const [water, setWater] = useState(0);
  const [equipmentDepreciation, setEquipmentDepreciation] = useState(0);
  const [otherUtilities, setOtherUtilities] = useState(0);
  const [qcCost, setQcCost] = useState(0);

  const [monthlyRent, setMonthlyRent] = useState(0);
  const [rentAllocation, setRentAllocation] = useState(10);
  const [batchesPerMonth, setBatchesPerMonth] = useState(1);
  const [monthlySalaries, setMonthlySalaries] = useState(0);
  const [salaryAllocation, setSalaryAllocation] = useState(10);
  const [annualCompliance, setAnnualCompliance] = useState(0);
  const [annualBatches, setAnnualBatches] = useState(12);
  const [otherOverheads, setOtherOverheads] = useState<OtherCost[]>([]);

  const [marketingPerUnit, setMarketingPerUnit] = useState(0);
  const [shippingMaterial, setShippingMaterial] = useState(0);
  const [courierCharges, setCourierCharges] = useState(0);
  const [platformFees, setPlatformFees] = useState(0);

  const [savedCalculations, setSavedCalculations] = useState<any[]>([]);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [calculationName, setCalculationName] = useState('');

  useEffect(() => {
    fetchProducts();
    fetchSavedCalculations();
  }, []);

  useEffect(() => {
    if (selectedProduct) {
      loadProductData();
    }
  }, [selectedProduct]);

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('name');

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  const fetchSavedCalculations = async () => {
    try {
      const { data, error } = await supabase
        .from('product_cost_calculations')
        .select('*')
        .eq('is_draft', false)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSavedCalculations(data || []);
    } catch (error) {
      console.error('Error fetching calculations:', error);
    }
  };

  const loadProductData = async () => {
    const product = products.find(p => p.id === selectedProduct);
    if (!product) return;

    setProductName(product.name);

    try {
      const { data: ingredientsData } = await supabase
        .from('product_ingredients')
        .select('*')
        .eq('product_id', selectedProduct);

      if (ingredientsData && ingredientsData.length > 0) {
        const importedIngredients: Ingredient[] = ingredientsData.map((ing: any) => ({
          id: ing.id,
          name: ing.ingredient_name,
          quantity: ing.quantity || 0,
          unit: ing.unit || 'g',
          costPerUnit: ing.cost_per_unit || 0,
          total: (ing.quantity || 0) * (ing.cost_per_unit || 0),
        }));
        setIngredients(importedIngredients);
      }
    } catch (error) {
      console.error('Error loading product data:', error);
    }
  };

  const addIngredient = () => {
    setIngredients([...ingredients, {
      id: Date.now().toString(),
      name: '',
      quantity: 0,
      unit: 'g',
      costPerUnit: 0,
      total: 0,
    }]);
  };

  const updateIngredient = (id: string, field: string, value: any) => {
    setIngredients(ingredients.map(ing => {
      if (ing.id === id) {
        const updated = { ...ing, [field]: value };
        updated.total = updated.quantity * updated.costPerUnit;
        return updated;
      }
      return ing;
    }));
  };

  const deleteIngredient = (id: string) => {
    setIngredients(ingredients.filter(ing => ing.id !== id));
  };

  const updatePackaging = (id: string, field: string, value: any) => {
    setPackagingComponents(packagingComponents.map(comp => {
      if (comp.id === id) {
        const updated = { ...comp, [field]: value };
        updated.total = updated.quantity * updated.costPerPiece;
        return updated;
      }
      return comp;
    }));
  };

  const addOtherPackaging = () => {
    setOtherPackaging([...otherPackaging, {
      id: Date.now().toString(),
      description: '',
      amount: 0,
    }]);
  };

  const addOtherOverhead = () => {
    setOtherOverheads([...otherOverheads, {
      id: Date.now().toString(),
      description: '',
      amount: 0,
    }]);
  };

  const rawMaterialTotal = ingredients.reduce((sum, ing) => sum + ing.total, 0);
  const packagingTotal = [...packagingComponents.map(c => c.total), ...otherPackaging.map(o => o.amount)].reduce((sum, val) => sum + val, 0);

  const labourTotal = labourHours * labourCostPerHour;
  const utilitiesTotal = electricity + water + equipmentDepreciation + otherUtilities;
  const manufacturingTotal = labourTotal + utilitiesTotal + qcCost;

  const rentPerBatch = batchesPerMonth > 0 ? (monthlyRent * rentAllocation / 100) / batchesPerMonth : 0;
  const salaryPerBatch = batchesPerMonth > 0 ? (monthlySalaries * salaryAllocation / 100) / batchesPerMonth : 0;
  const compliancePerBatch = annualBatches > 0 ? annualCompliance / annualBatches : 0;
  const otherOverheadsTotal = otherOverheads.reduce((sum, oh) => sum + oh.amount, 0);
  const overheadTotal = rentPerBatch + salaryPerBatch + compliancePerBatch + otherOverheadsTotal;

  const fulfillmentPerUnit = shippingMaterial + courierCharges;
  const marketingTotal = (marketingPerUnit + fulfillmentPerUnit) * batchSize;

  const totalBatchCost = rawMaterialTotal + packagingTotal + manufacturingTotal + overheadTotal + marketingTotal;
  const costPerUnit = batchSize > 0 ? totalBatchCost / batchSize : 0;

  const costBreakdown = [
    { name: 'Raw Materials', value: rawMaterialTotal, color: '#8B4513' },
    { name: 'Packaging', value: packagingTotal, color: '#D2691E' },
    { name: 'Manufacturing', value: manufacturingTotal, color: '#CD853F' },
    { name: 'Overheads', value: overheadTotal, color: '#DEB887' },
    { name: 'Marketing', value: marketingTotal, color: '#F4A460' },
  ].filter(item => item.value > 0);

  const calculatePrice = (marginPercent: number) => {
    const sellingPrice = costPerUnit / (1 - marginPercent / 100);
    const gst = sellingPrice * 0.18;
    const mrp = sellingPrice + gst;
    const profit = sellingPrice - costPerUnit;
    return { sellingPrice, gst, mrp, profit, marginPercent };
  };

  const margins = [30, 40, 50, 60];
  const pricingScenarios = margins.map(margin => calculatePrice(margin));

  const handleSaveCalculation = async () => {
    if (!calculationName.trim()) {
      alert('Please enter a calculation name');
      return;
    }

    try {
      const calculationData = {
        product_id: selectedProduct || null,
        calculation_name: calculationName,
        batch_size: batchSize,
        raw_material_costs: {
          ingredients: ingredients,
          subtotal: rawMaterialTotal,
        },
        packaging_costs: {
          components: packagingComponents,
          other: otherPackaging,
          subtotal: packagingTotal,
        },
        manufacturing_costs: {
          labour: labourTotal,
          utilities: utilitiesTotal,
          qc: qcCost,
          subtotal: manufacturingTotal,
        },
        overhead_costs: {
          rent: rentPerBatch,
          salaries: salaryPerBatch,
          compliance: compliancePerBatch,
          other: otherOverheads,
          subtotal: overheadTotal,
        },
        marketing_costs: {
          marketing: marketingPerUnit * batchSize,
          fulfillment: fulfillmentPerUnit * batchSize,
          subtotal: marketingTotal,
        },
        total_cost: totalBatchCost,
        cost_per_unit: costPerUnit,
        margin_scenarios: pricingScenarios,
        saved_by: user?.id,
        is_draft: false,
      };

      const { error } = await supabase
        .from('product_cost_calculations')
        .insert([calculationData]);

      if (error) throw error;

      setShowSaveModal(false);
      setCalculationName('');
      fetchSavedCalculations();
      alert('Calculation saved successfully!');
    } catch (error) {
      console.error('Error saving calculation:', error);
      alert('Error saving calculation');
    }
  };

  return (
    <div className="min-h-screen bg-cream">
      <Header />

      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="font-heading text-4xl font-bold text-primary mb-2">Product Cost Calculator</h1>
              <p className="text-dark-brown/70">Calculate unit economics and pricing strategy</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowSaveModal(true)}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-sage to-primary text-white rounded-xl font-semibold hover:shadow-soft transition-all"
              >
                <Save className="w-5 h-5" />
                Save Calculation
              </button>
              <button className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-secondary to-accent text-white rounded-xl font-semibold hover:shadow-soft transition-all">
                <Download className="w-5 h-5" />
                Export PDF
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-dark-brown mb-2">Select Product (Optional)</label>
              <select
                value={selectedProduct}
                onChange={(e) => setSelectedProduct(e.target.value)}
                className="w-full px-4 py-3 border-2 border-dark-brown/10 rounded-xl focus:border-accent focus:outline-none"
              >
                <option value="">Calculate for new product</option>
                {products.map(product => (
                  <option key={product.id} value={product.id}>{product.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-dark-brown mb-2">Load Saved Calculation</label>
              <select
                className="w-full px-4 py-3 border-2 border-dark-brown/10 rounded-xl focus:border-accent focus:outline-none"
              >
                <option value="">Select saved calculation...</option>
                {savedCalculations.map(calc => (
                  <option key={calc.id} value={calc.id}>
                    {calc.calculation_name} - {new Date(calc.created_at).toLocaleDateString()}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-2xl shadow-soft p-6">
              <h3 className="font-heading text-xl font-bold text-primary mb-4">Batch Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-dark-brown mb-2">Product Name</label>
                  <input
                    type="text"
                    value={productName}
                    onChange={(e) => setProductName(e.target.value)}
                    placeholder="Enter product name"
                    className="w-full px-4 py-3 border-2 border-dark-brown/10 rounded-xl focus:border-accent focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-dark-brown mb-2">Batch Size (Units)</label>
                  <input
                    type="number"
                    value={batchSize}
                    onChange={(e) => setBatchSize(parseInt(e.target.value) || 0)}
                    placeholder="100"
                    className="w-full px-4 py-3 border-2 border-dark-brown/10 rounded-xl focus:border-accent focus:outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-soft p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-heading text-xl font-bold text-primary">Raw Materials</h3>
                <button
                  onClick={addIngredient}
                  className="flex items-center gap-2 px-4 py-2 bg-accent/10 hover:bg-accent/20 text-accent rounded-xl font-semibold transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Add Ingredient
                </button>
              </div>

              <div className="space-y-3">
                {ingredients.map(ing => (
                  <div key={ing.id} className="grid grid-cols-12 gap-2 items-center">
                    <input
                      type="text"
                      value={ing.name}
                      onChange={(e) => updateIngredient(ing.id, 'name', e.target.value)}
                      placeholder="Ingredient name"
                      className="col-span-3 px-3 py-2 border-2 border-dark-brown/10 rounded-lg focus:border-accent focus:outline-none text-sm"
                    />
                    <input
                      type="number"
                      value={ing.quantity}
                      onChange={(e) => updateIngredient(ing.id, 'quantity', parseFloat(e.target.value) || 0)}
                      placeholder="Qty"
                      className="col-span-2 px-3 py-2 border-2 border-dark-brown/10 rounded-lg focus:border-accent focus:outline-none text-sm"
                    />
                    <select
                      value={ing.unit}
                      onChange={(e) => updateIngredient(ing.id, 'unit', e.target.value)}
                      className="col-span-2 px-3 py-2 border-2 border-dark-brown/10 rounded-lg focus:border-accent focus:outline-none text-sm"
                    >
                      <option value="g">g</option>
                      <option value="kg">kg</option>
                      <option value="ml">ml</option>
                      <option value="L">L</option>
                    </select>
                    <input
                      type="number"
                      value={ing.costPerUnit}
                      onChange={(e) => updateIngredient(ing.id, 'costPerUnit', parseFloat(e.target.value) || 0)}
                      placeholder="₹/unit"
                      className="col-span-2 px-3 py-2 border-2 border-dark-brown/10 rounded-lg focus:border-accent focus:outline-none text-sm"
                    />
                    <div className="col-span-2 px-3 py-2 bg-sage/10 rounded-lg text-sm font-bold text-sage">
                      ₹{ing.total.toFixed(2)}
                    </div>
                    <button
                      onClick={() => deleteIngredient(ing.id)}
                      className="col-span-1 p-2 text-soft-red hover:bg-soft-red/10 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>

              <div className="mt-4 pt-4 border-t-2 border-dark-brown/5">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-dark-brown">Raw Material Subtotal:</span>
                  <span className="text-xl font-bold text-primary">₹{rawMaterialTotal.toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-sm text-dark-brown/60">Per unit cost:</span>
                  <span className="text-sm font-bold text-accent">₹{(rawMaterialTotal / batchSize).toFixed(2)}</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-soft p-6">
              <h3 className="font-heading text-xl font-bold text-primary mb-4">Packaging Costs</h3>

              <div className="space-y-3 mb-4">
                {packagingComponents.map(comp => (
                  <div key={comp.id} className="grid grid-cols-12 gap-2 items-center">
                    <span className="col-span-4 text-sm font-semibold text-dark-brown">{comp.name}</span>
                    <input
                      type="number"
                      value={comp.quantity}
                      onChange={(e) => updatePackaging(comp.id, 'quantity', parseFloat(e.target.value) || 0)}
                      placeholder="Qty"
                      className="col-span-2 px-3 py-2 border-2 border-dark-brown/10 rounded-lg focus:border-accent focus:outline-none text-sm"
                    />
                    <input
                      type="number"
                      value={comp.costPerPiece}
                      onChange={(e) => updatePackaging(comp.id, 'costPerPiece', parseFloat(e.target.value) || 0)}
                      placeholder="₹/piece"
                      className="col-span-3 px-3 py-2 border-2 border-dark-brown/10 rounded-lg focus:border-accent focus:outline-none text-sm"
                    />
                    <div className="col-span-3 px-3 py-2 bg-sage/10 rounded-lg text-sm font-bold text-sage">
                      ₹{(comp.total * batchSize).toFixed(2)}
                    </div>
                  </div>
                ))}
              </div>

              <button
                onClick={addOtherPackaging}
                className="text-sm text-accent hover:underline mb-3"
              >
                + Add other packaging material
              </button>

              {otherPackaging.map(item => (
                <div key={item.id} className="grid grid-cols-12 gap-2 items-center mb-2">
                  <input
                    type="text"
                    value={item.description}
                    onChange={(e) => setOtherPackaging(otherPackaging.map(o => o.id === item.id ? { ...o, description: e.target.value } : o))}
                    placeholder="Description"
                    className="col-span-6 px-3 py-2 border-2 border-dark-brown/10 rounded-lg focus:border-accent focus:outline-none text-sm"
                  />
                  <input
                    type="number"
                    value={item.amount}
                    onChange={(e) => setOtherPackaging(otherPackaging.map(o => o.id === item.id ? { ...o, amount: parseFloat(e.target.value) || 0 } : o))}
                    placeholder="₹"
                    className="col-span-5 px-3 py-2 border-2 border-dark-brown/10 rounded-lg focus:border-accent focus:outline-none text-sm"
                  />
                  <button
                    onClick={() => setOtherPackaging(otherPackaging.filter(o => o.id !== item.id))}
                    className="col-span-1 p-2 text-soft-red hover:bg-soft-red/10 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}

              <div className="mt-4 pt-4 border-t-2 border-dark-brown/5">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-dark-brown">Packaging Subtotal:</span>
                  <span className="text-xl font-bold text-primary">₹{packagingTotal.toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-sm text-dark-brown/60">Per unit cost:</span>
                  <span className="text-sm font-bold text-accent">₹{(packagingTotal / batchSize).toFixed(2)}</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-soft p-6">
              <h3 className="font-heading text-xl font-bold text-primary mb-4">Manufacturing Costs</h3>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-dark-brown mb-2">Labour Hours</label>
                    <input
                      type="number"
                      value={labourHours}
                      onChange={(e) => setLabourHours(parseFloat(e.target.value) || 0)}
                      className="w-full px-4 py-2 border-2 border-dark-brown/10 rounded-lg focus:border-accent focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-dark-brown mb-2">Cost per Hour (₹)</label>
                    <input
                      type="number"
                      value={labourCostPerHour}
                      onChange={(e) => setLabourCostPerHour(parseFloat(e.target.value) || 0)}
                      className="w-full px-4 py-2 border-2 border-dark-brown/10 rounded-lg focus:border-accent focus:outline-none"
                    />
                  </div>
                </div>

                <div className="p-3 bg-sage/10 rounded-lg">
                  <span className="text-sm text-dark-brown/70">Total Labour: </span>
                  <span className="font-bold text-sage">₹{labourTotal.toFixed(2)}</span>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-dark-brown mb-2">Electricity (₹)</label>
                    <input
                      type="number"
                      value={electricity}
                      onChange={(e) => setElectricity(parseFloat(e.target.value) || 0)}
                      className="w-full px-4 py-2 border-2 border-dark-brown/10 rounded-lg focus:border-accent focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-dark-brown mb-2">Water (₹)</label>
                    <input
                      type="number"
                      value={water}
                      onChange={(e) => setWater(parseFloat(e.target.value) || 0)}
                      className="w-full px-4 py-2 border-2 border-dark-brown/10 rounded-lg focus:border-accent focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-dark-brown mb-2">Equipment Depreciation (₹)</label>
                    <input
                      type="number"
                      value={equipmentDepreciation}
                      onChange={(e) => setEquipmentDepreciation(parseFloat(e.target.value) || 0)}
                      className="w-full px-4 py-2 border-2 border-dark-brown/10 rounded-lg focus:border-accent focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-dark-brown mb-2">Other Utilities (₹)</label>
                    <input
                      type="number"
                      value={otherUtilities}
                      onChange={(e) => setOtherUtilities(parseFloat(e.target.value) || 0)}
                      className="w-full px-4 py-2 border-2 border-dark-brown/10 rounded-lg focus:border-accent focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-dark-brown mb-2">QC/Testing Cost (₹)</label>
                  <input
                    type="number"
                    value={qcCost}
                    onChange={(e) => setQcCost(parseFloat(e.target.value) || 0)}
                    className="w-full px-4 py-2 border-2 border-dark-brown/10 rounded-lg focus:border-accent focus:outline-none"
                  />
                </div>
              </div>

              <div className="mt-4 pt-4 border-t-2 border-dark-brown/5">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-dark-brown">Manufacturing Subtotal:</span>
                  <span className="text-xl font-bold text-primary">₹{manufacturingTotal.toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-sm text-dark-brown/60">Per unit cost:</span>
                  <span className="text-sm font-bold text-accent">₹{(manufacturingTotal / batchSize).toFixed(2)}</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-soft p-6">
              <h3 className="font-heading text-xl font-bold text-primary mb-4">Overhead Allocation</h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-dark-brown mb-2">Monthly Rent (₹)</label>
                  <input
                    type="number"
                    value={monthlyRent}
                    onChange={(e) => setMonthlyRent(parseFloat(e.target.value) || 0)}
                    className="w-full px-4 py-2 border-2 border-dark-brown/10 rounded-lg focus:border-accent focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-dark-brown mb-2">
                    Allocation to this product: {rentAllocation}%
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={rentAllocation}
                    onChange={(e) => setRentAllocation(parseInt(e.target.value))}
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-dark-brown mb-2">Batches per Month</label>
                  <input
                    type="number"
                    value={batchesPerMonth}
                    onChange={(e) => setBatchesPerMonth(parseInt(e.target.value) || 1)}
                    className="w-full px-4 py-2 border-2 border-dark-brown/10 rounded-lg focus:border-accent focus:outline-none"
                  />
                </div>
                <div className="p-3 bg-sage/10 rounded-lg">
                  <span className="text-sm text-dark-brown/70">Rent per batch: </span>
                  <span className="font-bold text-sage">₹{rentPerBatch.toFixed(2)}</span>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-dark-brown mb-2">Monthly Salaries (₹)</label>
                  <input
                    type="number"
                    value={monthlySalaries}
                    onChange={(e) => setMonthlySalaries(parseFloat(e.target.value) || 0)}
                    className="w-full px-4 py-2 border-2 border-dark-brown/10 rounded-lg focus:border-accent focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-dark-brown mb-2">
                    Allocation: {salaryAllocation}%
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={salaryAllocation}
                    onChange={(e) => setSalaryAllocation(parseInt(e.target.value))}
                    className="w-full"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-dark-brown mb-2">Annual Compliance (₹)</label>
                    <input
                      type="number"
                      value={annualCompliance}
                      onChange={(e) => setAnnualCompliance(parseFloat(e.target.value) || 0)}
                      className="w-full px-4 py-2 border-2 border-dark-brown/10 rounded-lg focus:border-accent focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-dark-brown mb-2">Annual Batches</label>
                    <input
                      type="number"
                      value={annualBatches}
                      onChange={(e) => setAnnualBatches(parseInt(e.target.value) || 1)}
                      className="w-full px-4 py-2 border-2 border-dark-brown/10 rounded-lg focus:border-accent focus:outline-none"
                    />
                  </div>
                </div>

                <button
                  onClick={addOtherOverhead}
                  className="text-sm text-accent hover:underline"
                >
                  + Add other overhead
                </button>

                {otherOverheads.map(item => (
                  <div key={item.id} className="grid grid-cols-12 gap-2 items-center">
                    <input
                      type="text"
                      value={item.description}
                      onChange={(e) => setOtherOverheads(otherOverheads.map(o => o.id === item.id ? { ...o, description: e.target.value } : o))}
                      placeholder="Description"
                      className="col-span-6 px-3 py-2 border-2 border-dark-brown/10 rounded-lg focus:border-accent focus:outline-none text-sm"
                    />
                    <input
                      type="number"
                      value={item.amount}
                      onChange={(e) => setOtherOverheads(otherOverheads.map(o => o.id === item.id ? { ...o, amount: parseFloat(e.target.value) || 0 } : o))}
                      placeholder="₹"
                      className="col-span-5 px-3 py-2 border-2 border-dark-brown/10 rounded-lg focus:border-accent focus:outline-none text-sm"
                    />
                    <button
                      onClick={() => setOtherOverheads(otherOverheads.filter(o => o.id !== item.id))}
                      className="col-span-1 p-2 text-soft-red hover:bg-soft-red/10 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>

              <div className="mt-4 pt-4 border-t-2 border-dark-brown/5">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-dark-brown">Overhead Subtotal:</span>
                  <span className="text-xl font-bold text-primary">₹{overheadTotal.toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-sm text-dark-brown/60">Per unit cost:</span>
                  <span className="text-sm font-bold text-accent">₹{(overheadTotal / batchSize).toFixed(2)}</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-soft p-6">
              <h3 className="font-heading text-xl font-bold text-primary mb-4">Marketing & Distribution</h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-dark-brown mb-2">Marketing per Unit (₹)</label>
                  <input
                    type="number"
                    value={marketingPerUnit}
                    onChange={(e) => setMarketingPerUnit(parseFloat(e.target.value) || 0)}
                    className="w-full px-4 py-2 border-2 border-dark-brown/10 rounded-lg focus:border-accent focus:outline-none"
                  />
                  <p className="text-xs text-dark-brown/60 mt-1">Ads, samples, packaging inserts, etc.</p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-dark-brown mb-2">Shipping Material (₹)</label>
                  <input
                    type="number"
                    value={shippingMaterial}
                    onChange={(e) => setShippingMaterial(parseFloat(e.target.value) || 0)}
                    className="w-full px-4 py-2 border-2 border-dark-brown/10 rounded-lg focus:border-accent focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-dark-brown mb-2">Courier Charges (₹)</label>
                  <input
                    type="number"
                    value={courierCharges}
                    onChange={(e) => setCourierCharges(parseFloat(e.target.value) || 0)}
                    className="w-full px-4 py-2 border-2 border-dark-brown/10 rounded-lg focus:border-accent focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-dark-brown mb-2">Platform Fees (%)</label>
                  <input
                    type="number"
                    value={platformFees}
                    onChange={(e) => setPlatformFees(parseFloat(e.target.value) || 0)}
                    className="w-full px-4 py-2 border-2 border-dark-brown/10 rounded-lg focus:border-accent focus:outline-none"
                  />
                </div>
              </div>

              <div className="mt-4 pt-4 border-t-2 border-dark-brown/5">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-dark-brown">Marketing Subtotal:</span>
                  <span className="text-xl font-bold text-primary">₹{marketingTotal.toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-sm text-dark-brown/60">Per unit cost:</span>
                  <span className="text-sm font-bold text-accent">₹{(marketingTotal / batchSize).toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-gradient-to-br from-primary to-sage rounded-2xl shadow-soft-lg p-6 text-white sticky top-4">
              <div className="flex items-center gap-3 mb-4">
                <Calculator className="w-8 h-8" />
                <h3 className="font-heading text-2xl font-bold">Cost Summary</h3>
              </div>

              <div className="mb-6">
                <p className="text-white/80 mb-2">Total Batch Cost</p>
                <p className="text-4xl font-bold">₹{totalBatchCost.toFixed(2)}</p>
              </div>

              <div className="mb-6 p-4 bg-white/20 rounded-xl backdrop-blur-sm">
                <p className="text-white/80 mb-2">Cost Per Unit</p>
                <p className="text-5xl font-bold">₹{costPerUnit.toFixed(2)}</p>
              </div>

              {costBreakdown.length > 0 && (
                <div className="bg-white/10 rounded-xl p-4 backdrop-blur-sm">
                  <p className="text-sm font-semibold mb-3">Cost Breakdown</p>
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie
                        data={costBreakdown}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={80}
                        paddingAngle={2}
                        dataKey="value"
                      >
                        {costBreakdown.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value: any) => `₹${value.toFixed(2)}`}
                        contentStyle={{ background: '#fff', border: 'none', borderRadius: '8px' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="space-y-2 mt-3">
                    {costBreakdown.map((item, index) => (
                      <div key={index} className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                          <span>{item.name}</span>
                        </div>
                        <span className="font-semibold">
                          {((item.value / totalBatchCost) * 100).toFixed(1)}%
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="bg-white rounded-2xl shadow-soft p-6">
              <h3 className="font-heading text-xl font-bold text-primary mb-4">Pricing Strategy</h3>

              <div className="space-y-4">
                {pricingScenarios.map((scenario, index) => (
                  <div key={index} className="p-4 bg-gradient-to-br from-cream/50 to-white rounded-xl border-2 border-accent/20">
                    <div className="flex items-center justify-between mb-3">
                      <span className="font-bold text-lg text-primary">
                        {scenario.marginPercent}% Margin
                      </span>
                      <span className="px-3 py-1 bg-accent/10 text-accent rounded-full text-sm font-semibold">
                        Profit: ₹{scenario.profit.toFixed(2)}
                      </span>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-dark-brown/70">Selling Price (ex-GST):</span>
                        <span className="font-semibold">₹{scenario.sellingPrice.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-dark-brown/70">GST @ 18%:</span>
                        <span className="font-semibold">₹{scenario.gst.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between pt-2 border-t border-dark-brown/10">
                        <span className="font-bold text-dark-brown">MRP (incl. GST):</span>
                        <span className="font-bold text-xl text-sage">₹{scenario.mrp.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-soft p-6">
              <h3 className="font-heading text-xl font-bold text-primary mb-4">Profitability Scenarios</h3>

              <div className="space-y-3">
                {[100, 500, 1000, 5000].map(units => {
                  const revenue = units * calculatePrice(40).mrp;
                  const totalCost = units * costPerUnit;
                  const profit = revenue - totalCost;
                  const marginPercent = totalCost > 0 ? ((profit / revenue) * 100) : 0;

                  return (
                    <div key={units} className="p-3 bg-cream/30 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-semibold text-dark-brown">{units} units</span>
                        <span className={`text-sm font-bold ${profit > 0 ? 'text-sage' : 'text-soft-red'}`}>
                          {profit > 0 ? '+' : ''}₹{profit.toFixed(0)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs text-dark-brown/60">
                        <span>Revenue: ₹{revenue.toFixed(0)}</span>
                        <span>Margin: {marginPercent.toFixed(1)}%</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {showSaveModal && (
        <div className="fixed inset-0 bg-primary/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-soft-lg max-w-md w-full p-6">
            <h3 className="font-heading text-2xl font-bold text-primary mb-4">Save Calculation</h3>
            <div className="mb-4">
              <label className="block text-sm font-semibold text-dark-brown mb-2">
                Calculation Name
              </label>
              <input
                type="text"
                value={calculationName}
                onChange={(e) => setCalculationName(e.target.value)}
                placeholder="e.g., Neem Face Wash v1.0 - 100 unit batch"
                className="w-full px-4 py-3 border-2 border-dark-brown/10 rounded-xl focus:border-accent focus:outline-none"
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowSaveModal(false)}
                className="flex-1 px-6 py-3 bg-dark-brown/5 text-dark-brown font-semibold rounded-xl hover:bg-dark-brown/10 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveCalculation}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-sage to-primary text-white font-semibold rounded-xl hover:shadow-soft-lg transition-all"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
