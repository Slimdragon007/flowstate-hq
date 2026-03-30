"use client";

import { useState, useEffect, useCallback } from "react";

interface ActivityEntry {
  id: string;
  action: string;
  detail: string | null;
  zone: string;
  created_at: string;
  agents: { name: string; emoji: string } | null;
}

function timeAgo(dateStr: string): string {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export function ActivityFeed({
  initialEntries,
}: {
  initialEntries: ActivityEntry[];
}) {
  const [entries, setEntries] = useState(initialEntries);
  const [expanded, setExpanded] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/activity");
      if (res.ok) {
        const data = await res.json();
        setEntries(data.entries);
      }
    } catch {
      // Silent fail on poll
    }
  }, []);

  useEffect(() => {
    // Only poll when tab is visible
    const guardedRefresh = () => {
      if (document.visibilityState === "visible") refresh();
    };
    const interval = setInterval(guardedRefresh, 10000);
    document.addEventListener("visibilitychange", guardedRefresh);
    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", guardedRefresh);
    };
  }, [refresh]);

  return (
    <div className="rounded-lg border border-border bg-surface">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center justify-between border-b border-border px-4 py-3 md:cursor-default"
      >
        <h2 className="font-mono text-xs font-bold text-text-primary">
          Activity Feed
        </h2>
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-elevated px-2 py-0.5 text-[0.6rem] text-muted">
            {entries.length}
          </span>
          <span className="text-muted md:hidden">{expanded ? "−" : "+"}</span>
        </div>
      </button>

      <div
        className={`max-h-[500px] overflow-y-auto ${
          expanded ? "block" : "hidden md:block"
        }`}
      >
        {entries.length === 0 ? (
          <p className="px-4 py-8 text-center text-xs text-muted">
            No activity yet. Run an agent to get started.
          </p>
        ) : (
          <div className="divide-y divide-border/50">
            {entries.map((entry) => (
              <div key={entry.id} className="px-4 py-3">
                <div className="flex items-start gap-2">
                  <span className="mt-0.5 text-sm">
                    {entry.agents?.emoji ?? "⚙️"}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-text-primary">{entry.action}</p>
                    <p className="mt-0.5 text-[0.65rem] text-muted">
                      {timeAgo(entry.created_at)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
