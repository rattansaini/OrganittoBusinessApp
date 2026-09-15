import { useState } from 'react';
import { ArrowRight, ChevronUp, TrendingDown, TrendingUp, Package, FileText } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface Activity {
  id: string;
  activity_type: string;
  description: string;
  created_at: string;
}

interface ActivityFeedProps {
  activities: Activity[];
  collapsedCount?: number;
}

const getActivityIcon = (type: string) => {
  switch (type) {
    case 'expense':
      return { icon: TrendingDown, color: 'text-clay', bg: 'bg-clay/10' };
    case 'investment':
      return { icon: TrendingUp, color: 'text-leaf', bg: 'bg-leaf/10' };
    case 'product':
      return { icon: Package, color: 'text-gold', bg: 'bg-gold/10' };
    default:
      return { icon: FileText, color: 'text-ink-2', bg: 'bg-panel-2' };
  }
};

export default function ActivityFeed({ activities, collapsedCount = 2 }: ActivityFeedProps) {
  const [expanded, setExpanded] = useState(false);
  const visibleActivities = expanded ? activities : activities.slice(0, collapsedCount);
  const hasMore = activities.length > collapsedCount;

  return (
    <div className="bg-panel border border-edge rounded-2xl shadow-e1 p-5 min-w-0">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-title font-semibold text-ink">Recent Activity</h3>
        {hasMore && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-body-sm font-semibold text-leaf hover:text-forest transition-colors flex items-center gap-1"
          >
            {expanded ? 'Show Less' : 'View All'}
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
          </button>
        )}
      </div>

      {activities.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-body-sm text-ink-3">No recent activity</p>
        </div>
      ) : (
        <div className="space-y-2">
          {visibleActivities.map((activity) => {
            const { icon: Icon, color, bg } = getActivityIcon(activity.activity_type);
            const timeAgo = formatDistanceToNow(new Date(activity.created_at), { addSuffix: true });

            return (
              <div
                key={activity.id}
                className="flex items-start gap-3.5 p-3 rounded-xl hover:bg-panel-2 transition-colors"
              >
                <div className={`w-9 h-9 ${bg} rounded-full flex items-center justify-center flex-shrink-0`}>
                  <Icon className={`w-4 h-4 ${color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-body-sm text-ink leading-relaxed">{activity.description}</p>
                  <p className="text-[11px] text-ink-3 mt-0.5">{timeAgo}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
