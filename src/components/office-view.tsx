"use client";

import { useState, useEffect, useCallback } from "react";
import type { AgentData } from "./agent-card";
import { AgentOutputDrawer } from "./agent-output-drawer";

const STATUS_DOT: Record<string, string> = {
  idle: "#888",
  working: "#ffcc00",
  done: "#00cc66",
  error: "#ff4444",
};

const SCREEN_BG: Record<string, string> = {
  idle: "#1a2a3a",
  working: "#2a2800",
  done: "#0a2815",
  error: "#2a1010",
};

// Pixel Person: 8-bit character
function PixelPerson({ color, isWorking }: { color: string; isWorking: boolean }) {
  const p = 3;
  const skin = "#e8c8a0";
  const hair = color === "#ffffff" ? "#555566" : color;
  const pants = "#334455";
  const shoe = "#222233";

  const rows: { y: number; pixels: { x: number; c: string }[] }[] = [
    { y: -8, pixels: [{ x: -1, c: hair }, { x: 0, c: hair }, { x: 1, c: hair }] },
    { y: -7, pixels: [{ x: -2, c: hair }, { x: -1, c: skin }, { x: 0, c: skin }, { x: 1, c: hair }] },
    { y: -6, pixels: [{ x: -1, c: "#333" }, { x: 0, c: skin }, { x: 1, c: "#333" }] },
    { y: -5, pixels: [{ x: -1, c: skin }, { x: 0, c: "#c88" }, { x: 1, c: skin }] },
    { y: -4, pixels: [{ x: 0, c: skin }] },
    { y: -3, pixels: [{ x: -2, c: color }, { x: -1, c: color }, { x: 0, c: color }, { x: 1, c: color }, { x: 2, c: color }] },
    { y: -2, pixels: [{ x: -3, c: skin }, { x: -2, c: color }, { x: -1, c: color }, { x: 0, c: color }, { x: 1, c: color }, { x: 2, c: color }, { x: 3, c: skin }] },
    { y: -1, pixels: [{ x: -2, c: color }, { x: -1, c: color }, { x: 0, c: color }, { x: 1, c: color }, { x: 2, c: color }] },
    { y: 0, pixels: [{ x: -2, c: pants }, { x: -1, c: pants }, { x: 0, c: "#444" }, { x: 1, c: pants }, { x: 2, c: pants }] },
    { y: 1, pixels: [{ x: -2, c: pants }, { x: -1, c: pants }, { x: 1, c: pants }, { x: 2, c: pants }] },
    { y: 2, pixels: [{ x: -2, c: shoe }, { x: -1, c: shoe }, { x: 1, c: shoe }, { x: 2, c: shoe }] },
  ];

  return (
    <g>
      {rows.map((row) =>
        row.pixels.map((px, i) => (
          <rect key={`${row.y}-${i}`} x={px.x * p} y={row.y * p} width={p} height={p} fill={px.c} />
        ))
      )}
      {isWorking && (
        <>
          <rect x={-4 * p} y={-2 * p} width={p} height={p} fill={skin}>
            <animate attributeName="y" values={`${-2 * p};${-3 * p};${-2 * p}`} dur="0.35s" repeatCount="indefinite" />
          </rect>
          <rect x={3 * p} y={-2 * p} width={p} height={p} fill={skin}>
            <animate attributeName="y" values={`${-2 * p};${-3 * p};${-2 * p}`} dur="0.35s" begin="0.17s" repeatCount="indefinite" />
          </rect>
        </>
      )}
    </g>
  );
}

// Single workstation with desk, monitor, person
function Workstation({ agent, onClick }: { agent: AgentData; onClick: () => void }) {
  const isWorking = agent.status === "working";

  return (
    <svg viewBox="-40 -40 80 75" width="80" height="75" className="cursor-pointer hover:opacity-90 transition-opacity" onClick={onClick}>
      {/* Shadow */}
      <ellipse cx="0" cy="20" rx="25" ry="6" fill="rgba(0,0,0,0.1)" />

      {/* Desk */}
      <rect x="-20" y="0" width="40" height="4" rx="1" fill="#c4a882" stroke="#d4b892" strokeWidth="0.5" />
      <rect x="-18" y="4" width="36" height="2" fill="#b09070" />
      <rect x="-18" y="4" width="2" height="10" fill="#a08060" />
      <rect x="16" y="4" width="2" height="10" fill="#a08060" />

      {/* Monitor */}
      <rect x="-10" y="-18" width="20" height="15" rx="1.5" fill="#1a1a22" stroke="#333" strokeWidth="0.5" />
      <rect x="-8" y="-16" width="16" height="11" rx="0.5" fill={SCREEN_BG[agent.status]} />
      <rect x="-8" y="-16" width="16" height="11" rx="0.5" fill="none" stroke={STATUS_DOT[agent.status]} strokeWidth="0.5" opacity="0.5" />
      {agent.status === "done" && (
        <g opacity="0.6">
          <rect x="-6" y="-14" width="8" height="1.5" fill="#00cc66" opacity="0.5" />
          <rect x="-6" y="-11.5" width="11" height="1.5" fill="#00cc66" opacity="0.3" />
          <rect x="-6" y="-9" width="6" height="1.5" fill="#00cc66" opacity="0.2" />
        </g>
      )}
      {isWorking && (
        <g>
          <rect x="-6" y="-13" width="4" height="1.5" fill="#ffcc00" opacity="0.7">
            <animate attributeName="width" values="4;10;4" dur="1.5s" repeatCount="indefinite" />
          </rect>
        </g>
      )}
      {/* Monitor stand */}
      <rect x="-2" y="-3" width="4" height="3" fill="#2a2a30" />

      {/* Keyboard */}
      <rect x="-7" y="1" width="10" height="2" rx="0.5" fill="#2a2a30" />

      {/* Chair */}
      <ellipse cx="0" cy="22" rx="8" ry="3" fill="#2a2a38" />

      {/* Pixel person */}
      <g transform="translate(0, 12)">
        <PixelPerson color={agent.color} isWorking={isWorking} />
      </g>

      {/* Status dot */}
      <circle cx="12" cy="-18" r="3" fill={STATUS_DOT[agent.status]}>
        {isWorking && <animate attributeName="opacity" values="1;0.3;1" dur="1s" repeatCount="indefinite" />}
      </circle>

      {/* Name */}
      <text x="0" y="32" textAnchor="middle" fill="#665544" fontSize="6" fontWeight="bold"
        fontFamily="var(--font-space-mono), monospace" className="select-none">
        {agent.name}
      </text>
    </svg>
  );
}

// Zone card with team info and agent workstations
function ZoneCard({
  name,
  icon,
  color,
  agents,
  onSelectAgent,
}: {
  name: string;
  icon: string;
  color: string;
  agents: AgentData[];
  onSelectAgent: (agent: AgentData) => void;
}) {
  return (
    <div
      className="rounded-xl border p-3"
      style={{
        background: "#e8ddd0",
        borderColor: "#c4b8a8",
      }}
    >
      {/* Zone header */}
      <div className="mb-2 flex items-center gap-2">
        <span className="text-base">{icon}</span>
        <span
          className="font-pixel text-[0.45rem] tracking-[0.15em] uppercase"
          style={{ color }}
        >
          {name}
        </span>
        <span className="ml-auto rounded-full bg-white/40 px-1.5 py-0.5 text-[0.55rem]" style={{ color }}>
          {agents.length}
        </span>
      </div>

      {/* Agent desks */}
      <div className="flex flex-wrap items-end justify-center gap-1">
        {agents.map((agent) => (
          <Workstation key={agent.id} agent={agent} onClick={() => onSelectAgent(agent)} />
        ))}
      </div>
    </div>
  );
}

const ZONE_META: Record<string, { icon: string; color: string }> = {
  executive: { icon: "👔", color: "#555555" },
  operations: { icon: "⚙️", color: "#b08800" },
  finance: { icon: "💰", color: "#008844" },
  marketing: { icon: "📢", color: "#cc4422" },
  engineering: { icon: "🔧", color: "#2266cc" },
  security: { icon: "🛡️", color: "#7733aa" },
};

const ZONE_ORDER = ["executive", "operations", "finance", "marketing", "engineering", "security"];

export function OfficeView({ agents }: { agents: AgentData[] }) {
  const [selectedAgent, setSelectedAgent] = useState<AgentData | null>(null);
  const [simulating, setSimulating] = useState(false);
  const [simAgents, setSimAgents] = useState<AgentData[]>(agents);
  const [simLog, setSimLog] = useState<string[]>([]);

  useEffect(() => {
    if (!simulating) setSimAgents(agents);
  }, [agents, simulating]);

  const displayAgents = simulating ? simAgents : agents;

  const workingCount = displayAgents.filter((a) => a.status === "working").length;
  const doneCount = displayAgents.filter((a) => a.status === "done").length;
  const idleCount = displayAgents.filter((a) => a.status === "idle").length;

  const runSimulation = useCallback(async () => {
    setSimulating(true);
    setSimLog(["Simulation starting..."]);

    const agentsCopy = agents.map((a) => ({ ...a, status: "idle" as string }));
    setSimAgents(agentsCopy);

    for (let i = 0; i < agentsCopy.length; i++) {
      const agent = agentsCopy[i];

      setSimAgents((prev) =>
        prev.map((a) => (a.id === agent.id ? { ...a, status: "working" } : a))
      );
      setSimLog((prev) => [...prev, `${agent.emoji} ${agent.name} is working...`]);

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
        setSimLog((prev) => [...prev, data.success ? `${agent.emoji} ${agent.name} completed.` : `${agent.emoji} ${agent.name} failed.`]);
      } catch {
        setSimAgents((prev) => prev.map((a) => (a.id === agent.id ? { ...a, status: "error" } : a)));
        setSimLog((prev) => [...prev, `${agent.emoji} ${agent.name} errored.`]);
      }
    }

    setSimLog((prev) => [...prev, "Simulation complete."]);
    setSimulating(false);
  }, [agents]);

  return (
    <>
      {/* Controls */}
      <div className="mb-4 flex flex-wrap items-center justify-center gap-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full" style={{ background: "#00cc66" }} />
            <span className="text-xs text-muted">{doneCount} done</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-amber animate-pulse" />
            <span className="text-xs text-muted">{workingCount} working</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full" style={{ background: "#888" }} />
            <span className="text-xs text-muted">{idleCount} idle</span>
          </div>
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

      {/* Office floor: zone cards in a responsive grid */}
      <div className="flex gap-4">
        <div className="flex-1 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {ZONE_ORDER.map((zone) => {
            const meta = ZONE_META[zone];
            const zoneAgents = displayAgents.filter((a) => a.zone === zone);
            return (
              <ZoneCard
                key={zone}
                name={zone.charAt(0).toUpperCase() + zone.slice(1)}
                icon={meta.icon}
                color={meta.color}
                agents={zoneAgents}
                onSelectAgent={setSelectedAgent}
              />
            );
          })}
        </div>

        {/* Simulation log */}
        {simLog.length > 0 && (
          <div className="hidden w-56 flex-shrink-0 overflow-y-auto rounded-lg border border-border bg-surface p-3 lg:block" style={{ maxHeight: 500 }}>
            <h3 className="mb-2 font-mono text-xs font-bold text-text-primary">Sim Log</h3>
            <div className="space-y-1">
              {simLog.map((line, i) => (
                <p key={i} className="text-[0.65rem] leading-relaxed text-text-secondary">{line}</p>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Bottom agent bar */}
      <div className="mt-4 flex items-center justify-center gap-1 overflow-x-auto rounded-lg border border-border bg-surface p-2">
        {displayAgents.map((agent) => (
          <button
            key={agent.id}
            onClick={() => setSelectedAgent(agent)}
            className="flex items-center gap-1.5 rounded-md px-2 py-1 text-xs hover:bg-elevated transition-colors"
          >
            <span
              className={`h-1.5 w-1.5 rounded-full ${agent.status === "working" ? "animate-pulse" : ""}`}
              style={{ backgroundColor: STATUS_DOT[agent.status] }}
            />
            <span className="text-text-secondary">{agent.emoji}</span>
            <span className="hidden font-mono text-[0.6rem] text-muted sm:inline">{agent.name}</span>
          </button>
        ))}
      </div>

      <AgentOutputDrawer agent={selectedAgent} onClose={() => setSelectedAgent(null)} />
    </>
  );
}
