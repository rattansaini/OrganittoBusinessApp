import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

interface CategoryData {
  name: string;
  value: number;
}

interface ExpenseCategoryChartProps {
  data: CategoryData[];
}

const COLORS = ['#2D5016', '#C85A3E', '#D4AF37', '#87A96B', '#3E2723', '#D84315'];

export default function ExpenseCategoryChart({ data }: ExpenseCategoryChartProps) {
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white/95 backdrop-blur-sm p-4 rounded-xl shadow-soft-lg border-2 border-primary/10">
          <p className="font-semibold text-dark-brown mb-1">{payload[0].name}</p>
          <p className="text-sm text-dark-brown/70">
            ₹{payload[0].value.toLocaleString('en-IN')}
          </p>
          <p className="text-xs text-dark-brown/50 mt-1">
            {((payload[0].value / data.reduce((sum, entry) => sum + entry.value, 0)) * 100).toFixed(1)}% of total
          </p>
        </div>
      );
    }
    return null;
  };

  const renderCustomLabel = (entry: any) => {
    return `${entry.name}`;
  };

  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-soft p-6 hover:shadow-soft-lg transition-all duration-300">
      <h3 className="font-heading text-2xl font-bold text-primary mb-6">
        Category-wise Expenses
      </h3>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            outerRadius={100}
            fill="#8884d8"
            dataKey="value"
            label={renderCustomLabel}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend
            verticalAlign="bottom"
            height={36}
            wrapperStyle={{
              paddingTop: '20px',
              fontFamily: 'Nunito',
              fontSize: '14px',
            }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
