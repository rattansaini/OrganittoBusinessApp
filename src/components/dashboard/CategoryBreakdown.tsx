export interface CategorySlice {
  label: string;
  value: number;
  color: string;
}

interface CategoryBreakdownProps {
  categories: CategorySlice[];
  totalSpend: number;
  insight: string | null;
}

export default function CategoryBreakdown({ categories, totalSpend, insight }: CategoryBreakdownProps) {
  const maxValue = Math.max(...categories.map((c) => c.value), 1);

  return (
    <div className="bg-panel border border-edge rounded-2xl shadow-e1 p-5 flex flex-col min-w-0">
      <h3 className="text-title font-semibold text-ink mb-4">Where It Went</h3>

      <div className="space-y-4 flex-1">
        {categories.map((cat) => {
          const pct = totalSpend > 0 ? (cat.value / totalSpend) * 100 : 0;
          const widthPct = (cat.value / maxValue) * 100;
          return (
            <div key={cat.label}>
              <div className="flex items-center gap-2 mb-1.5">
                <span
                  className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                  style={{ backgroundColor: cat.color }}
                />
                <span className="text-body-sm font-medium text-ink flex-1 truncate">{cat.label}</span>
                <span className="text-body-sm font-semibold text-ink tabular">
                  ₹{cat.value.toLocaleString('en-IN')}
                </span>
                <span className="text-body-sm text-ink-3 tabular w-12 text-right">{pct.toFixed(1)}%</span>
              </div>
              <div className="h-2 rounded-full bg-panel-2 overflow-hidden">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${widthPct}%`,
                    background: `linear-gradient(90deg, ${cat.color}99, ${cat.color})`,
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {insight && (
        <div className="mt-5 rounded-xl p-4 bg-[#FAF6E9] border border-[#EADFBD]">
          <p className="text-body-sm text-ink">{insight}</p>
        </div>
      )}
    </div>
  );
}
