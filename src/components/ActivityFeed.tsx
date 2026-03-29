import { ArrowRight, TrendingDown, TrendingUp, Package, FileText } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface Activity {
  id: string;
  activity_type: string;
  description: string;
  created_at: string;
}

interface ActivityFeedProps {
  activities: Activity[];
}

const getActivityIcon = (type: string) => {
  switch (type) {
    case 'expense':
      return { icon: TrendingDown, color: 'text-secondary', bg: 'bg-secondary/20' };
    case 'investment':
      return { icon: TrendingUp, color: 'text-primary', bg: 'bg-primary/20' };
    case 'product':
      return { icon: Package, color: 'text-accent', bg: 'bg-accent/20' };
    default:
      return { icon: FileText, color: 'text-dark-brown', bg: 'bg-dark-brown/20' };
  }
};

export default function ActivityFeed({ activities }: ActivityFeedProps) {
  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-soft p-6 hover:shadow-soft-lg transition-all duration-300">
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-heading text-2xl font-bold text-primary">
          Recent Activity
        </h3>
        <button className="text-sm font-semibold text-primary hover:text-sage transition-colors duration-300 flex items-center gap-1">
          View All
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {activities.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-dark-brown/50">No recent activity</p>
        </div>
      ) : (
        <div className="space-y-4">
          {activities.map((activity) => {
            const { icon: Icon, color, bg } = getActivityIcon(activity.activity_type);
            const timeAgo = formatDistanceToNow(new Date(activity.created_at), { addSuffix: true });

            return (
              <div
                key={activity.id}
                className="flex items-start gap-4 p-4 bg-cream/30 rounded-xl hover:bg-cream/50 transition-all duration-300"
              >
                <div className={`w-10 h-10 ${bg} rounded-full flex items-center justify-center flex-shrink-0`}>
                  <Icon className={`w-5 h-5 ${color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-dark-brown leading-relaxed mb-1">
                    {activity.description}
                  </p>
                  <p className="text-xs text-dark-brown/50">{timeAgo}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
