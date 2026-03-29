import { useEffect, useState } from 'react';
import { Activity, Clock } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { format } from 'date-fns';

interface BatchTraceabilityTabProps {
  batchId: string;
}

const activityIcons: any = {
  batch_created: '🎉',
  status_changed: '🔄',
  dispatch: '📤',
  stock_adjustment: '📊',
  qc_approved: '✅',
  test_added: '🧪',
  photo_uploaded: '📸',
  ingredient_added: '🌿',
};

const activityColors: any = {
  batch_created: 'bg-sage/10 text-sage',
  status_changed: 'bg-blue-500/10 text-blue-500',
  dispatch: 'bg-accent/10 text-accent',
  stock_adjustment: 'bg-soft-red/10 text-soft-red',
  qc_approved: 'bg-sage/10 text-sage',
  test_added: 'bg-purple-500/10 text-purple-500',
  photo_uploaded: 'bg-blue-500/10 text-blue-500',
  ingredient_added: 'bg-primary/10 text-primary',
};

export default function BatchTraceabilityTab({ batchId }: BatchTraceabilityTabProps) {
  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchActivities();
  }, [batchId]);

  const fetchActivities = async () => {
    try {
      const { data, error } = await supabase
        .from('batch_activity_log')
        .select('*')
        .eq('batch_id', batchId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setActivities(data || []);
    } catch (error) {
      console.error('Error fetching activities:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-dark-brown/60">Loading activity log...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-primary/10 to-sage/10 rounded-xl p-6">
        <div className="flex items-center gap-3 mb-2">
          <Activity className="w-6 h-6 text-primary" />
          <h3 className="font-heading text-xl font-bold text-primary">Complete Traceability Log</h3>
        </div>
        <p className="text-sm text-dark-brown/70">
          Full audit trail of all activities and changes for this batch. Every action is logged for compliance and quality assurance.
        </p>
      </div>

      {activities.length > 0 ? (
        <div className="relative">
          <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-dark-brown/10"></div>

          <div className="space-y-6">
            {activities.map((activity, index) => {
              const icon = activityIcons[activity.activity_type] || '📝';
              const colorClass = activityColors[activity.activity_type] || 'bg-dark-brown/10 text-dark-brown';

              return (
                <div key={activity.id} className="relative pl-16">
                  <div className={`absolute left-4 w-8 h-8 rounded-full ${colorClass} flex items-center justify-center text-lg z-10`}>
                    {icon}
                  </div>

                  <div className="bg-white border-2 border-dark-brown/5 rounded-xl p-4 hover:shadow-soft transition-all">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h4 className="font-semibold text-dark-brown mb-1">
                          {activity.activity_description}
                        </h4>
                        <div className="flex items-center gap-2 text-xs text-dark-brown/60">
                          <Clock className="w-3 h-3" />
                          <span>
                            {format(new Date(activity.created_at), 'MMM dd, yyyy')} at{' '}
                            {format(new Date(activity.created_at), 'HH:mm')}
                          </span>
                        </div>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${colorClass}`}>
                        {activity.activity_type.replace('_', ' ')}
                      </span>
                    </div>

                    {activity.details && Object.keys(activity.details).length > 0 && (
                      <div className="mt-3 pt-3 border-t border-dark-brown/5">
                        <div className="grid grid-cols-2 gap-3">
                          {Object.entries(activity.details).map(([key, value]: [string, any]) => (
                            <div key={key}>
                              <p className="text-xs text-dark-brown/60 mb-1 capitalize">
                                {key.replace(/_/g, ' ')}
                              </p>
                              <p className="text-sm font-semibold text-dark-brown">
                                {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="text-center py-12 bg-white border-2 border-dark-brown/5 rounded-xl">
          <Activity className="w-16 h-16 text-dark-brown/20 mx-auto mb-4" />
          <h3 className="font-heading text-xl font-bold text-dark-brown/60 mb-2">
            No activity recorded
          </h3>
          <p className="text-dark-brown/40">
            Activity will be logged automatically as actions are performed on this batch
          </p>
        </div>
      )}
    </div>
  );
}
