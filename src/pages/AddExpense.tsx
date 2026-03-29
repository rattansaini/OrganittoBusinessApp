import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, X, Check, Loader, AlertCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import Header from '../components/Header';

interface Vendor {
  id: string;
  name: string;
}

interface Partner {
  id: string;
  name: string;
}

const EXPENSE_CATEGORIES = [
  { value: 'raw_materials', label: 'Raw Materials', icon: '🌿' },
  { value: 'packaging', label: 'Packaging', icon: '📦' },
  { value: 'printing', label: 'Printing', icon: '🖨️' },
  { value: 'shipping', label: 'Shipping & Logistics', icon: '🚚' },
  { value: 'marketing', label: 'Marketing & Advertising', icon: '📢' },
  { value: 'lab_testing', label: 'Lab Testing & Quality Control', icon: '🔬' },
  { value: 'licenses', label: 'Licenses & Compliance', icon: '📜' },
  { value: 'utilities', label: 'Utilities (Electricity, Water)', icon: '⚡' },
  { value: 'rent', label: 'Rent & Infrastructure', icon: '🏢' },
  { value: 'salaries', label: 'Salaries & Wages', icon: '👥' },
  { value: 'equipment', label: 'Equipment & Machinery', icon: '🔧' },
  { value: 'other', label: 'Other', icon: '📱' },
];

const PAYMENT_MODES = [
  { value: 'cash', label: 'Cash', icon: '💵' },
  { value: 'upi', label: 'UPI', icon: '📱' },
  { value: 'bank_transfer', label: 'Bank Transfer', icon: '🏦' },
  { value: 'card', label: 'Credit/Debit Card', icon: '💳' },
];

export default function AddExpense() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    category: '',
    subcategory: '',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    paymentMode: 'cash',
    paidBy: user?.id || '',
    vendorId: '',
    purpose: '',
  });

  const [billFile, setBillFile] = useState<File | null>(null);
  const [billPreview, setBillPreview] = useState<string>('');
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [showSuccess, setShowSuccess] = useState(false);
  const [characterCount, setCharacterCount] = useState(0);

  useEffect(() => {
    fetchVendors();
    fetchPartners();
  }, []);

  const fetchVendors = async () => {
    try {
      const { data, error } = await supabase
        .from('vendors')
        .select('id, name')
        .order('name');

      if (error) throw error;
      setVendors(data || []);
    } catch (error) {
      console.error('Error fetching vendors:', error);
    }
  };

  const fetchPartners = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, name')
        .order('name');

      if (error) throw error;
      setPartners(data || []);
    } catch (error) {
      console.error('Error fetching partners:', error);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setErrors({ ...errors, bill: 'File size must be less than 5MB' });
        return;
      }

      if (!['image/jpeg', 'image/png', 'application/pdf'].includes(file.type)) {
        setErrors({ ...errors, bill: 'Only JPG, PNG, and PDF files are allowed' });
        return;
      }

      setBillFile(file);
      setErrors({ ...errors, bill: '' });

      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setBillPreview(reader.result as string);
        };
        reader.readAsDataURL(file);
      } else {
        setBillPreview('');
      }
    }
  };

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.category) newErrors.category = 'Category is required';
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      newErrors.amount = 'Amount must be greater than 0';
    }
    if (!formData.date) newErrors.date = 'Date is required';
    if (!formData.paymentMode) newErrors.paymentMode = 'Payment mode is required';
    if (!formData.paidBy) newErrors.paidBy = 'Please select who paid';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const uploadBill = async () => {
    if (!billFile || !user) return null;

    try {
      const fileExt = billFile.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('expense-bills')
        .upload(fileName, billFile);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('expense-bills')
        .getPublicUrl(fileName);

      return data.publicUrl;
    } catch (error) {
      console.error('Error uploading bill:', error);
      return null;
    }
  };

  const handleSubmit = async (status: 'pending' | 'draft' = 'pending') => {
    if (status === 'pending' && !validateForm()) {
      return;
    }

    setLoading(true);

    try {
      let billUrl = null;
      if (billFile) {
        billUrl = await uploadBill();
      }

      const expenseData = {
        user_id: user?.id,
        category: formData.category,
        subcategory: formData.subcategory || null,
        amount: parseFloat(formData.amount),
        expense_date: formData.date,
        payment_mode: formData.paymentMode,
        paid_by: formData.paidBy,
        vendor_id: formData.vendorId || null,
        bill_url: billUrl,
        purpose: formData.purpose || null,
        status: status === 'draft' ? 'draft' : 'pending',
        submitted_by: user?.id,
        submitted_at: new Date().toISOString(),
      };

      const { error: expenseError } = await supabase
        .from('expenses')
        .insert(expenseData);

      if (expenseError) throw expenseError;

      if (status !== 'draft') {
        const category = EXPENSE_CATEGORIES.find(c => c.value === formData.category);
        await supabase.from('activity_log').insert({
          user_id: user?.id,
          activity_type: 'expense',
          description: `${user?.name} added expense: ₹${parseFloat(formData.amount).toLocaleString('en-IN')} for ${category?.label || formData.category}`,
        });
      }

      setShowSuccess(true);
      setTimeout(() => {
        navigate('/expenses');
      }, 2000);
    } catch (error) {
      console.error('Error submitting expense:', error);
      setErrors({ submit: 'Failed to submit expense. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-cream relative overflow-hidden">
      <div
        className="absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%232D5016' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      />

      <Header />

      <div className="relative z-10 container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto">
          <div className="mb-8">
            <h2 className="font-heading text-4xl font-bold text-primary mb-2">
              Add New Expense
            </h2>
            <p className="text-dark-brown/70 text-lg">
              Submit an expense for approval
            </p>
          </div>

          {showSuccess && (
            <div className="mb-6 p-4 bg-sage/20 border-2 border-sage rounded-xl flex items-center gap-3">
              <Check className="w-5 h-5 text-sage" />
              <p className="text-sage font-medium">Expense submitted for approval!</p>
            </div>
          )}

          {errors.submit && (
            <div className="mb-6 p-4 bg-soft-red/10 border border-soft-red/30 rounded-xl flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-soft-red flex-shrink-0 mt-0.5" />
              <p className="text-soft-red text-sm">{errors.submit}</p>
            </div>
          )}

          <form className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-soft p-6 md:p-8">
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-dark-brown mb-2">
                  Expense Category <span className="text-soft-red">*</span>
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all duration-300 ${
                    errors.category ? 'border-soft-red' : 'border-dark-brown/10 focus:border-primary'
                  }`}
                >
                  <option value="">Select a category</option>
                  {EXPENSE_CATEGORIES.map((cat) => (
                    <option key={cat.value} value={cat.value}>
                      {cat.icon} {cat.label}
                    </option>
                  ))}
                </select>
                {errors.category && (
                  <p className="mt-1 text-sm text-soft-red">{errors.category}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-dark-brown mb-2">
                  Subcategory (Optional)
                </label>
                <input
                  type="text"
                  value={formData.subcategory}
                  onChange={(e) => setFormData({ ...formData, subcategory: e.target.value })}
                  placeholder="e.g., Neem powder, Cardboard boxes"
                  className="w-full px-4 py-3 border-2 border-dark-brown/10 rounded-xl focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all duration-300"
                />
              </div>

              <div className="h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent my-6" />

              <div>
                <label className="block text-sm font-semibold text-dark-brown mb-2">
                  Amount <span className="text-soft-red">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-bold text-accent">
                    ₹
                  </span>
                  <input
                    type="number"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                    className={`w-full pl-12 pr-4 py-4 text-2xl font-bold border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all duration-300 ${
                      errors.amount ? 'border-soft-red' : 'border-dark-brown/10 focus:border-primary'
                    }`}
                  />
                </div>
                {errors.amount && (
                  <p className="mt-1 text-sm text-soft-red">{errors.amount}</p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-dark-brown mb-2">
                    Date <span className="text-soft-red">*</span>
                  </label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all duration-300 ${
                      errors.date ? 'border-soft-red' : 'border-dark-brown/10 focus:border-primary'
                    }`}
                  />
                  {errors.date && (
                    <p className="mt-1 text-sm text-soft-red">{errors.date}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-dark-brown mb-2">
                    Paid By <span className="text-soft-red">*</span>
                  </label>
                  <select
                    value={formData.paidBy}
                    onChange={(e) => setFormData({ ...formData, paidBy: e.target.value })}
                    className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all duration-300 ${
                      errors.paidBy ? 'border-soft-red' : 'border-dark-brown/10 focus:border-primary'
                    }`}
                  >
                    <option value="">Select partner</option>
                    {partners.map((partner) => (
                      <option key={partner.id} value={partner.id}>
                        {partner.name}
                      </option>
                    ))}
                  </select>
                  {errors.paidBy && (
                    <p className="mt-1 text-sm text-soft-red">{errors.paidBy}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-dark-brown mb-3">
                  Payment Mode <span className="text-soft-red">*</span>
                </label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {PAYMENT_MODES.map((mode) => (
                    <button
                      key={mode.value}
                      type="button"
                      onClick={() => setFormData({ ...formData, paymentMode: mode.value })}
                      className={`p-4 rounded-xl border-2 transition-all duration-300 hover:scale-105 ${
                        formData.paymentMode === mode.value
                          ? 'border-primary bg-primary/10'
                          : 'border-dark-brown/10 hover:border-primary/30'
                      }`}
                    >
                      <div className="text-2xl mb-1">{mode.icon}</div>
                      <div className="text-sm font-medium text-dark-brown">{mode.label}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-dark-brown mb-2">
                  Vendor (Optional)
                </label>
                <select
                  value={formData.vendorId}
                  onChange={(e) => setFormData({ ...formData, vendorId: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-dark-brown/10 rounded-xl focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all duration-300"
                >
                  <option value="">Select vendor</option>
                  {vendors.map((vendor) => (
                    <option key={vendor.id} value={vendor.id}>
                      {vendor.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent my-6" />

              <div>
                <label className="block text-sm font-semibold text-dark-brown mb-2">
                  Bill/Receipt Upload (Optional)
                </label>
                <div className="relative">
                  <input
                    type="file"
                    accept="image/jpeg,image/png,application/pdf"
                    onChange={handleFileChange}
                    className="hidden"
                    id="bill-upload"
                  />
                  <label
                    htmlFor="bill-upload"
                    className="block w-full p-8 border-2 border-dashed border-dark-brown/20 rounded-xl hover:border-primary cursor-pointer transition-all duration-300 text-center"
                  >
                    {billFile ? (
                      <div className="flex items-center justify-center gap-3">
                        {billPreview && (
                          <img src={billPreview} alt="Preview" className="w-16 h-16 object-cover rounded-lg" />
                        )}
                        <div className="text-left">
                          <p className="font-medium text-dark-brown">{billFile.name}</p>
                          <p className="text-sm text-dark-brown/60">
                            {(billFile.size / 1024).toFixed(2)} KB
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            setBillFile(null);
                            setBillPreview('');
                          }}
                          className="p-1 hover:bg-soft-red/10 rounded-full transition-colors"
                        >
                          <X className="w-5 h-5 text-soft-red" />
                        </button>
                      </div>
                    ) : (
                      <>
                        <Upload className="w-8 h-8 text-dark-brown/40 mx-auto mb-2" />
                        <p className="text-dark-brown/70 font-medium mb-1">
                          Drop receipt here or click to upload
                        </p>
                        <p className="text-sm text-dark-brown/50">
                          JPG, PNG or PDF (Max 5MB)
                        </p>
                      </>
                    )}
                  </label>
                </div>
                {errors.bill && (
                  <p className="mt-1 text-sm text-soft-red">{errors.bill}</p>
                )}
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-semibold text-dark-brown">
                    Purpose/Notes (Optional)
                  </label>
                  <span className="text-xs text-dark-brown/50">{characterCount}/500</span>
                </div>
                <textarea
                  value={formData.purpose}
                  onChange={(e) => {
                    if (e.target.value.length <= 500) {
                      setFormData({ ...formData, purpose: e.target.value });
                      setCharacterCount(e.target.value.length);
                    }
                  }}
                  placeholder="Additional details about this expense..."
                  rows={4}
                  className="w-full px-4 py-3 border-2 border-dark-brown/10 rounded-xl focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all duration-300 resize-none"
                />
              </div>

              <div className="flex flex-col sm:flex-row gap-4 pt-6">
                <button
                  type="button"
                  onClick={() => handleSubmit('pending')}
                  disabled={loading}
                  className="flex-1 py-4 bg-secondary text-white font-semibold rounded-xl shadow-soft hover:shadow-soft-lg transition-all duration-300 hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader className="w-5 h-5 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    'Submit for Approval'
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => handleSubmit('draft')}
                  disabled={loading}
                  className="px-8 py-4 bg-transparent text-primary font-semibold rounded-xl border-2 border-primary hover:bg-primary hover:text-cream transition-all duration-300 hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Save as Draft
                </button>

                <button
                  type="button"
                  onClick={() => navigate('/expenses')}
                  disabled={loading}
                  className="px-8 py-4 text-dark-brown/70 hover:text-dark-brown font-semibold transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
