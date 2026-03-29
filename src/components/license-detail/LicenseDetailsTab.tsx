import { format, differenceInDays } from 'date-fns';
import { AlertTriangle, Bell, Calendar, FileText } from 'lucide-react';

interface LicenseDetailsTabProps {
  licenseId: string;
  license: any;
  onUpdate: () => void;
}

export default function LicenseDetailsTab({ license }: LicenseDetailsTabProps) {
  const daysUntilExpiry = license.expiry_date
    ? differenceInDays(new Date(license.expiry_date), new Date())
    : null;

  const renewalDueDate = license.expiry_date
    ? new Date(new Date(license.expiry_date).getTime() - license.renewal_reminder_days * 24 * 60 * 60 * 1000)
    : null;

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-br from-primary to-sage rounded-xl p-6 text-white">
        <h3 className="font-heading text-lg font-bold mb-4">License Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-white/70 text-sm mb-1">Issued To</p>
            <p className="font-semibold text-lg">{license.issued_to}</p>
          </div>
          <div>
            <p className="text-white/70 text-sm mb-1">License Number</p>
            <p className="font-semibold text-lg font-mono">{license.license_number}</p>
          </div>
          <div>
            <p className="text-white/70 text-sm mb-1">Issuing Authority</p>
            <p className="font-semibold">{license.issuing_authority}</p>
          </div>
          <div>
            <p className="text-white/70 text-sm mb-1">Issue Date</p>
            <p className="font-semibold">{format(new Date(license.issue_date), 'MMMM dd, yyyy')}</p>
          </div>
        </div>
      </div>

      {license.expiry_date && (
        <div className={`rounded-xl p-6 ${
          daysUntilExpiry && daysUntilExpiry < 0
            ? 'bg-soft-red/10 border-2 border-soft-red/20'
            : daysUntilExpiry && daysUntilExpiry <= 30
            ? 'bg-accent/10 border-2 border-accent/20'
            : daysUntilExpiry && daysUntilExpiry <= 90
            ? 'bg-amber-500/10 border-2 border-amber-500/20'
            : 'bg-sage/10 border-2 border-sage/20'
        }`}>
          <div className="flex items-start gap-4">
            <div className={`p-3 rounded-lg ${
              daysUntilExpiry && daysUntilExpiry < 0
                ? 'bg-soft-red/20'
                : daysUntilExpiry && daysUntilExpiry <= 30
                ? 'bg-accent/20'
                : daysUntilExpiry && daysUntilExpiry <= 90
                ? 'bg-amber-500/20'
                : 'bg-sage/20'
            }`}>
              <Calendar className={`w-8 h-8 ${
                daysUntilExpiry && daysUntilExpiry < 0
                  ? 'text-soft-red'
                  : daysUntilExpiry && daysUntilExpiry <= 30
                  ? 'text-accent'
                  : daysUntilExpiry && daysUntilExpiry <= 90
                  ? 'text-amber-500'
                  : 'text-sage'
              }`} />
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-dark-brown mb-2">
                {daysUntilExpiry && daysUntilExpiry < 0
                  ? 'License Expired'
                  : daysUntilExpiry && daysUntilExpiry <= 7
                  ? 'License Expiring This Week'
                  : daysUntilExpiry && daysUntilExpiry <= 30
                  ? 'License Expiring This Month'
                  : 'License Renewal Status'}
              </h4>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-dark-brown/70">Expiry Date:</span>
                  <span className="font-semibold text-dark-brown">
                    {format(new Date(license.expiry_date), 'MMMM dd, yyyy')}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-dark-brown/70">Days Until Expiry:</span>
                  <span className={`font-bold text-2xl ${
                    daysUntilExpiry && daysUntilExpiry < 0
                      ? 'text-soft-red'
                      : daysUntilExpiry && daysUntilExpiry <= 30
                      ? 'text-accent'
                      : daysUntilExpiry && daysUntilExpiry <= 90
                      ? 'text-amber-500'
                      : 'text-sage'
                  }`}>
                    {daysUntilExpiry && daysUntilExpiry >= 0 ? daysUntilExpiry : 'Expired'}
                  </span>
                </div>
                {renewalDueDate && daysUntilExpiry && daysUntilExpiry > 0 && (
                  <div className="flex justify-between items-center pt-2 border-t border-dark-brown/10">
                    <span className="text-sm text-dark-brown/70">Renewal Due By:</span>
                    <span className="font-semibold text-dark-brown">
                      {format(renewalDueDate, 'MMMM dd, yyyy')}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {license.scope && (
        <div className="bg-cream/50 rounded-xl p-6">
          <h4 className="font-semibold text-dark-brown mb-3">Scope & Coverage</h4>
          <p className="text-dark-brown/70">{license.scope}</p>
        </div>
      )}

      <div className="bg-white border-2 border-dark-brown/5 rounded-xl p-6">
        <h4 className="font-semibold text-dark-brown mb-4">Reminder Settings</h4>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-cream/50 rounded-lg">
            <div className="flex items-center gap-3">
              <Bell className="w-5 h-5 text-primary" />
              <span className="text-sm text-dark-brown">Email Reminders</span>
            </div>
            <span className={`px-3 py-1 rounded-full text-xs font-bold ${
              license.reminder_email ? 'bg-sage/10 text-sage' : 'bg-dark-brown/10 text-dark-brown'
            }`}>
              {license.reminder_email ? 'Enabled' : 'Disabled'}
            </span>
          </div>
          <div className="flex items-center justify-between p-3 bg-cream/50 rounded-lg">
            <div className="flex items-center gap-3">
              <Bell className="w-5 h-5 text-primary" />
              <span className="text-sm text-dark-brown">Push Notifications</span>
            </div>
            <span className={`px-3 py-1 rounded-full text-xs font-bold ${
              license.reminder_push ? 'bg-sage/10 text-sage' : 'bg-dark-brown/10 text-dark-brown'
            }`}>
              {license.reminder_push ? 'Enabled' : 'Disabled'}
            </span>
          </div>
          <div className="flex items-center justify-between p-3 bg-cream/50 rounded-lg">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-accent" />
              <span className="text-sm text-dark-brown">Reminder Period</span>
            </div>
            <span className="font-semibold text-dark-brown">
              {license.renewal_reminder_days} days before expiry
            </span>
          </div>
        </div>
      </div>

      {license.notes && (
        <div className="bg-amber-50 border-2 border-amber-200 rounded-xl p-6">
          <div className="flex items-start gap-3">
            <FileText className="w-5 h-5 text-amber-600 flex-shrink-0 mt-1" />
            <div>
              <h4 className="font-semibold text-dark-brown mb-2">Notes</h4>
              <p className="text-dark-brown/70 whitespace-pre-wrap">{license.notes}</p>
            </div>
          </div>
        </div>
      )}

      {license.last_inspection_date && (
        <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-6">
          <h4 className="font-semibold text-dark-brown mb-3">Inspection Information</h4>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-dark-brown/70">Last Inspection:</span>
              <span className="font-semibold text-dark-brown">
                {format(new Date(license.last_inspection_date), 'MMMM dd, yyyy')}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-dark-brown/70">Total Inspections:</span>
              <span className="font-semibold text-dark-brown">{license.inspection_count}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
