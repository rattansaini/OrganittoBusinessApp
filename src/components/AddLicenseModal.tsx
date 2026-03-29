import { useState } from 'react';
import { X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { format } from 'date-fns';

interface AddLicenseModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

const LICENSE_TYPES = [
  { value: 'fssai', label: 'FSSAI License' },
  { value: 'ayush', label: 'Ayush License' },
  { value: 'gmp', label: 'GMP Certification' },
  { value: 'trade', label: 'Trade License' },
  { value: 'gst', label: 'GST Registration' },
  { value: 'organic', label: 'Organic Certification' },
  { value: 'pollution', label: 'Pollution Control' },
  { value: 'fire', label: 'Fire Safety Certificate' },
  { value: 'drug', label: 'Drug License' },
  { value: 'other', label: 'Other' },
];

export default function AddLicenseModal({ onClose, onSuccess }: AddLicenseModalProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [noExpiry, setNoExpiry] = useState(false);

  const [formData, setFormData] = useState({
    licenseType: 'fssai',
    licenseNumber: '',
    issuedTo: '',
    issuingAuthority: '',
    issueDate: '',
    expiryDate: '',
    renewalReminderDays: '30',
    scope: '',
    status: 'active',
    notes: '',
    reminderEmail: true,
    reminderPush: true,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.licenseNumber || !formData.issuedTo || !formData.issuingAuthority || !formData.issueDate) {
      alert('Please fill in all required fields');
      return;
    }

    if (!noExpiry && !formData.expiryDate) {
      alert('Please provide an expiry date or check "No Expiry"');
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase
        .from('licenses')
        .insert([
          {
            license_type: formData.licenseType,
            license_number: formData.licenseNumber,
            issued_to: formData.issuedTo,
            issuing_authority: formData.issuingAuthority,
            issue_date: formData.issueDate,
            expiry_date: noExpiry ? null : formData.expiryDate,
            renewal_reminder_days: parseInt(formData.renewalReminderDays),
            scope: formData.scope,
            status: formData.status,
            notes: formData.notes,
            reminder_email: formData.reminderEmail,
            reminder_push: formData.reminderPush,
            created_by: user?.id,
          },
        ]);

      if (error) throw error;

      onSuccess();
    } catch (error) {
      console.error('Error adding license:', error);
      alert('Error adding license. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-primary/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-soft-lg max-w-3xl w-full my-8">
        <div className="sticky top-0 bg-white border-b-2 border-dark-brown/5 px-6 py-4 rounded-t-2xl flex items-center justify-between">
          <h2 className="font-heading text-2xl font-bold text-primary">Add License/Certificate</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-dark-brown/5 rounded-lg transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-dark-brown mb-2">
                License Type <span className="text-soft-red">*</span>
              </label>
              <select
                value={formData.licenseType}
                onChange={(e) => setFormData({ ...formData, licenseType: e.target.value })}
                required
                className="w-full px-4 py-3 border-2 border-dark-brown/10 rounded-xl focus:border-accent focus:outline-none"
              >
                {LICENSE_TYPES.map(type => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-dark-brown mb-2">
                License/Certificate Number <span className="text-soft-red">*</span>
              </label>
              <input
                type="text"
                value={formData.licenseNumber}
                onChange={(e) => setFormData({ ...formData, licenseNumber: e.target.value })}
                placeholder="e.g., 12345678901234"
                required
                className="w-full px-4 py-3 border-2 border-dark-brown/10 rounded-xl focus:border-accent focus:outline-none font-mono"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-dark-brown mb-2">
                Issued To <span className="text-soft-red">*</span>
              </label>
              <input
                type="text"
                value={formData.issuedTo}
                onChange={(e) => setFormData({ ...formData, issuedTo: e.target.value })}
                placeholder="Business name"
                required
                className="w-full px-4 py-3 border-2 border-dark-brown/10 rounded-xl focus:border-accent focus:outline-none"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-dark-brown mb-2">
                Issuing Authority <span className="text-soft-red">*</span>
              </label>
              <input
                type="text"
                value={formData.issuingAuthority}
                onChange={(e) => setFormData({ ...formData, issuingAuthority: e.target.value })}
                placeholder="e.g., FSSAI, State Ayush Department"
                required
                className="w-full px-4 py-3 border-2 border-dark-brown/10 rounded-xl focus:border-accent focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-dark-brown mb-2">
                Issue Date <span className="text-soft-red">*</span>
              </label>
              <input
                type="date"
                value={formData.issueDate}
                onChange={(e) => setFormData({ ...formData, issueDate: e.target.value })}
                max={format(new Date(), 'yyyy-MM-dd')}
                required
                className="w-full px-4 py-3 border-2 border-dark-brown/10 rounded-xl focus:border-accent focus:outline-none"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-semibold text-dark-brown">
                  Expiry Date {!noExpiry && <span className="text-soft-red">*</span>}
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={noExpiry}
                    onChange={(e) => {
                      setNoExpiry(e.target.checked);
                      if (e.target.checked) {
                        setFormData({ ...formData, expiryDate: '' });
                      }
                    }}
                    className="w-4 h-4 rounded border-dark-brown/20 text-primary focus:ring-accent"
                  />
                  <span className="text-xs text-dark-brown/70">No Expiry</span>
                </label>
              </div>
              <input
                type="date"
                value={formData.expiryDate}
                onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                min={formData.issueDate}
                required={!noExpiry}
                disabled={noExpiry}
                className="w-full px-4 py-3 border-2 border-dark-brown/10 rounded-xl focus:border-accent focus:outline-none disabled:bg-dark-brown/5 disabled:cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-dark-brown mb-2">
                Renewal Reminder (days before expiry)
              </label>
              <input
                type="number"
                value={formData.renewalReminderDays}
                onChange={(e) => setFormData({ ...formData, renewalReminderDays: e.target.value })}
                min="1"
                max="365"
                className="w-full px-4 py-3 border-2 border-dark-brown/10 rounded-xl focus:border-accent focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-dark-brown mb-2">
                Status <span className="text-soft-red">*</span>
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                required
                className="w-full px-4 py-3 border-2 border-dark-brown/10 rounded-xl focus:border-accent focus:outline-none"
              >
                <option value="active">Active</option>
                <option value="pending">Pending Application</option>
                <option value="renewal_in_process">Renewal In Process</option>
                <option value="expired">Expired</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-dark-brown mb-2">
                Scope/Coverage
              </label>
              <textarea
                value={formData.scope}
                onChange={(e) => setFormData({ ...formData, scope: e.target.value })}
                placeholder="What this license covers (e.g., Manufacturing of Ayurvedic products)"
                rows={3}
                className="w-full px-4 py-3 border-2 border-dark-brown/10 rounded-xl focus:border-accent focus:outline-none resize-none"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-dark-brown mb-2">
                Notes
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Important information, conditions, etc."
                rows={3}
                className="w-full px-4 py-3 border-2 border-dark-brown/10 rounded-xl focus:border-accent focus:outline-none resize-none"
              />
            </div>

            <div className="md:col-span-2 bg-cream/50 rounded-xl p-4">
              <h4 className="font-semibold text-dark-brown mb-3">Reminder Settings</h4>
              <div className="space-y-2">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.reminderEmail}
                    onChange={(e) => setFormData({ ...formData, reminderEmail: e.target.checked })}
                    className="w-5 h-5 rounded border-dark-brown/20 text-primary focus:ring-accent"
                  />
                  <span className="text-sm text-dark-brown">Email reminder</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.reminderPush}
                    onChange={(e) => setFormData({ ...formData, reminderPush: e.target.checked })}
                    className="w-5 h-5 rounded border-dark-brown/20 text-primary focus:ring-accent"
                  />
                  <span className="text-sm text-dark-brown">Push notification</span>
                </label>
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
            {loading ? 'Adding...' : 'Add License'}
          </button>
        </div>
      </div>
    </div>
  );
}
