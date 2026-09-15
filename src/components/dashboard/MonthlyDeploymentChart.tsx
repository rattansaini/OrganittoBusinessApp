import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export interface MonthlyDeploymentPoint {
  month: string;
  total: number;
}

interface MonthlyDeploymentChartProps {
  data: MonthlyDeploymentPoint[];
  entryCount: number;
}

function CustomTooltip({ active, payload, label }: any) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-panel border border-edge rounded-xl shadow-e2 px-3.5 py-2.5">
        <p className="text-label uppercase text-ink-3 mb-1">{label}</p>
        <p className="text-body font-semibold text-ink tabular">
          ₹{Number(payload[0].value).toLocaleString('en-IN')}
        </p>
      </div>
    );
  }
  return null;
}

export default function MonthlyDeploymentChart({ data, entryCount }: MonthlyDeploymentChartProps) {
  const periodTotal = data.reduce((sum, d) => sum + d.total, 0);
  const peakIndex = data.reduce(
    (best, d, i) => (d.total > data[best].total ? i : best),
    0
  );
  const peak = data[peakIndex];
  const lastIndex = data.length - 1;

  const renderDot = (props: any) => {
    const { cx, cy, index } = props;
    if (index === peakIndex && peak?.total > 0) {
      return <circle key={`dot-${index}`} cx={cx} cy={cy} r={5} fill="#FFFFFF" stroke="#4C7A28" strokeWidth={2.4} />;
    }
    if (index === lastIndex) {
      return <circle key={`dot-${index}`} cx={cx} cy={cy} r={4} fill="#4C7A28" />;
    }
    return <circle key={`dot-${index}`} cx={cx} cy={cy} r={0} />;
  };

  return (
    <div className="bg-panel border border-edge rounded-2xl shadow-e1 p-5 min-w-0">
      <div className="flex items-baseline justify-between mb-1">
        <h3 className="text-title font-semibold text-ink">Monthly Deployment</h3>
      </div>
      <p className="text-fig font-bold tabular text-ink">
        ₹{periodTotal.toLocaleString('en-IN')}
      </p>
      <p className="text-body-sm text-ink-3 mb-4">
        across {entryCount} entries this period
        {peak && peak.total > 0 ? ` · peak ₹${peak.total.toLocaleString('en-IN')} in ${peak.month}` : ''}
      </p>

      <ResponsiveContainer width="100%" height={220}>
        <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="deploymentFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#4C7A28" stopOpacity={0.28} />
              <stop offset="100%" stopColor="#4C7A28" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} stroke="#E6E4DC" />
          <XAxis
            dataKey="month"
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 11, fill: '#969C8D' }}
          />
          <YAxis hide domain={[0, (max: number) => max * 1.15]} />
          <Tooltip content={<CustomTooltip />} />
          <Area
            type="monotone"
            dataKey="total"
            stroke="#4C7A28"
            strokeWidth={2.4}
            fill="url(#deploymentFill)"
            dot={renderDot}
            activeDot={{ r: 5, fill: '#4C7A28' }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
