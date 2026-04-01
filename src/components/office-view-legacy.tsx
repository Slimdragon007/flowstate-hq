"use client";

import { useState, useEffect, useCallback } from "react";
import type { AgentData } from "./agent-card";
import { AgentOutputDrawer } from "./agent-output-drawer";
import { PixiCanvas } from "./pixi-canvas";
import { StandupFeed } from "./standup-feed";

const STATUS_COLOR: Record<string, string> = {
  idle: "#888888",
  working: "#ffcc00",
  done: "#00cc66",
  error: "#ff4444",
};

export function OfficeView({ agents }: { agents: AgentData[] }) {
  const [selectedAgent, setSelectedAgent] = useState<AgentData | null>(null);
  const [simulating, setSimulating] = useState(false);
  const [simAgents, setSimAgents] = useState<AgentData[]>(agents);
  const [meetingActive, setMeetingActive] = useState(false);

  useEffect(() => {
    if (!simulating) setSimAgents(agents);
  }, [agents, simulating]);

  const displayAgents = simulating ? simAgents : agents;
  const workingCount = displayAgents.filter((a) => a.status === "working").length;
  const doneCount = displayAgents.filter((a) => a.status === "done").length;
  const idleCount = displayAgents.filter((a) => a.status === "idle").length;

  const runSimulation = useCallback(async () => {
    setSimulating(true);
    setMeetingActive(true);

    const agentsCopy = agents.map((a) => ({ ...a, status: "idle" as string }));
    setSimAgents(agentsCopy);

    await new Promise((r) => setTimeout(r, 2000));

    for (let i = 0; i < agentsCopy.length; i++) {
      const agent = agentsCopy[i];
      setSimAgents((prev) => prev.map((a) => (a.id === agent.id ? { ...a, status: "working" } : a)));

      try {
        const res = await fetch(`/api/agents/${agent.id}/run`, { method: "POST" });
        const data = await res.json();
        setSimAgents((prev) =>
          prev.map((a) =>
            a.id === agent.id
              ? { ...a, status: data.success ? "done" : "error", last_output: data.output || a.last_output, last_run_at: new Date().toISOString() }
              : a
          )
        );
      } catch {
        setSimAgents((prev) => prev.map((a) => (a.id === agent.id ? { ...a, status: "error" } : a)));
      }
    }

    setMeetingActive(false);
    setSimulating(false);
  }, [agents]);

  return (
    <>
      {/* Controls */}
      <div className="mb-4 flex flex-wrap items-center justify-center gap-4">
        <div className="flex items-center gap-4 text-xs text-muted">
          <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full" style={{ background: "#00cc66" }} />{doneCount} done</span>
          <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-amber animate-pulse" />{workingCount} working</span>
          <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full" style={{ background: "#888" }} />{idleCount} idle</span>
        </div>
        <button onClick={runSimulation} disabled={simulating}
          className={`rounded-lg border px-4 py-1.5 font-mono text-xs font-bold transition-all ${simulating ? "cursor-wait border-amber/40 text-amber" : "border-green/30 text-green hover:border-green/60 hover:bg-green/10"}`}>
          {simulating ? "Simulating..." : "Run Simulation"}
        </button>
      </div>

      {/* PixiJS Game Canvas + Standup Feed */}
      <div className="flex flex-col gap-4 lg:flex-row">
        <div className="flex-1 min-w-0">
          <PixiCanvas agents={displayAgents} meetingActive={meetingActive} onSelectAgent={setSelectedAgent} />
        </div>

        {/* Live standup feed: below on mobile, side panel on desktop */}
        <StandupFeed agents={displayAgents} active={simulating} />
      </div>

      {/* Bottom agent bar */}
      <div className="mt-4 flex items-center gap-1 overflow-x-auto rounded-lg border border-border bg-surface p-2 scrollbar-none">
        {displayAgents.map((agent) => (
          <button key={agent.id} onClick={() => setSelectedAgent(agent)}
            className="flex flex-shrink-0 items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs hover:bg-elevated active:bg-elevated transition-colors">
            <span className={`h-1.5 w-1.5 rounded-full ${agent.status === "working" ? "animate-pulse" : ""}`}
              style={{ backgroundColor: STATUS_COLOR[agent.status] }} />
            <span className="text-text-secondary">{agent.emoji}</span>
            <span className="font-mono text-[0.6rem] text-muted">{agent.name}</span>
          </button>
        ))}
      </div>

      <AgentOutputDrawer agent={selectedAgent} onClose={() => setSelectedAgent(null)} />
    </>
  );
}
