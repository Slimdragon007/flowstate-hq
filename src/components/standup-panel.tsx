"use client";

import { useRef, useEffect } from "react";

const STATUS_ICON: Record<string, string> = {
  done: "DONE",
  working: "DOING",
  error: "BLOCKED",
  idle: "",
};

const STATUS_CLASS: Record<string, string> = {
  done: "text-green",
  working: "text-amber",
  error: "text-red",
  idle: "text-muted",
};

interface StandupEntry {
  emoji: string;
  name: string;
  status: string;
  message: string;
}

export function StandupPanel({ entries }: { entries: StandupEntry[] }) {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll on new entries
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [entries.length]);

  if (entries.length === 0) return null;

  return (
    <div className="hidden w-56 flex-shrink-0 rounded-lg border border-border bg-surface lg:block">
      <div className="border-b border-border px-3 py-2">
        <h3 className="font-pixel text-[0.5rem] uppercase tracking-widest text-green">
          Live Standup
        </h3>
      </div>
      <div
        ref={scrollRef}
        className="overflow-y-auto p-3"
        style={{ maxHeight: 400 }}
      >
        {entries.map((entry, i) => {
          const tag = STATUS_ICON[entry.status];
          const colorClass = STATUS_CLASS[entry.status] || "text-muted";

          return (
            <div
              key={i}
              className="mb-2 rounded border border-border/50 bg-elevated/50 px-2 py-1.5"
            >
              <div className="flex items-center gap-1.5">
                <span className="text-xs">{entry.emoji}</span>
                <span className="font-mono text-[0.6rem] font-bold text-text-primary">
                  {entry.name}
                </span>
                {tag && (
                  <span
                    className={`ml-auto font-mono text-[0.5rem] font-bold ${colorClass}`}
                  >
                    [{tag}]
                  </span>
                )}
              </div>
              <p className="mt-0.5 text-[0.6rem] leading-relaxed text-text-secondary">
                {entry.message}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
