"use client";

export function SkeletonStats() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="rounded-2xl border border-border bg-card/50 p-6">
        <div className="h-6 w-40 rounded bg-muted" />
        <div className="mt-4 h-10 w-56 rounded bg-muted" />
        <div className="mt-2 h-4 w-72 rounded bg-muted" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="rounded-xl border border-border bg-card/50 p-4">
            <div className="h-4 w-24 rounded bg-muted" />
            <div className="mt-3 h-8 w-32 rounded bg-muted" />
          </div>
        ))}
      </div>
    </div>
  );
}
