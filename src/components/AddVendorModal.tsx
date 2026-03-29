import { useState } from 'react';
import { X, Star, Upload } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface AddVendorModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

const categories = [
  'Raw Materials',
  'Packaging',
  'Printing',
  'Logistics',
  'Lab Testing',
  'Equipment',
  'Other',
];

const paymentTerms = [
  'Immediate',
  '7 days',
  '15 days',
  '30 days',
  '45 days',
  '60 days',
  'Custom',
];

export default function AddVendorModal({ onClose, onSuccess }: AddVendorModalProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    category: 'Raw Materials',
    products: '',
    contactPerson: '',
    phone: '',
    email: '',
    alternatePhone: '',
    address: '',
    gstNumber: '',
    website: '',
    paymentTerms: '30 days',
    bankName: '',
    accountNumber: '',
    ifscCode: '',
    initialRating: 3,
    notes: '',
  });
  const [certifications, setCertifications] = useState({
    iso: false,
    organic: false,
    fssai: false,
    gmp: false,
    other: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.phone) {
      alert('Please fill in required fields (Name and Phone)');
      return;
    }

    setLoading(true);

    try {
      const bankDetails = formData.bankName ? {
        bankName: formData.bankName,
        accountNumber: formData.accountNumber,
        ifscCode: formData.ifscCode,
      } : {};

      const certsList = [];
      if (certifications.iso) certsList.push('ISO Certified');
      if (certifications.organic) certsList.push('Organic Certified');
      if (certifications.fssai) certsList.push('FSSAI Approved');
      if (certifications.gmp) certsList.push('GMP Certified');
      if (certifications.other) certsList.push(certifications.other);

      const { error } = await supabase.from('vendors').insert([
        {
          name: formData.name,
          category: formData.category,
          products: formData.products,
          contact_person: formData.contactPerson,
          phone: formData.phone,
          email: formData.email,
          alternate_phone: formData.alternatePhone,
          address: formData.address,
          gst_number: formData.gstNumber,
          website: formData.website,
          payment_terms: formData.paymentTerms,
          bank_details: bankDetails,
          certifications: certsList,
          initial_rating: formData.initialRating,
          current_rating: formData.initialRating,
          notes: formData.notes,
          created_by: user?.id,
        },
      ]);

      if (error) throw error;

      onSuccess();
    } catch (error) {
      console.error('Error adding vendor:', error);
      alert('Error adding vendor. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-primary/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-soft-lg max-w-4xl w-full my-8">
        <div className="sticky top-0 bg-white border-b-2 border-dark-brown/5 px-6 py-4 rounded-t-2xl flex items-center justify-between">
          <h2 className="font-heading text-2xl font-bold text-primary">Add New Vendor</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-dark-brown/5 rounded-lg transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
          <div>
            <h3 className="font-heading text-lg font-bold text-primary mb-4">Basic Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-dark-brown mb-2">
                  Vendor Name <span className="text-soft-red">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Green Valley Herbs"
                  required
                  className="w-full px-4 py-3 border-2 border-dark-brown/10 rounded-xl focus:border-accent focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-dark-brown mb-2">
                  Category <span className="text-soft-red">*</span>
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-dark-brown/10 rounded-xl focus:border-accent focus:outline-none"
                >
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-dark-brown mb-2">
                  Contact Person
                </label>
                <input
                  type="text"
                  value={formData.contactPerson}
                  onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                  placeholder="Contact person name"
                  className="w-full px-4 py-3 border-2 border-dark-brown/10 rounded-xl focus:border-accent focus:outline-none"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-dark-brown mb-2">
                  Products/Services
                </label>
                <textarea
                  value={formData.products}
                  onChange={(e) => setFormData({ ...formData, products: e.target.value })}
                  placeholder="What does this vendor supply? e.g., Organic herbs, essential oils"
                  rows={2}
                  className="w-full px-4 py-3 border-2 border-dark-brown/10 rounded-xl focus:border-accent focus:outline-none resize-none"
                />
              </div>
            </div>
          </div>

          <div className="border-t-2 border-dark-brown/5 pt-6">
            <h3 className="font-heading text-lg font-bold text-primary mb-4">Contact Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-dark-brown mb-2">
                  Phone Number <span className="text-soft-red">*</span>
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+91-XXXXXXXXXX"
                  required
                  className="w-full px-4 py-3 border-2 border-dark-brown/10 rounded-xl focus:border-accent focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-dark-brown mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="vendor@example.com"
                  className="w-full px-4 py-3 border-2 border-dark-brown/10 rounded-xl focus:border-accent focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-dark-brown mb-2">
                  Alternative Phone
                </label>
                <input
                  type="tel"
                  value={formData.alternatePhone}
                  onChange={(e) => setFormData({ ...formData, alternatePhone: e.target.value })}
                  placeholder="Optional second number"
                  className="w-full px-4 py-3 border-2 border-dark-brown/10 rounded-xl focus:border-accent focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-dark-brown mb-2">
                  Website
                </label>
                <input
                  type="url"
                  value={formData.website}
                  onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                  placeholder="https://example.com"
                  className="w-full px-4 py-3 border-2 border-dark-brown/10 rounded-xl focus:border-accent focus:outline-none"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-dark-brown mb-2">
                  Address
                </label>
                <textarea
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Street, city, state, pincode"
                  rows={2}
                  className="w-full px-4 py-3 border-2 border-dark-brown/10 rounded-xl focus:border-accent focus:outline-none resize-none"
                />
              </div>
            </div>
          </div>

          <div className="border-t-2 border-dark-brown/5 pt-6">
            <h3 className="font-heading text-lg font-bold text-primary mb-4">Business Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-dark-brown mb-2">
                  GST Number
                </label>
                <input
                  type="text"
                  value={formData.gstNumber}
                  onChange={(e) => setFormData({ ...formData, gstNumber: e.target.value })}
                  placeholder="22AAAAA0000A1Z5"
                  className="w-full px-4 py-3 border-2 border-dark-brown/10 rounded-xl focus:border-accent focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-dark-brown mb-2">
                  Payment Terms
                </label>
                <select
                  value={formData.paymentTerms}
                  onChange={(e) => setFormData({ ...formData, paymentTerms: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-dark-brown/10 rounded-xl focus:border-accent focus:outline-none"
                >
                  {paymentTerms.map(term => (
                    <option key={term} value={term}>{term}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="border-t-2 border-dark-brown/5 pt-6">
            <h3 className="font-heading text-lg font-bold text-primary mb-4">Bank Details (Optional)</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-dark-brown mb-2">
                  Bank Name
                </label>
                <input
                  type="text"
                  value={formData.bankName}
                  onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                  placeholder="e.g., HDFC Bank"
                  className="w-full px-4 py-3 border-2 border-dark-brown/10 rounded-xl focus:border-accent focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-dark-brown mb-2">
                  Account Number
                </label>
                <input
                  type="text"
                  value={formData.accountNumber}
                  onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value })}
                  placeholder="Account number"
                  className="w-full px-4 py-3 border-2 border-dark-brown/10 rounded-xl focus:border-accent focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-dark-brown mb-2">
                  IFSC Code
                </label>
                <input
                  type="text"
                  value={formData.ifscCode}
                  onChange={(e) => setFormData({ ...formData, ifscCode: e.target.value })}
                  placeholder="e.g., HDFC0001234"
                  className="w-full px-4 py-3 border-2 border-dark-brown/10 rounded-xl focus:border-accent focus:outline-none"
                />
              </div>
            </div>
          </div>

          <div className="border-t-2 border-dark-brown/5 pt-6">
            <h3 className="font-heading text-lg font-bold text-primary mb-4">Quality & Rating</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-dark-brown mb-3">
                  Initial Rating
                </label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map(rating => (
                    <button
                      key={rating}
                      type="button"
                      onClick={() => setFormData({ ...formData, initialRating: rating })}
                      className="focus:outline-none"
                    >
                      <Star
                        className={`w-8 h-8 transition-colors ${
                          rating <= formData.initialRating
                            ? 'fill-amber-400 text-amber-400'
                            : 'text-dark-brown/20 hover:text-amber-400'
                        }`}
                      />
                    </button>
                  ))}
                  <span className="ml-2 text-sm font-semibold text-dark-brown">
                    {formData.initialRating} / 5
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-dark-brown mb-3">
                  Quality Certifications
                </label>
                <div className="space-y-2">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={certifications.iso}
                      onChange={(e) => setCertifications({ ...certifications, iso: e.target.checked })}
                      className="w-4 h-4 text-accent focus:ring-accent rounded"
                    />
                    <span className="text-sm text-dark-brown">ISO Certified</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={certifications.organic}
                      onChange={(e) => setCertifications({ ...certifications, organic: e.target.checked })}
                      className="w-4 h-4 text-accent focus:ring-accent rounded"
                    />
                    <span className="text-sm text-dark-brown">Organic Certified</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={certifications.fssai}
                      onChange={(e) => setCertifications({ ...certifications, fssai: e.target.checked })}
                      className="w-4 h-4 text-accent focus:ring-accent rounded"
                    />
                    <span className="text-sm text-dark-brown">FSSAI Approved</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={certifications.gmp}
                      onChange={(e) => setCertifications({ ...certifications, gmp: e.target.checked })}
                      className="w-4 h-4 text-accent focus:ring-accent rounded"
                    />
                    <span className="text-sm text-dark-brown">GMP Certified</span>
                  </label>
                  <input
                    type="text"
                    value={certifications.other}
                    onChange={(e) => setCertifications({ ...certifications, other: e.target.value })}
                    placeholder="Other certifications (comma separated)"
                    className="w-full px-4 py-2 border-2 border-dark-brown/10 rounded-lg focus:border-accent focus:outline-none text-sm"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="border-t-2 border-dark-brown/5 pt-6">
            <h3 className="font-heading text-lg font-bold text-primary mb-4">Internal Notes</h3>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Any internal notes about this vendor (not visible to vendor)"
              rows={3}
              className="w-full px-4 py-3 border-2 border-dark-brown/10 rounded-xl focus:border-accent focus:outline-none resize-none"
            />
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
            {loading ? 'Adding...' : 'Add Vendor'}
          </button>
        </div>
      </div>
    </div>
  );
}
