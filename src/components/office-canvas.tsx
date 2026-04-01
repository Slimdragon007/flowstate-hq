"use client";

import { useRef, useEffect, useCallback, useState } from "react";
import type { AgentData } from "./agent-card";
import type { OfficeGame } from "@/lib/game";
import { AgentOutputDrawer } from "./agent-output-drawer";
import { StandupPanel } from "./standup-panel";

interface StandupEntry {
  emoji: string;
  name: string;
  status: string;
  message: string;
}

export function OfficeCanvas({ agents }: { agents: AgentData[] }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<OfficeGame | null>(null);
  const mountedRef = useRef(false);
  const [selectedAgent, setSelectedAgent] = useState<AgentData | null>(null);
  const [simulating, setSimulating] = useState(false);
  const [simAgents, setSimAgents] = useState<AgentData[]>(agents);
  const [standupEntries, setStandupEntries] = useState<StandupEntry[]>([]);

  useEffect(() => {
    if (!simulating) setSimAgents(agents);
  }, [agents, simulating]);

  const displayAgents = simulating ? simAgents : agents;

  // Initialize PixiJS game on mount
  useEffect(() => {
    // StrictMode guard: React 18 double-invokes effects in dev
    if (mountedRef.current) return;
    mountedRef.current = true;

    const container = containerRef.current;
    if (!container) return;

    let destroyed = false;

    (async () => {
      // Dynamic import to avoid SSR crash (PixiJS accesses window/document)
      const { createOfficeGame } = await import("@/lib/game");

      if (destroyed) return;

      const game = await createOfficeGame(container, agents, {
        onAgentClick: (agent) => setSelectedAgent(agent),
      });

      if (destroyed) {
        game.destroy();
        return;
      }

      gameRef.current = game;
    })();

    return () => {
      destroyed = true;
      if (gameRef.current) {
        gameRef.current.destroy();
        gameRef.current = null;
      }
      mountedRef.current = false;
    };
    // Only run on mount/unmount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sync agent data to game engine
  useEffect(() => {
    if (gameRef.current) {
      gameRef.current.updateAgents(displayAgents);
    }
  }, [displayAgents]);

  const runSimulation = useCallback(async () => {
    setSimulating(true);
    setStandupEntries([
      { emoji: "📋", name: "System", status: "working", message: "Briefing starting... agents heading to meeting room." },
    ]);

    if (gameRef.current) gameRef.current.setMeetingActive(true);

    const agentsCopy = agents.map((a) => ({ ...a, status: "idle" as string }));
    setSimAgents(agentsCopy);

    await new Promise((r) => setTimeout(r, 2000));

    for (let i = 0; i < agentsCopy.length; i++) {
      const agent = agentsCopy[i];
      setSimAgents((prev) =>
        prev.map((a) =>
          a.id === agent.id ? { ...a, status: "working" } : a
        )
      );
      setStandupEntries((prev) => [
        ...prev,
        { emoji: agent.emoji, name: agent.name, status: "working", message: "Running..." },
      ]);

      try {
        const res = await fetch(`/api/agents/${agent.id}/run`, {
          method: "POST",
        });
        const data = await res.json();
        const finalStatus = data.success ? "done" : "error";
        setSimAgents((prev) =>
          prev.map((a) =>
            a.id === agent.id
              ? {
                  ...a,
                  status: finalStatus,
                  last_output: data.output || a.last_output,
                  last_run_at: new Date().toISOString(),
                }
              : a
          )
        );
        setStandupEntries((prev) => [
          ...prev,
          {
            emoji: agent.emoji,
            name: agent.name,
            status: finalStatus,
            message: data.success ? "Complete." : "Failed.",
          },
        ]);
      } catch {
        setSimAgents((prev) =>
          prev.map((a) =>
            a.id === agent.id ? { ...a, status: "error" } : a
          )
        );
        setStandupEntries((prev) => [
          ...prev,
          { emoji: agent.emoji, name: agent.name, status: "error", message: "Connection error." },
        ]);
      }
    }

    setStandupEntries((prev) => [
      ...prev,
      { emoji: "✅", name: "System", status: "done", message: "Briefing complete. Returning to desks." },
    ]);

    if (gameRef.current) gameRef.current.setMeetingActive(false);

    setSimulating(false);
  }, [agents]);

  const workingCount = displayAgents.filter(
    (a) => a.status === "working"
  ).length;
  const doneCount = displayAgents.filter((a) => a.status === "done").length;
  const idleCount = displayAgents.filter((a) => a.status === "idle").length;

  return (
    <>
      {/* Controls */}
      <div className="mb-4 flex flex-wrap items-center justify-center gap-4">
        <div className="flex items-center gap-4 text-xs text-muted">
          <span className="flex items-center gap-1.5">
            <span
              className="h-2 w-2 rounded-full"
              style={{ background: "#00cc66" }}
            />
            {doneCount} done
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-amber animate-pulse" />
            {workingCount} working
          </span>
          <span className="flex items-center gap-1.5">
            <span
              className="h-2 w-2 rounded-full"
              style={{ background: "#888" }}
            />
            {idleCount} idle
          </span>
        </div>
        <button
          onClick={runSimulation}
          disabled={simulating}
          className={`rounded-lg border px-4 py-1.5 font-mono text-xs font-bold transition-all ${
            simulating
              ? "cursor-wait border-amber/40 text-amber"
              : "border-green/30 text-green hover:border-green/60 hover:bg-green/10"
          }`}
        >
          {simulating ? "Simulating..." : "Run Simulation"}
        </button>
      </div>

      {/* Canvas + Sim Log */}
      <div className="flex gap-4">
        <div className="flex-1 overflow-hidden">
          <div
            ref={containerRef}
            className="mx-auto rounded-xl"
            style={{
              maxWidth: 800,
              aspectRatio: "8 / 5",
              background: "#0a0a18",
            }}
          />
        </div>

        {/* Live standup panel */}
        <StandupPanel entries={standupEntries} />
      </div>

      {/* Bottom agent bar */}
      <div className="mt-4 flex items-center justify-center gap-1 overflow-x-auto rounded-lg border border-border bg-surface p-2">
        {displayAgents.map((agent) => {
          const statusColor: Record<string, string> = {
            idle: "#888888",
            working: "#ffcc00",
            done: "#00cc66",
            error: "#ff4444",
          };
          return (
            <button
              key={agent.id}
              onClick={() => setSelectedAgent(agent)}
              className="flex items-center gap-1.5 rounded-md px-2 py-1 text-xs transition-colors hover:bg-elevated"
            >
              <span
                className={`h-1.5 w-1.5 rounded-full ${
                  agent.status === "working" ? "animate-pulse" : ""
                }`}
                style={{ backgroundColor: statusColor[agent.status] }}
              />
              <span className="text-text-secondary">{agent.emoji}</span>
              <span className="hidden font-mono text-[0.6rem] text-muted sm:inline">
                {agent.name}
              </span>
            </button>
          );
        })}
      </div>

      <AgentOutputDrawer
        agent={selectedAgent}
        onClose={() => setSelectedAgent(null)}
      />
    </>
  );
}
