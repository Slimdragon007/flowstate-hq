"use client";

import { useState } from "react";
import { StatusBadge } from "./status-badge";

export interface AgentData {
  id: string;
  name: string;
  role: string;
  zone: string;
  emoji: string;
  color: string;
  status: string;
  last_output: string | null;
  last_run_at: string | null;
  mcp_target: string | null;
}

function timeAgo(dateStr: string | null): string {
  if (!dateStr) return "";
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export function AgentCard({
  agent: initialAgent,
  onSelect,
}: {
  agent: AgentData;
  onSelect?: (agent: AgentData) => void;
}) {
  const [agent, setAgent] = useState(initialAgent);
  const [running, setRunning] = useState(false);

  async function handleRun(e: React.MouseEvent) {
    e.stopPropagation();
    if (running) return;
    setRunning(true);
    setAgent((prev) => ({ ...prev, status: "working" }));

    try {
      const res = await fetch(`/api/agents/${agent.id}/run`, { method: "POST" });
      const data = await res.json();

      const updated = {
        ...agent,
        status: data.success ? "done" : "error",
        last_output: data.output || agent.last_output,
        last_run_at: new Date().toISOString(),
      };
      setAgent(updated);
    } catch {
      setAgent((prev) => ({ ...prev, status: "error" }));
    } finally {
      setRunning(false);
    }
  }

  return (
    <div
      onClick={() => onSelect?.(agent)}
      className={`group relative w-full overflow-hidden rounded-lg border border-border bg-surface text-left transition-all hover:border-border/80 hover:bg-elevated cursor-pointer`}
    >
      {/* Color accent bar */}
      <div
        className="absolute left-0 top-0 h-full w-1 rounded-l-lg"
        style={{ backgroundColor: agent.color }}
      />

      <div className="p-4 pl-5">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2.5">
            <span className="text-xl">{agent.emoji}</span>
            <div>
              <h3 className="font-mono text-sm font-bold text-text-primary">
                {agent.name}
              </h3>
              <p className="text-xs text-muted">{agent.role}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <StatusBadge status={agent.status} />
            <button
              onClick={handleRun}
              disabled={running}
              className={`rounded-md border px-2.5 py-1 text-[0.65rem] font-bold uppercase tracking-wide transition-all ${
                running
                  ? "cursor-wait border-amber/30 text-amber"
                  : "border-green/30 text-green hover:border-green/60 hover:bg-green/10"
              }`}
            >
              {running ? "..." : "Run"}
            </button>
          </div>
        </div>

        {agent.last_output && (
          <p className="mt-3 line-clamp-2 text-xs leading-relaxed text-text-secondary">
            {agent.last_output.substring(0, 120)}
            {agent.last_output.length > 120 ? "..." : ""}
          </p>
        )}

        {agent.last_run_at && (
          <p className="mt-2 text-[0.65rem] text-muted">
            {timeAgo(agent.last_run_at)}
          </p>
        )}
      </div>

      {/* Working overlay glow */}
      {running && (
        <div
          className="pointer-events-none absolute inset-0 animate-pulse-glow rounded-lg opacity-10"
          style={{ backgroundColor: agent.color }}
        />
      )}
    </div>
  );
}
