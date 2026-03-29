import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, AlertTriangle, CheckCircle, Clock, FileText, Shield } from 'lucide-react';
import Header from '../components/Header';
import AddLicenseModal from '../components/AddLicenseModal';
import { supabase } from '../lib/supabase';
import { differenceInDays, format } from 'date-fns';

const LICENSE_TYPES = {
  fssai: { label: 'FSSAI License', icon: '🍴', color: 'from-blue-500 to-blue-600' },
  ayush: { label: 'Ayush License', icon: '🌿', color: 'from-sage to-primary' },
  gmp: { label: 'GMP Certification', icon: '✓', color: 'from-primary to-accent' },
  trade: { label: 'Trade License', icon: '🏪', color: 'from-amber-500 to-amber-600' },
  gst: { label: 'GST Registration', icon: '💼', color: 'from-purple-500 to-purple-600' },
  organic: { label: 'Organic Certification', icon: '🌱', color: 'from-green-500 to-green-600' },
  pollution: { label: 'Pollution Control', icon: '🏭', color: 'from-teal-500 to-teal-600' },
  fire: { label: 'Fire Safety', icon: '🔥', color: 'from-red-500 to-red-600' },
  drug: { label: 'Drug License', icon: '💊', color: 'from-pink-500 to-pink-600' },
  other: { label: 'Other License', icon: '📄', color: 'from-dark-brown to-primary' },
};

export default function Compliance() {
  const [licenses, setLicenses] = useState<any[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    expiringSoon: 0,
    expired: 0,
    complianceScore: 100,
  });

  useEffect(() => {
    fetchLicenses();
  }, []);

  useEffect(() => {
    calculateStats();
  }, [licenses]);

  const fetchLicenses = async () => {
    try {
      const { data, error } = await supabase
        .from('license_summary')
        .select('*')
        .order('expiry_date', { ascending: true, nullsFirst: false });

      if (error) throw error;
      setLicenses(data || []);
    } catch (error) {
      console.error('Error fetching licenses:', error);
    }
  };

  const calculateStats = () => {
    const total = licenses.length;
    const active = licenses.filter(l => l.expiry_status === 'active' || l.expiry_status === 'no_expiry').length;
    const expiringSoon = licenses.filter(l =>
      l.expiry_status === 'expiring_soon' || l.expiry_status === 'renewal_due' || l.expiry_status === 'critical'
    ).length;
    const expired = licenses.filter(l => l.expiry_status === 'expired').length;

    const complianceScore = total > 0
      ? Math.round(((active + expiringSoon) / total) * 100)
      : 100;

    setStats({ total, active, expiringSoon, expired, complianceScore });
  };

  const getExpiryStatusBadge = (expiryStatus: string, daysUntilExpiry: number | null) => {
    const badges: any = {
      active: { label: 'Active', color: 'bg-sage/10 text-sage', icon: CheckCircle },
      renewal_due: { label: 'Renewal Due', color: 'bg-amber-500/10 text-amber-500', icon: Clock },
      expiring_soon: { label: 'Expiring Soon', color: 'bg-accent/10 text-accent', icon: AlertTriangle },
      critical: { label: 'Critical', color: 'bg-soft-red/10 text-soft-red', icon: AlertTriangle },
      expired: { label: 'Expired', color: 'bg-soft-red/10 text-soft-red', icon: AlertTriangle },
      no_expiry: { label: 'No Expiry', color: 'bg-blue-500/10 text-blue-500', icon: CheckCircle },
    };
    return badges[expiryStatus] || badges.active;
  };

  const getComplianceColor = () => {
    if (stats.complianceScore === 100) return 'text-sage';
    if (stats.complianceScore >= 80) return 'text-amber-500';
    return 'text-soft-red';
  };

  const getComplianceStatus = () => {
    if (stats.complianceScore === 100) return { label: 'All Compliant', icon: '🟢' };
    if (stats.complianceScore >= 80) return { label: 'Needs Attention', icon: '🟡' };
    return { label: 'Critical Issues', icon: '🔴' };
  };

  const licenseTypeInfo = (type: string) => LICENSE_TYPES[type as keyof typeof LICENSE_TYPES] || LICENSE_TYPES.other;

  return (
    <div className="min-h-screen bg-cream">
      <Header />

      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="font-heading text-4xl font-bold text-primary mb-2">
              Compliance & Certifications
            </h1>
            <div className="flex items-center gap-4">
              <p className="text-dark-brown/70">Manage licenses, certifications and inspections</p>
              <div className="flex items-center gap-2">
                <span className="text-sm text-dark-brown/60">Overall Status:</span>
                <span className={`font-bold text-lg ${getComplianceColor()}`}>
                  {getComplianceStatus().icon} {getComplianceStatus().label} ({stats.complianceScore}%)
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-secondary to-accent text-white rounded-xl font-semibold hover:shadow-soft-lg transition-all"
          >
            <Plus className="w-5 h-5" />
            Add License/Certificate
          </button>
        </div>

        {stats.expiringSoon > 0 && (
          <div className="bg-accent/10 border-2 border-accent/20 rounded-xl p-4 mb-6">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-6 h-6 text-accent flex-shrink-0" />
              <div className="flex-1">
                <p className="font-semibold text-dark-brown">
                  {stats.expiringSoon} license{stats.expiringSoon !== 1 ? 's' : ''} expiring in next 90 days - Review required
                </p>
                <p className="text-sm text-dark-brown/70 mt-1">
                  Initiate renewal process to maintain compliance
                </p>
              </div>
            </div>
          </div>
        )}

        {stats.expired > 0 && (
          <div className="bg-soft-red/10 border-2 border-soft-red/20 rounded-xl p-4 mb-6">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-6 h-6 text-soft-red flex-shrink-0" />
              <div className="flex-1">
                <p className="font-semibold text-soft-red">
                  {stats.expired} license{stats.expired !== 1 ? 's have' : ' has'} expired - Immediate action required
                </p>
                <p className="text-sm text-dark-brown/70 mt-1">
                  Operating without valid licenses may result in penalties and business disruption
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow-soft p-6">
            <div className="flex items-center justify-between mb-2">
              <Shield className="w-8 h-8 text-primary" />
              <span className="text-3xl font-bold text-primary">{stats.total}</span>
            </div>
            <p className="text-sm font-semibold text-dark-brown/70">Total Licenses</p>
          </div>

          <div className="bg-white rounded-xl shadow-soft p-6">
            <div className="flex items-center justify-between mb-2">
              <CheckCircle className="w-8 h-8 text-sage" />
              <span className="text-3xl font-bold text-sage">{stats.active}</span>
            </div>
            <p className="text-sm font-semibold text-dark-brown/70">Active & Valid</p>
          </div>

          <div className="bg-white rounded-xl shadow-soft p-6">
            <div className="flex items-center justify-between mb-2">
              <Clock className="w-8 h-8 text-accent" />
              <span className="text-3xl font-bold text-accent">{stats.expiringSoon}</span>
            </div>
            <p className="text-sm font-semibold text-dark-brown/70">Renewal Due Soon</p>
          </div>

          <div className="bg-white rounded-xl shadow-soft p-6">
            <div className="flex items-center justify-between mb-2">
              <AlertTriangle className="w-8 h-8 text-soft-red" />
              <span className="text-3xl font-bold text-soft-red">{stats.expired}</span>
            </div>
            <p className="text-sm font-semibold text-dark-brown/70">Expired</p>
          </div>
        </div>

        {licenses.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {licenses.map(license => {
              const typeInfo = licenseTypeInfo(license.license_type);
              const statusBadge = getExpiryStatusBadge(license.expiry_status, license.days_until_expiry);
              const StatusIcon = statusBadge.icon;
              const compliancePercentage = license.total_checklist_items > 0
                ? Math.round((license.completed_checklist_items / license.total_checklist_items) * 100)
                : 100;

              return (
                <Link
                  key={license.id}
                  to={`/compliance/${license.id}`}
                  className="bg-white rounded-xl shadow-soft hover:shadow-soft-lg transition-all overflow-hidden"
                >
                  <div className={`h-2 bg-gradient-to-r ${typeInfo.color}`} />

                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="text-4xl">{typeInfo.icon}</div>
                        <div>
                          <h3 className="font-semibold text-dark-brown">{typeInfo.label}</h3>
                          <p className="text-xs text-dark-brown/60 font-mono">{license.license_number}</p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3 mb-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-dark-brown/60">Issued by:</span>
                        <span className="text-sm font-semibold text-dark-brown">{license.issuing_authority}</span>
                      </div>

                      {license.expiry_date && (
                        <>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-dark-brown/60">Expiry:</span>
                            <span className={`text-sm font-semibold ${
                              license.expiry_status === 'expired' ? 'text-soft-red' :
                              license.expiry_status === 'critical' ? 'text-soft-red' :
                              license.expiry_status === 'expiring_soon' ? 'text-accent' :
                              license.expiry_status === 'renewal_due' ? 'text-amber-500' : 'text-sage'
                            }`}>
                              {format(new Date(license.expiry_date), 'MMM dd, yyyy')}
                            </span>
                          </div>

                          {license.days_until_expiry !== null && (
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-dark-brown/60">Days remaining:</span>
                              <span className={`text-lg font-bold ${
                                license.days_until_expiry < 0 ? 'text-soft-red' :
                                license.days_until_expiry <= 7 ? 'text-soft-red' :
                                license.days_until_expiry <= 30 ? 'text-accent' :
                                license.days_until_expiry <= 90 ? 'text-amber-500' : 'text-sage'
                              }`}>
                                {license.days_until_expiry >= 0 ? license.days_until_expiry : 'Expired'}
                              </span>
                            </div>
                          )}
                        </>
                      )}

                      {license.total_checklist_items > 0 && (
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm text-dark-brown/60">Compliance:</span>
                            <span className="text-sm font-semibold text-dark-brown">{compliancePercentage}%</span>
                          </div>
                          <div className="w-full bg-dark-brown/10 rounded-full h-2 overflow-hidden">
                            <div
                              className={`h-full transition-all ${
                                compliancePercentage === 100 ? 'bg-sage' :
                                compliancePercentage >= 80 ? 'bg-amber-500' : 'bg-soft-red'
                              }`}
                              style={{ width: `${compliancePercentage}%` }}
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="pt-3 border-t border-dark-brown/10">
                      <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${statusBadge.color}`}>
                        <StatusIcon className="w-4 h-4" />
                        <span className="text-sm font-bold">{statusBadge.label}</span>
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-soft p-12 text-center">
            <FileText className="w-16 h-16 text-dark-brown/20 mx-auto mb-4" />
            <h3 className="font-heading text-xl font-bold text-dark-brown/60 mb-2">
              No licenses recorded yet
            </h3>
            <p className="text-dark-brown/40 mb-6">
              Add your business licenses and certifications to track compliance
            </p>
            <button
              onClick={() => setShowAddModal(true)}
              className="px-6 py-3 bg-gradient-to-r from-primary to-sage text-white rounded-xl font-semibold hover:shadow-soft-lg transition-all"
            >
              Add First License
            </button>
          </div>
        )}
      </div>

      {showAddModal && (
        <AddLicenseModal
          onClose={() => setShowAddModal(false)}
          onSuccess={() => {
            setShowAddModal(false);
            fetchLicenses();
          }}
        />
      )}
    </div>
  );
}
