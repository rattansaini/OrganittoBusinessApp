import { useEffect, useState } from 'react';
import { Clock, DollarSign, TrendingUp, FileText } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { format } from 'date-fns';

interface LicenseRenewalHistoryTabProps {
  licenseId: string;
  license: any;
}

export default function LicenseRenewalHistoryTab({ licenseId }: LicenseRenewalHistoryTabProps) {
  const [renewals, setRenewals] = useState<any[]>([]);
  const [stats, setStats] = useState({
    totalRenewals: 0,
    totalCost: 0,
    avgCost: 0,
    lastRenewalCost: 0,
  });

  useEffect(() => {
    fetchRenewals();
  }, [licenseId]);

  const fetchRenewals = async () => {
    try {
      const { data, error } = await supabase
        .from('license_renewals')
        .select('*')
        .eq('license_id', licenseId)
        .order('renewal_date', { ascending: false });

      if (error) throw error;
      setRenewals(data || []);

      if (data && data.length > 0) {
        const totalRenewals = data.length;
        const totalCost = data.reduce((sum, r) => sum + (r.cost || 0), 0);
        const avgCost = totalCost / totalRenewals;
        const lastRenewalCost = data[0].cost || 0;

        setStats({ totalRenewals, totalCost, avgCost, lastRenewalCost });
      }
    } catch (error) {
      console.error('Error fetching renewals:', error);
    }
  };

  return (
    <div className="space-y-6">
      {renewals.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-primary/10 rounded-xl p-6">
            <p className="text-dark-brown/60 text-sm mb-1">Total Renewals</p>
            <p className="text-3xl font-bold text-primary">{stats.totalRenewals}</p>
          </div>

          <div className="bg-sage/10 rounded-xl p-6">
            <p className="text-dark-brown/60 text-sm mb-1">Total Spent</p>
            <p className="text-3xl font-bold text-sage">₹{stats.totalCost.toFixed(0)}</p>
          </div>

          <div className="bg-accent/10 rounded-xl p-6">
            <p className="text-dark-brown/60 text-sm mb-1">Average Cost</p>
            <p className="text-3xl font-bold text-accent">₹{stats.avgCost.toFixed(0)}</p>
          </div>

          <div className="bg-blue-500/10 rounded-xl p-6">
            <p className="text-dark-brown/60 text-sm mb-1">Last Renewal</p>
            <p className="text-3xl font-bold text-blue-500">₹{stats.lastRenewalCost.toFixed(0)}</p>
          </div>
        </div>
      )}

      <div className="bg-white border-2 border-dark-brown/5 rounded-xl p-6">
        <h3 className="font-heading text-lg font-bold text-primary mb-4">Renewal Timeline</h3>

        {renewals.length > 0 ? (
          <div className="space-y-4">
            {renewals.map((renewal, index) => (
              <div
                key={renewal.id}
                className="relative pl-8 pb-6 border-l-2 border-dark-brown/10 last:border-l-0 last:pb-0"
              >
                <div className="absolute -left-2 top-0 w-4 h-4 rounded-full bg-primary border-4 border-white" />

                <div className="bg-cream/50 rounded-lg p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <Clock className="w-5 h-5 text-primary" />
                        <h4 className="font-semibold text-dark-brown">
                          Renewal {renewals.length - index}
                        </h4>
                      </div>
                      <p className="text-sm text-dark-brown/70">
                        {format(new Date(renewal.renewal_date), 'MMMM dd, yyyy')}
                      </p>
                    </div>
                    {renewal.cost && (
                      <div className="text-right">
                        <p className="text-sm text-dark-brown/60 mb-1">Cost</p>
                        <p className="text-2xl font-bold text-primary">₹{renewal.cost}</p>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4 mt-3 pt-3 border-t border-dark-brown/10">
                    <div>
                      <p className="text-xs text-dark-brown/60 mb-1">Previous Expiry</p>
                      <p className="text-sm font-semibold text-dark-brown">
                        {format(new Date(renewal.previous_expiry), 'MMM dd, yyyy')}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-dark-brown/60 mb-1">New Expiry</p>
                      <p className="text-sm font-semibold text-sage">
                        {format(new Date(renewal.new_expiry), 'MMM dd, yyyy')}
                      </p>
                    </div>
                  </div>

                  {renewal.notes && (
                    <div className="mt-3 pt-3 border-t border-dark-brown/10">
                      <p className="text-sm text-dark-brown/70">{renewal.notes}</p>
                    </div>
                  )}

                  {renewal.certificate_url && (
                    <button className="mt-3 flex items-center gap-2 text-sm text-primary hover:underline">
                      <FileText className="w-4 h-4" />
                      View renewed certificate
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Clock className="w-16 h-16 text-dark-brown/20 mx-auto mb-4" />
            <h4 className="font-heading text-xl font-bold text-dark-brown/60 mb-2">
              No renewal history
            </h4>
            <p className="text-dark-brown/40">
              Renewal records will appear here when the license is renewed
            </p>
          </div>
        )}
      </div>

      {renewals.length > 1 && (
        <div className="bg-white border-2 border-dark-brown/5 rounded-xl p-6">
          <h3 className="font-heading text-lg font-bold text-primary mb-4">Cost Analysis</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-cream/50 rounded-lg">
              <div className="flex items-center gap-3">
                <DollarSign className="w-5 h-5 text-primary" />
                <span className="text-sm text-dark-brown">Total Spent on Renewals</span>
              </div>
              <span className="font-bold text-lg text-primary">₹{stats.totalCost.toFixed(0)}</span>
            </div>

            <div className="flex items-center justify-between p-3 bg-cream/50 rounded-lg">
              <div className="flex items-center gap-3">
                <TrendingUp className="w-5 h-5 text-sage" />
                <span className="text-sm text-dark-brown">Average Renewal Cost</span>
              </div>
              <span className="font-bold text-lg text-sage">₹{stats.avgCost.toFixed(0)}</span>
            </div>

            <div className="flex items-center justify-between p-3 bg-cream/50 rounded-lg">
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-accent" />
                <span className="text-sm text-dark-brown">Last Renewal Cost</span>
              </div>
              <span className={`font-bold text-lg ${
                stats.lastRenewalCost > stats.avgCost ? 'text-soft-red' : 'text-sage'
              }`}>
                ₹{stats.lastRenewalCost.toFixed(0)}
                {stats.lastRenewalCost > stats.avgCost && (
                  <span className="text-xs ml-2">
                    (+{((stats.lastRenewalCost - stats.avgCost) / stats.avgCost * 100).toFixed(0)}%)
                  </span>
                )}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
