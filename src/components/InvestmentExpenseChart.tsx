import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface ChartData {
  month: string;
  investments: number;
  expenses: number;
}

interface InvestmentExpenseChartProps {
  data: ChartData[];
}

export default function InvestmentExpenseChart({ data }: InvestmentExpenseChartProps) {
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white/95 backdrop-blur-sm p-4 rounded-xl shadow-soft-lg border-2 border-primary/10">
          <p className="font-semibold text-dark-brown mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p
              key={index}
              className="text-sm"
              style={{ color: entry.color }}
            >
              {entry.name}: ₹{entry.value.toLocaleString('en-IN')}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-soft p-6 hover:shadow-soft-lg transition-all duration-300">
      <h3 className="font-heading text-2xl font-bold text-primary mb-6">
        Investment vs Expense Trend
      </h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#2D5016" opacity={0.1} />
          <XAxis
            dataKey="month"
            stroke="#3E2723"
            style={{ fontSize: '12px', fontFamily: 'Nunito' }}
          />
          <YAxis
            stroke="#3E2723"
            style={{ fontSize: '12px', fontFamily: 'Nunito' }}
            tickFormatter={(value) => `₹${(value / 1000).toFixed(0)}k`}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            wrapperStyle={{
              paddingTop: '20px',
              fontFamily: 'Nunito',
              fontSize: '14px',
            }}
          />
          <Line
            type="monotone"
            dataKey="investments"
            stroke="#2D5016"
            strokeWidth={3}
            dot={{ fill: '#2D5016', r: 5 }}
            activeDot={{ r: 7 }}
            name="Investments"
          />
          <Line
            type="monotone"
            dataKey="expenses"
            stroke="#C85A3E"
            strokeWidth={3}
            dot={{ fill: '#C85A3E', r: 5 }}
            activeDot={{ r: 7 }}
            name="Expenses"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
