interface PageLoaderProps {
  label?: string;
}

export function PageLoader({ label = 'Loading...' }: PageLoaderProps) {
  return (
    <div className="text-center py-16">
      <div className="w-14 h-14 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto mb-4" />
      <p className="text-dark-brown/50">{label}</p>
    </div>
  );
}

interface TableSkeletonProps {
  rows?: number;
  columns?: number;
}

export function TableSkeleton({ rows = 6, columns = 5 }: TableSkeletonProps) {
  return (
    <div className="divide-y divide-dark-brown/5">
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className="flex items-center gap-6 px-6 py-4">
          {Array.from({ length: columns }).map((_, colIndex) => (
            <div
              key={colIndex}
              className="h-4 bg-dark-brown/10 rounded-full animate-pulse"
              style={{
                flex: colIndex === 0 ? 2 : 1,
                animationDelay: `${(rowIndex * columns + colIndex) * 30}ms`,
              }}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

interface CardSkeletonProps {
  count?: number;
}

export function CardSkeleton({ count = 6 }: CardSkeletonProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="bg-panel border border-edge rounded-2xl shadow-e1 p-6 space-y-3 animate-pulse"
          style={{ animationDelay: `${i * 60}ms` }}
        >
          <div className="h-5 bg-dark-brown/10 rounded-full w-2/3" />
          <div className="h-4 bg-dark-brown/10 rounded-full w-full" />
          <div className="h-4 bg-dark-brown/10 rounded-full w-5/6" />
          <div className="h-8 bg-dark-brown/10 rounded-xl w-1/2 mt-4" />
        </div>
      ))}
    </div>
  );
}

interface ChartSkeletonProps {
  height?: number;
}

export function ChartSkeleton({ height = 320 }: ChartSkeletonProps) {
  const bars = [55, 75, 40, 90, 60, 70, 35, 80, 50, 65, 45, 85];
  return (
    <div className="flex items-end gap-3 px-2" style={{ height }}>
      {bars.map((h, i) => (
        <div
          key={i}
          className="flex-1 bg-dark-brown/10 rounded-t-lg animate-pulse"
          style={{ height: `${h}%`, animationDelay: `${i * 50}ms` }}
        />
      ))}
    </div>
  );
}
