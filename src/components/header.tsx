"use client";

export function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-border bg-base/90 backdrop-blur-sm">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <span className="font-pixel text-[0.6rem] tracking-wider text-text-secondary">
            FLOWSTATE
          </span>
          <span className="font-pixel text-[0.6rem] text-green">HQ</span>
        </div>

        <div className="flex items-center gap-4">
          <span className="rounded-full border border-border bg-surface px-3 py-1 text-xs text-text-secondary">
            FlowstateAI
          </span>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-green animate-pulse" />
            <span className="text-xs text-muted">Online</span>
          </div>
        </div>
      </div>
    </header>
  );
}
