export function AgentCardSkeleton() {
  return (
    <div className="animate-pulse rounded-lg border border-border bg-surface p-4 pl-5">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded bg-elevated" />
          <div>
            <div className="h-4 w-24 rounded bg-elevated" />
            <div className="mt-1 h-3 w-32 rounded bg-elevated" />
          </div>
        </div>
        <div className="h-5 w-16 rounded-full bg-elevated" />
      </div>
      <div className="mt-3 h-3 w-full rounded bg-elevated" />
      <div className="mt-1.5 h-3 w-2/3 rounded bg-elevated" />
    </div>
  );
}

export function ActivityFeedSkeleton() {
  return (
    <div className="rounded-lg border border-border bg-surface">
      <div className="border-b border-border px-4 py-3">
        <div className="h-4 w-24 animate-pulse rounded bg-elevated" />
      </div>
      <div className="divide-y divide-border/50">
        {[1, 2, 3].map((i) => (
          <div key={i} className="animate-pulse px-4 py-3">
            <div className="flex items-start gap-2">
              <div className="h-5 w-5 rounded bg-elevated" />
              <div className="flex-1">
                <div className="h-3 w-3/4 rounded bg-elevated" />
                <div className="mt-1.5 h-2.5 w-16 rounded bg-elevated" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
