"use client";

import { useEffect, useRef } from "react";
import type { AgentData } from "./agent-card";

interface StandupEntry {
  id: string;
  agent: AgentData;
  timestamp: number;
}

interface ScrumStatus {
  done: string;
  doing: string;
  blocked: string;
  summary: string;
}

function parseScrumOutput(output: string | null): ScrumStatus | null {
  if (!output) return null;
  try {
    const parsed = JSON.parse(output);
    if (
      typeof parsed.done === "string" &&
      typeof parsed.doing === "string" &&
      typeof parsed.blocked === "string" &&
      typeof parsed.summary === "string"
    ) {
      return parsed as ScrumStatus;
    }
  } catch {
    // Not JSON
  }
  return null;
}

const STATUS_COLOR: Record<string, string> = {
  idle: "#888888",
  working: "#ffcc00",
  done: "#00cc66",
  error: "#ff4444",
};

function StandupCard({ entry }: { entry: StandupEntry }) {
  const { agent } = entry;
  const scrum = parseScrumOutput(agent.last_output);
  const isWorking = agent.status === "working";
  const isDone = agent.status === "done";
  const isError = agent.status === "error";

  return (
    <div className="rounded-lg border border-border bg-elevated p-2.5">
      {/* Agent header */}
      <div className="flex items-center gap-2 mb-1.5">
        <span className="text-sm">{agent.emoji}</span>
        <span className="font-mono text-[0.65rem] font-bold text-text-primary">{agent.name}</span>
        <span
          className={`ml-auto h-1.5 w-1.5 rounded-full ${isWorking ? "animate-pulse" : ""}`}
          style={{ backgroundColor: STATUS_COLOR[agent.status] }}
        />
      </div>

      {/* Status line */}
      {isWorking && (
        <p className="text-[0.6rem] text-amber animate-pulse">Working...</p>
      )}

      {isError && (
        <p className="text-[0.6rem] text-red">Failed to complete task</p>
      )}

      {/* Scrum output cards */}
      {isDone && scrum && (
        <div className="space-y-1 mt-1">
          {scrum.summary && (
            <p className="text-[0.6rem] leading-snug text-text-secondary">{scrum.summary}</p>
          )}
          <div className="flex flex-wrap gap-1 mt-1">
            {scrum.done && (
              <span className="inline-flex items-center rounded bg-green/10 px-1.5 py-0.5 text-[0.55rem] font-mono text-green">
                DONE
              </span>
            )}
            {scrum.doing && (
              <span className="inline-flex items-center rounded bg-amber/10 px-1.5 py-0.5 text-[0.55rem] font-mono text-amber">
                DOING
              </span>
            )}
            {scrum.blocked && scrum.blocked.toLowerCase() !== "none" && scrum.blocked !== "-" && (
              <span className="inline-flex items-center rounded bg-red/10 px-1.5 py-0.5 text-[0.55rem] font-mono text-red">
                BLOCKED
              </span>
            )}
          </div>
        </div>
      )}

      {/* Raw output fallback */}
      {isDone && !scrum && agent.last_output && (
        <p className="text-[0.6rem] leading-snug text-text-secondary line-clamp-3">
          {agent.last_output.slice(0, 150)}
        </p>
      )}
    </div>
  );
}

export function StandupFeed({ agents, active }: { agents: AgentData[]; active: boolean }) {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Build entries from agents that have been touched (not idle)
  const entries: StandupEntry[] = agents
    .filter((a) => a.status !== "idle")
    .map((a) => ({
      id: a.id,
      agent: a,
      timestamp: a.last_run_at ? new Date(a.last_run_at).getTime() : Date.now(),
    }))
    .sort((a, b) => a.timestamp - b.timestamp);

  // Auto-scroll to bottom on new entries
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [entries.length]);

  if (!active && entries.length === 0) return null;

  return (
    <div className="w-full lg:w-64 lg:flex-shrink-0">
      <div
        ref={scrollRef}
        className="overflow-y-auto rounded-lg border border-border bg-surface p-3"
        style={{ maxHeight: 300 }}
      >
        <div className="mb-3 flex items-center gap-2">
          <h3 className="font-mono text-xs font-bold text-text-primary">Standup Feed</h3>
          {active && (
            <span className="h-1.5 w-1.5 rounded-full bg-green animate-pulse" />
          )}
        </div>

        {entries.length === 0 && (
          <p className="text-[0.65rem] text-muted">Waiting for briefing to start...</p>
        )}

        <div className="space-y-2">
          {entries.map((entry) => (
            <StandupCard key={entry.id} entry={entry} />
          ))}
        </div>

        {!active && entries.length > 0 && (
          <div className="mt-3 rounded border border-border/50 bg-surface p-2 text-center">
            <p className="text-[0.6rem] font-mono text-muted">
              Briefing complete - {entries.filter((e) => e.agent.status === "done").length}/{entries.length} agents reported
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
