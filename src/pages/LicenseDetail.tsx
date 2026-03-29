import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, FileText, CheckSquare, Clock, FileSearch, Edit, Trash2 } from 'lucide-react';
import Header from '../components/Header';
import LicenseDetailsTab from '../components/license-detail/LicenseDetailsTab';
import LicenseDocumentsTab from '../components/license-detail/LicenseDocumentsTab';
import LicenseComplianceTab from '../components/license-detail/LicenseComplianceTab';
import LicenseRenewalHistoryTab from '../components/license-detail/LicenseRenewalHistoryTab';
import LicenseAuditLogTab from '../components/license-detail/LicenseAuditLogTab';
import { supabase } from '../lib/supabase';
import { differenceInDays, format } from 'date-fns';

const tabs = [
  { id: 'details', label: 'Details', icon: FileText },
  { id: 'documents', label: 'Documents', icon: FileSearch },
  { id: 'compliance', label: 'Compliance Checklist', icon: CheckSquare },
  { id: 'renewal', label: 'Renewal History', icon: Clock },
  { id: 'audit', label: 'Audit Log', icon: FileText },
];

const LICENSE_TYPES: any = {
  fssai: { label: 'FSSAI License', icon: '🍴' },
  ayush: { label: 'Ayush License', icon: '🌿' },
  gmp: { label: 'GMP Certification', icon: '✓' },
  trade: { label: 'Trade License', icon: '🏪' },
  gst: { label: 'GST Registration', icon: '💼' },
  organic: { label: 'Organic Certification', icon: '🌱' },
  pollution: { label: 'Pollution Control', icon: '🏭' },
  fire: { label: 'Fire Safety', icon: '🔥' },
  drug: { label: 'Drug License', icon: '💊' },
  other: { label: 'Other License', icon: '📄' },
};

export default function LicenseDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [license, setLicense] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('details');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchLicense();
    }
  }, [id]);

  const fetchLicense = async () => {
    try {
      const { data, error } = await supabase
        .from('license_summary')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (error) throw error;
      setLicense(data);
    } catch (error) {
      console.error('Error fetching license:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this license? This action cannot be undone.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('licenses')
        .delete()
        .eq('id', id);

      if (error) throw error;
      navigate('/compliance');
    } catch (error) {
      console.error('Error deleting license:', error);
      alert('Error deleting license');
    }
  };

  const getStatusBadge = () => {
    if (!license) return null;

    const badges: any = {
      active: { label: 'Active', color: 'bg-sage/10 text-sage' },
      pending: { label: 'Pending Application', color: 'bg-amber-500/10 text-amber-500' },
      renewal_in_process: { label: 'Renewal In Process', color: 'bg-blue-500/10 text-blue-500' },
      expired: { label: 'Expired', color: 'bg-soft-red/10 text-soft-red' },
    };

    return badges[license.status] || badges.active;
  };

  const getExpiryStatusColor = () => {
    if (!license || !license.expiry_date) return 'text-dark-brown';

    const daysUntilExpiry = differenceInDays(new Date(license.expiry_date), new Date());
    if (daysUntilExpiry < 0) return 'text-soft-red';
    if (daysUntilExpiry <= 7) return 'text-soft-red';
    if (daysUntilExpiry <= 30) return 'text-accent';
    if (daysUntilExpiry <= 90) return 'text-amber-500';
    return 'text-sage';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-cream">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center py-12">
            <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-dark-brown/60">Loading license details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!license) {
    return (
      <div className="min-h-screen bg-cream">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center py-12">
            <p className="text-xl text-dark-brown/60">License not found</p>
            <button
              onClick={() => navigate('/compliance')}
              className="mt-4 px-6 py-3 bg-primary text-white rounded-xl font-semibold"
            >
              Back to Compliance
            </button>
          </div>
        </div>
      </div>
    );
  }

  const typeInfo = LICENSE_TYPES[license.license_type] || LICENSE_TYPES.other;
  const statusBadge = getStatusBadge();
  const daysUntilExpiry = license.expiry_date
    ? differenceInDays(new Date(license.expiry_date), new Date())
    : null;

  return (
    <div className="min-h-screen bg-cream">
      <Header />

      <div className="container mx-auto px-4 py-8">
        <button
          onClick={() => navigate('/compliance')}
          className="flex items-center gap-2 text-dark-brown hover:text-primary mb-6 font-semibold transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Compliance
        </button>

        <div className="bg-white rounded-2xl shadow-soft p-6 mb-6">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-start gap-4 mb-3">
                <div className="text-5xl">{typeInfo.icon}</div>
                <div>
                  <h1 className="font-heading text-3xl font-bold text-primary mb-1">
                    {typeInfo.label}
                  </h1>
                  <p className="text-lg font-mono text-dark-brown/70 mb-2">
                    {license.license_number}
                  </p>
                  <div className="flex items-center gap-2 flex-wrap">
                    {statusBadge && (
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${statusBadge.color}`}>
                        {statusBadge.label}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              <button className="flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-xl font-semibold hover:bg-primary/20 transition-colors">
                <Edit className="w-4 h-4" />
                Edit
              </button>
              <button
                onClick={handleDelete}
                className="flex items-center gap-2 px-4 py-2 bg-soft-red/10 text-soft-red rounded-xl font-semibold hover:bg-soft-red/20 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                Delete
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t-2 border-dark-brown/5">
            <div>
              <p className="text-sm text-dark-brown/60 mb-1">Issuing Authority</p>
              <p className="font-semibold text-dark-brown">{license.issuing_authority}</p>
            </div>
            <div>
              <p className="text-sm text-dark-brown/60 mb-1">Issue Date</p>
              <p className="font-semibold text-dark-brown">
                {format(new Date(license.issue_date), 'MMM dd, yyyy')}
              </p>
            </div>
            <div>
              <p className="text-sm text-dark-brown/60 mb-1">Expiry Date</p>
              <p className={`font-semibold ${getExpiryStatusColor()}`}>
                {license.expiry_date
                  ? format(new Date(license.expiry_date), 'MMM dd, yyyy')
                  : 'No Expiry'}
              </p>
            </div>
            <div>
              <p className="text-sm text-dark-brown/60 mb-1">Days Until Expiry</p>
              <p className={`font-semibold text-xl ${getExpiryStatusColor()}`}>
                {daysUntilExpiry !== null
                  ? daysUntilExpiry >= 0
                    ? `${daysUntilExpiry} days`
                    : 'Expired'
                  : 'N/A'}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-soft overflow-hidden">
          <div className="border-b-2 border-dark-brown/5 overflow-x-auto">
            <div className="flex">
              {tabs.map(tab => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-6 py-4 font-semibold transition-all whitespace-nowrap ${
                      activeTab === tab.id
                        ? 'text-primary border-b-4 border-primary bg-primary/5'
                        : 'text-dark-brown/60 hover:text-primary hover:bg-primary/5'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="p-6">
            {activeTab === 'details' && <LicenseDetailsTab licenseId={id!} license={license} onUpdate={fetchLicense} />}
            {activeTab === 'documents' && <LicenseDocumentsTab licenseId={id!} />}
            {activeTab === 'compliance' && <LicenseComplianceTab licenseId={id!} license={license} onUpdate={fetchLicense} />}
            {activeTab === 'renewal' && <LicenseRenewalHistoryTab licenseId={id!} license={license} />}
            {activeTab === 'audit' && <LicenseAuditLogTab licenseId={id!} />}
          </div>
        </div>
      </div>
    </div>
  );
}
