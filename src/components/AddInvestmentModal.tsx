import { useState, useEffect } from 'react';
import { X, Upload, DollarSign, Calendar, Tag, FileText, CheckCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface AddInvestmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  preselectedPartnerId?: string;
}

interface Partner {
  id: string;
  name: string;
  email: string;
}

const INVESTMENT_PURPOSES = [
  'Initial Capital',
  'Product Development',
  'Raw Material Purchase',
  'Equipment Purchase',
  'Marketing Budget',
  'Working Capital',
  'Infrastructure',
  'Other',
];

export default function AddInvestmentModal({
  isOpen,
  onClose,
  onSuccess,
  preselectedPartnerId,
}: AddInvestmentModalProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [partners, setPartners] = useState<Partner[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showPartnerDropdown, setShowPartnerDropdown] = useState(false);

  const [formData, setFormData] = useState({
    partnerId: preselectedPartnerId || '',
    amount: '',
    investmentDate: new Date().toISOString().split('T')[0],
    purpose: '',
    notes: '',
    paymentProofFile: null as File | null,
    requireApproval: false,
  });

  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    if (isOpen) {
      fetchPartners();
    }
  }, [isOpen]);

  useEffect(() => {
    if (preselectedPartnerId) {
      setFormData(prev => ({ ...prev, partnerId: preselectedPartnerId }));
    }
  }, [preselectedPartnerId]);

  const fetchPartners = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, name, email')
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
      if (file.size > 10 * 1024 * 1024) {
        alert('File size must be less than 10MB');
        return;
      }
      setFormData({ ...formData, paymentProofFile: file });
    }
  };

  const uploadPaymentProof = async (file: File): Promise<string | null> => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `payment-proofs/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('investment-docs')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('investment-docs')
        .getPublicUrl(filePath);

      return data.publicUrl;
    } catch (error) {
      console.error('Error uploading file:', error);
      return null;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.partnerId || !formData.amount || !formData.purpose) {
      alert('Please fill in all required fields');
      return;
    }

    const amount = parseFloat(formData.amount);
    if (isNaN(amount) || amount <= 0) {
      alert('Please enter a valid positive amount');
      return;
    }

    setLoading(true);

    try {
      let paymentProofUrl = null;
      if (formData.paymentProofFile) {
        paymentProofUrl = await uploadPaymentProof(formData.paymentProofFile);
      }

      const status = isAdmin && !formData.requireApproval ? 'approved' : 'pending';

      const investmentData: any = {
        partner_id: formData.partnerId,
        amount,
        investment_date: formData.investmentDate,
        purpose: formData.purpose,
        notes: formData.notes || null,
        payment_proof_url: paymentProofUrl,
        status,
        submitted_by: user?.id,
      };

      if (status === 'approved') {
        investmentData.approved_by = user?.id;
        investmentData.approved_at = new Date().toISOString();
      }

      const { error: insertError } = await supabase
        .from('investments')
        .insert([investmentData]);

      if (insertError) throw insertError;

      const partner = partners.find(p => p.id === formData.partnerId);
      await supabase.from('activity_log').insert({
        user_id: user?.id,
        activity_type: 'investment_added',
        description: `${user?.name} recorded investment of ₹${amount.toLocaleString('en-IN')} for ${partner?.name}`,
      });

      onSuccess();
      onClose();
      resetForm();
    } catch (error) {
      console.error('Error adding investment:', error);
      alert('Failed to add investment. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      partnerId: '',
      amount: '',
      investmentDate: new Date().toISOString().split('T')[0],
      purpose: '',
      notes: '',
      paymentProofFile: null,
      requireApproval: false,
    });
    setSearchTerm('');
  };

  const filteredPartners = partners.filter(partner =>
    partner.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    partner.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedPartner = partners.find(p => p.id === formData.partnerId);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-dark-brown/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative bg-white rounded-2xl shadow-soft-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-gradient-to-r from-accent to-secondary p-6 border-b-2 border-accent/20 z-10">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-heading text-3xl font-bold text-white">
                Record Investment
              </h2>
              <p className="text-white/80 text-sm mt-1">
                Add a new partner investment to the records
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              <X className="w-6 h-6 text-white" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-semibold text-dark-brown mb-2">
              Partner <span className="text-soft-red">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                value={selectedPartner ? selectedPartner.name : searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setShowPartnerDropdown(true);
                  setFormData({ ...formData, partnerId: '' });
                }}
                onFocus={() => setShowPartnerDropdown(true)}
                placeholder="Search for a partner..."
                className="w-full px-4 py-3 border-2 border-dark-brown/10 rounded-xl focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20 transition-all duration-300"
              />
              {showPartnerDropdown && !selectedPartner && (
                <div className="absolute z-10 w-full mt-2 bg-white border-2 border-dark-brown/10 rounded-xl shadow-soft-lg max-h-60 overflow-y-auto">
                  {filteredPartners.length > 0 ? (
                    filteredPartners.map((partner) => (
                      <button
                        key={partner.id}
                        type="button"
                        onClick={() => {
                          setFormData({ ...formData, partnerId: partner.id });
                          setSearchTerm('');
                          setShowPartnerDropdown(false);
                        }}
                        className="w-full px-4 py-3 text-left hover:bg-accent/10 transition-colors border-b border-dark-brown/5 last:border-0"
                      >
                        <p className="font-semibold text-dark-brown">{partner.name}</p>
                        <p className="text-sm text-dark-brown/60">{partner.email}</p>
                      </button>
                    ))
                  ) : (
                    <p className="px-4 py-3 text-dark-brown/50">No partners found</p>
                  )}
                </div>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-dark-brown mb-2">
              Investment Amount <span className="text-soft-red">*</span>
            </label>
            <div className="relative">
              <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-accent" />
              <input
                type="number"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                placeholder="0"
                step="0.01"
                min="0"
                required
                className="w-full pl-12 pr-4 py-4 text-2xl font-bold border-2 border-dark-brown/10 rounded-xl focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20 transition-all duration-300"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-dark-brown/40 text-sm">
                INR
              </span>
            </div>
            {formData.amount && !isNaN(parseFloat(formData.amount)) && (
              <p className="mt-2 text-sm text-dark-brown/60">
                ₹{parseFloat(formData.amount).toLocaleString('en-IN')}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold text-dark-brown mb-2">
              Investment Date <span className="text-soft-red">*</span>
            </label>
            <div className="relative">
              <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-accent" />
              <input
                type="date"
                value={formData.investmentDate}
                onChange={(e) => setFormData({ ...formData, investmentDate: e.target.value })}
                required
                className="w-full pl-12 pr-4 py-3 border-2 border-dark-brown/10 rounded-xl focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20 transition-all duration-300"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-dark-brown mb-2">
              Purpose / Category <span className="text-soft-red">*</span>
            </label>
            <div className="relative">
              <Tag className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-accent" />
              <select
                value={formData.purpose}
                onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
                required
                className="w-full pl-12 pr-4 py-3 border-2 border-dark-brown/10 rounded-xl focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20 transition-all duration-300 appearance-none"
              >
                <option value="">Select a purpose</option>
                {INVESTMENT_PURPOSES.map((purpose) => (
                  <option key={purpose} value={purpose}>
                    {purpose}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-dark-brown mb-2">
              Payment Proof (Optional)
            </label>
            <div className="border-2 border-dashed border-dark-brown/20 rounded-xl p-6 hover:border-accent transition-colors">
              <input
                type="file"
                id="payment-proof"
                accept="image/*,.pdf"
                onChange={handleFileChange}
                className="hidden"
              />
              <label
                htmlFor="payment-proof"
                className="flex flex-col items-center cursor-pointer"
              >
                <Upload className="w-12 h-12 text-accent mb-3" />
                {formData.paymentProofFile ? (
                  <div className="text-center">
                    <p className="font-semibold text-sage">{formData.paymentProofFile.name}</p>
                    <p className="text-sm text-dark-brown/60">
                      {(formData.paymentProofFile.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                ) : (
                  <div className="text-center">
                    <p className="font-semibold text-dark-brown">
                      Upload Receipt or Bank Statement
                    </p>
                    <p className="text-sm text-dark-brown/60">
                      PNG, JPG or PDF (max 10MB)
                    </p>
                  </div>
                )}
              </label>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-dark-brown mb-2">
              Notes (Optional)
            </label>
            <div className="relative">
              <FileText className="absolute left-4 top-4 w-5 h-5 text-accent" />
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Add any additional details..."
                maxLength={500}
                rows={3}
                className="w-full pl-12 pr-4 py-3 border-2 border-dark-brown/10 rounded-xl focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20 transition-all duration-300 resize-none"
              />
            </div>
            <p className="text-xs text-dark-brown/50 mt-1">
              {formData.notes.length}/500 characters
            </p>
          </div>

          {isAdmin && (
            <div className="flex items-center gap-3 p-4 bg-accent/5 rounded-xl">
              <input
                type="checkbox"
                id="require-approval"
                checked={formData.requireApproval}
                onChange={(e) => setFormData({ ...formData, requireApproval: e.target.checked })}
                className="w-5 h-5 rounded border-2 border-accent text-accent focus:ring-accent"
              />
              <label htmlFor="require-approval" className="text-sm text-dark-brown cursor-pointer">
                Require approval (otherwise auto-approve as admin)
              </label>
            </div>
          )}

          <div className="flex gap-3 pt-4 border-t border-dark-brown/10">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 px-6 py-3 border-2 border-dark-brown/20 text-dark-brown font-semibold rounded-xl hover:bg-dark-brown/5 transition-all duration-300 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-accent to-secondary text-white font-semibold rounded-xl shadow-soft hover:shadow-soft-lg transition-all duration-300 hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                'Recording...'
              ) : (
                <>
                  <CheckCircle className="w-5 h-5" />
                  Record Investment
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
