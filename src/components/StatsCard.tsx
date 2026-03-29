import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react';

interface StatsCardProps {
  title: string;
  value: string;
  trend?: {
    value: number;
    label: string;
  };
  icon: LucideIcon;
  iconBgColor: string;
  iconColor: string;
  valueColor?: string;
}

export default function StatsCard({
  title,
  value,
  trend,
  icon: Icon,
  iconBgColor,
  iconColor,
  valueColor = 'text-dark-brown',
}: StatsCardProps) {
  const isPositive = trend && trend.value >= 0;

  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-soft p-6 hover:shadow-soft-lg transition-all duration-300 hover:scale-[1.02]">
      <div className="flex items-start justify-between mb-4">
        <div className={`w-12 h-12 ${iconBgColor} rounded-full flex items-center justify-center`}>
          <Icon className={`w-6 h-6 ${iconColor}`} />
        </div>
        {trend && (
          <div
            className={`flex items-center gap-1 px-2 py-1 rounded-full ${
              isPositive ? 'bg-sage/20' : 'bg-soft-red/20'
            }`}
          >
            {isPositive ? (
              <TrendingUp className="w-3 h-3 text-sage" />
            ) : (
              <TrendingDown className="w-3 h-3 text-soft-red" />
            )}
            <span
              className={`text-xs font-semibold ${
                isPositive ? 'text-sage' : 'text-soft-red'
              }`}
            >
              {Math.abs(trend.value)}%
            </span>
          </div>
        )}
      </div>

      <h3 className="text-sm font-medium text-dark-brown/60 mb-1">{title}</h3>
      <p className={`text-3xl font-bold ${valueColor} mb-1`}>{value}</p>
      {trend && (
        <p className="text-xs text-dark-brown/50">{trend.label}</p>
      )}
    </div>
  );
}
