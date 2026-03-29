import { useEffect, useState } from 'react';
import { FileText, Upload, Edit, CheckCircle, Clock, Eye } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { format } from 'date-fns';

interface LicenseAuditLogTabProps {
  licenseId: string;
}

export default function LicenseAuditLogTab({ licenseId }: LicenseAuditLogTabProps) {
  const [auditLog, setAuditLog] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAuditLog();
  }, [licenseId]);

  const fetchAuditLog = async () => {
    try {
      const activities: any[] = [];

      const [licenseData, documentsData, renewalsData, checklistData, inspectionsData] = await Promise.all([
        supabase.from('licenses').select('created_at, updated_at').eq('id', licenseId).maybeSingle(),
        supabase.from('license_documents').select('file_name, uploaded_at, category').eq('license_id', licenseId),
        supabase.from('license_renewals').select('renewal_date, new_expiry').eq('license_id', licenseId),
        supabase.from('compliance_checklist').select('checklist_item, completed, last_verified_date').eq('license_id', licenseId),
        supabase.from('inspections').select('inspection_date, compliance_status, authority').eq('license_id', licenseId),
      ]);

      if (licenseData.data) {
        activities.push({
          type: 'license_added',
          timestamp: licenseData.data.created_at,
          description: 'License added to system',
          icon: FileText,
          color: 'text-primary',
        });

        if (licenseData.data.updated_at !== licenseData.data.created_at) {
          activities.push({
            type: 'license_updated',
            timestamp: licenseData.data.updated_at,
            description: 'License details updated',
            icon: Edit,
            color: 'text-blue-500',
          });
        }
      }

      if (documentsData.data) {
        documentsData.data.forEach(doc => {
          activities.push({
            type: 'document_uploaded',
            timestamp: doc.uploaded_at,
            description: `Document uploaded: ${doc.file_name}`,
            details: `Category: ${doc.category}`,
            icon: Upload,
            color: 'text-sage',
          });
        });
      }

      if (renewalsData.data) {
        renewalsData.data.forEach(renewal => {
          activities.push({
            type: 'renewal_processed',
            timestamp: renewal.renewal_date,
            description: 'License renewed',
            details: `New expiry: ${format(new Date(renewal.new_expiry), 'MMM dd, yyyy')}`,
            icon: Clock,
            color: 'text-accent',
          });
        });
      }

      if (checklistData.data) {
        checklistData.data
          .filter(item => item.completed && item.last_verified_date)
          .forEach(item => {
            activities.push({
              type: 'compliance_verified',
              timestamp: item.last_verified_date,
              description: 'Compliance item verified',
              details: item.checklist_item,
              icon: CheckCircle,
              color: 'text-sage',
            });
          });
      }

      if (inspectionsData.data) {
        inspectionsData.data.forEach(inspection => {
          activities.push({
            type: 'inspection',
            timestamp: inspection.inspection_date,
            description: `Inspection by ${inspection.authority}`,
            details: `Result: ${inspection.compliance_status}`,
            icon: Eye,
            color: inspection.compliance_status === 'pass' ? 'text-sage' : 'text-accent',
          });
        });
      }

      activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      setAuditLog(activities);
    } catch (error) {
      console.error('Error fetching audit log:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-dark-brown/60">Loading audit log...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-primary/10 rounded-xl p-6">
        <h3 className="font-heading text-lg font-bold text-primary mb-2">Activity History</h3>
        <p className="text-dark-brown/70">
          Complete audit trail of all activities related to this license
        </p>
      </div>

      {auditLog.length > 0 ? (
        <div className="bg-white border-2 border-dark-brown/5 rounded-xl p-6">
          <div className="space-y-4">
            {auditLog.map((activity, index) => {
              const Icon = activity.icon;
              return (
                <div
                  key={index}
                  className="relative pl-8 pb-6 border-l-2 border-dark-brown/10 last:border-l-0 last:pb-0"
                >
                  <div className={`absolute -left-3 top-0 w-6 h-6 rounded-full bg-white border-2 border-dark-brown/10 flex items-center justify-center ${activity.color}`}>
                    <Icon className="w-3 h-3" />
                  </div>

                  <div className="bg-cream/50 rounded-lg p-4">
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-semibold text-dark-brown">{activity.description}</h4>
                      <span className="text-sm text-dark-brown/60">
                        {format(new Date(activity.timestamp), 'MMM dd, yyyy')}
                      </span>
                    </div>

                    {activity.details && (
                      <p className="text-sm text-dark-brown/70">{activity.details}</p>
                    )}

                    <p className="text-xs text-dark-brown/50 mt-2">
                      {format(new Date(activity.timestamp), 'h:mm a')}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="text-center py-12 bg-white border-2 border-dark-brown/5 rounded-xl">
          <FileText className="w-16 h-16 text-dark-brown/20 mx-auto mb-4" />
          <h3 className="font-heading text-xl font-bold text-dark-brown/60 mb-2">
            No activity recorded
          </h3>
          <p className="text-dark-brown/40">
            Activity history will appear here as actions are performed
          </p>
        </div>
      )}

      <div className="bg-sage/10 border-2 border-sage/20 rounded-xl p-6">
        <div className="flex items-start gap-3">
          <CheckCircle className="w-6 h-6 text-sage flex-shrink-0 mt-1" />
          <div>
            <h4 className="font-semibold text-dark-brown mb-2">Full Transparency</h4>
            <p className="text-sm text-dark-brown/70">
              This audit log provides a complete history of all activities related to this license. All actions are timestamped and recorded for compliance and regulatory purposes.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
