"use client";

export function SkeletonStats() {
  return (
    <div className="space-y-8">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="kpi-card">
            <div className="flex items-start justify-between mb-4">
              <div className="h-11 w-11 rounded-xl shimmer" />
              <div className="h-4 w-12 rounded shimmer" />
            </div>
            <div className="h-8 w-24 rounded-lg shimmer mb-2" />
            <div className="h-4 w-20 rounded shimmer" />
          </div>
        ))}
      </div>

      {/* Chart + Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 glass rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <div className="h-6 w-24 rounded shimmer mb-2" />
              <div className="h-4 w-32 rounded shimmer" />
            </div>
            <div className="h-4 w-20 rounded shimmer" />
          </div>
          <div className="flex items-end gap-3 h-48">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-2">
                <div className="h-4 w-10 rounded shimmer" />
                <div className="w-full rounded-t-lg shimmer" style={{ height: `${30 + Math.random() * 60}%` }} />
                <div className="h-3 w-8 rounded shimmer" />
              </div>
            ))}
          </div>
        </div>

        <div className="glass rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-6">
            <div className="h-8 w-8 rounded-lg shimmer" />
            <div className="h-5 w-24 rounded shimmer" />
          </div>
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="h-8 w-8 rounded-lg shimmer shrink-0" />
                <div className="flex-1">
                  <div className="h-4 w-full rounded shimmer mb-2" />
                  <div className="h-3 w-16 rounded shimmer" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
