"use client";

import { useState, useEffect, useCallback } from "react";
import type { AgentData } from "./agent-card";
import { AgentOutputDrawer } from "./agent-output-drawer";

const STATUS_COLOR: Record<string, string> = {
  idle: "#888888",
  working: "#ffcc00",
  done: "#00cc66",
  error: "#ff4444",
};

const SCREEN_BG: Record<string, string> = {
  idle: "#1a2a3a",
  working: "#332800",
  done: "#0a2815",
  error: "#2a1010",
};

// Desk positions on the floor (x%, y% of floor dimensions)
const DESK_POSITIONS: Record<string, { x: number; y: number }[]> = {
  executive: [{ x: 12, y: 12 }],
  operations: [{ x: 38, y: 8 }, { x: 50, y: 8 }, { x: 44, y: 22 }],
  finance: [{ x: 78, y: 8 }, { x: 88, y: 8 }],
  marketing: [{ x: 10, y: 62 }, { x: 22, y: 62 }],
  engineering: [{ x: 38, y: 58 }, { x: 50, y: 58 }, { x: 38, y: 74 }, { x: 50, y: 74 }],
  security: [{ x: 78, y: 62 }, { x: 88, y: 62 }],
};

const MEETING_POS = { x: 45, y: 40 };

const ZONE_META: Record<string, { label: string; color: string; lx: number; ly: number }> = {
  executive: { label: "EXECUTIVE", color: "#777", lx: 12, ly: 5 },
  operations: { label: "OPERATIONS", color: "#b08800", lx: 44, ly: 2 },
  finance: { label: "FINANCE", color: "#008844", lx: 83, ly: 2 },
  marketing: { label: "MARKETING", color: "#cc4422", lx: 16, ly: 55 },
  engineering: { label: "ENGINEERING", color: "#2266cc", lx: 44, ly: 52 },
  security: { label: "SECURITY", color: "#7733aa", lx: 83, ly: 55 },
};

// Pixel person as inline SVG
function PixelSprite({ color, isWorking }: { color: string; isWorking: boolean }) {
  const p = 2;
  const skin = "#e8c8a0";
  const hair = color === "#ffffff" ? "#555" : color;
  const pants = "#334455";

  return (
    <svg width="24" height="32" viewBox="-8 -18 16 32" className="select-none">
      {/* Hair */}
      <rect x={-1 * p} y={-8 * p} width={3 * p} height={p} fill={hair} />
      <rect x={-2 * p} y={-7 * p} width={4 * p} height={p} fill={hair} />
      {/* Face */}
      <rect x={-1 * p} y={-7 * p} width={p} height={p} fill={skin} />
      <rect x={0} y={-7 * p} width={p} height={p} fill={skin} />
      <rect x={-1 * p} y={-6 * p} width={p} height={p} fill="#333" />
      <rect x={1 * p} y={-6 * p} width={p} height={p} fill="#333" />
      <rect x={-1 * p} y={-5 * p} width={p} height={p} fill={skin} />
      <rect x={0} y={-5 * p} width={p} height={p} fill="#c88" />
      <rect x={1 * p} y={-5 * p} width={p} height={p} fill={skin} />
      {/* Neck */}
      <rect x={0} y={-4 * p} width={p} height={p} fill={skin} />
      {/* Shirt */}
      <rect x={-2 * p} y={-3 * p} width={5 * p} height={p} fill={color} />
      <rect x={-3 * p} y={-2 * p} width={7 * p} height={p} fill={color} />
      <rect x={-2 * p} y={-1 * p} width={5 * p} height={p} fill={color} />
      {/* Arms */}
      <rect x={-3 * p} y={-2 * p} width={p} height={p} fill={skin} />
      <rect x={3 * p} y={-2 * p} width={p} height={p} fill={skin} />
      {/* Belt */}
      <rect x={-2 * p} y={0} width={5 * p} height={p} fill="#444" />
      {/* Pants */}
      <rect x={-2 * p} y={p} width={5 * p} height={p} fill={pants} />
      <rect x={-2 * p} y={2 * p} width={2 * p} height={p} fill={pants} />
      <rect x={1 * p} y={2 * p} width={2 * p} height={p} fill={pants} />
      {/* Shoes */}
      <rect x={-2 * p} y={3 * p} width={2 * p} height={p} fill="#222" />
      <rect x={1 * p} y={3 * p} width={2 * p} height={p} fill="#222" />
      {/* Typing hands */}
      {isWorking && (
        <>
          <rect x={-4 * p} y={-2 * p} width={p} height={p} fill={skin}>
            <animate attributeName="y" values={`${-2 * p};${-3 * p};${-2 * p}`} dur="0.35s" repeatCount="indefinite" />
          </rect>
          <rect x={4 * p} y={-2 * p} width={p} height={p} fill={skin}>
            <animate attributeName="y" values={`${-2 * p};${-3 * p};${-2 * p}`} dur="0.35s" begin="0.17s" repeatCount="indefinite" />
          </rect>
        </>
      )}
    </svg>
  );
}

// Agent on the floor
function FloorAgent({
  agent,
  x,
  y,
  inMeeting,
  onClick,
}: {
  agent: AgentData;
  x: number;
  y: number;
  inMeeting: boolean;
  onClick: () => void;
}) {
  const isWorking = agent.status === "working";
  const targetX = inMeeting ? MEETING_POS.x : x;
  const targetY = inMeeting ? MEETING_POS.y : y;

  return (
    <div
      className="iso-agent absolute cursor-pointer"
      style={{
        left: `${targetX}%`,
        top: `${targetY}%`,
        zIndex: Math.round(targetY),
        marginLeft: -12,
        marginTop: -36,
      }}
      onClick={onClick}
    >
      {/* Pixel person */}
      <PixelSprite color={agent.color} isWorking={isWorking} />

      {/* Status dot */}
      <div
        className={`absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full border border-white/20 ${isWorking ? "animate-pulse" : ""}`}
        style={{ backgroundColor: STATUS_COLOR[agent.status] }}
      />

      {/* Name label */}
      <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 whitespace-nowrap">
        <span className="rounded bg-black/50 px-1 py-0.5 font-mono text-[7px] font-bold text-white">
          {agent.name}
        </span>
      </div>

      {/* Chat bubble when working */}
      {isWorking && (
        <div className="iso-bubble absolute -right-8 -top-6 rounded-lg border border-amber/30 bg-surface/95 px-1.5 py-0.5 backdrop-blur-sm">
          <span className="font-mono text-[6px] text-amber">working...</span>
        </div>
      )}
    </div>
  );
}

// Desk on the floor (stays flat)
function FloorDesk({ x, y, hasMonitor, screenColor }: { x: number; y: number; hasMonitor?: boolean; screenColor?: string }) {
  return (
    <div
      className="absolute"
      style={{ left: `${x}%`, top: `${y}%`, marginLeft: -18, marginTop: -8 }}
    >
      {/* Monitor */}
      {hasMonitor && (
        <div className="iso-agent absolute -top-4 left-1/2 -translate-x-1/2">
          <div className="iso-monitor">
            <div className="iso-monitor-screen" style={{ background: screenColor || "#1a2a3a" }} />
          </div>
        </div>
      )}
      {/* Desk surface */}
      <div className="iso-desk" />
    </div>
  );
}

// Zone labels
const ZONE_ORDER = ["executive", "operations", "finance", "marketing", "engineering", "security"];

// Mobile uses the same isometric view with horizontal scroll

export function OfficeView({ agents }: { agents: AgentData[] }) {
  const [selectedAgent, setSelectedAgent] = useState<AgentData | null>(null);
  const [simulating, setSimulating] = useState(false);
  const [simAgents, setSimAgents] = useState<AgentData[]>(agents);
  const [simLog, setSimLog] = useState<string[]>([]);
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
    setSimLog(["Briefing starting..."]);
    setMeetingActive(true);

    const agentsCopy = agents.map((a) => ({ ...a, status: "idle" as string }));
    setSimAgents(agentsCopy);

    // Wait for walk animation
    await new Promise((r) => setTimeout(r, 2000));

    for (let i = 0; i < agentsCopy.length; i++) {
      const agent = agentsCopy[i];
      setSimAgents((prev) => prev.map((a) => (a.id === agent.id ? { ...a, status: "working" } : a)));
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
        setSimLog((prev) => [...prev, data.success ? `${agent.emoji} ${agent.name} done.` : `${agent.emoji} ${agent.name} failed.`]);
      } catch {
        setSimAgents((prev) => prev.map((a) => (a.id === agent.id ? { ...a, status: "error" } : a)));
        setSimLog((prev) => [...prev, `${agent.emoji} ${agent.name} errored.`]);
      }
    }

    setSimLog((prev) => [...prev, "Briefing complete. Agents returning to desks."]);
    setMeetingActive(false);
    setSimulating(false);
  }, [agents]);

  // Build agent position map
  const agentPositions: { agent: AgentData; x: number; y: number }[] = [];
  const agentsByZone: Record<string, AgentData[]> = {};
  for (const zone of ZONE_ORDER) {
    agentsByZone[zone] = displayAgents.filter((a) => a.zone === zone);
    const positions = DESK_POSITIONS[zone] || [];
    agentsByZone[zone].forEach((agent, i) => {
      const pos = positions[i];
      if (pos) agentPositions.push({ agent, x: pos.x, y: pos.y });
    });
  }

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

      {/* Isometric office - works on all screens */}
      <div className="overflow-x-auto">
        <div className="flex gap-4" style={{ minWidth: 600 }}>
          <div className="flex-1 flex items-center justify-center py-4 md:py-8">
            <div className="iso-scene w-full" style={{ maxWidth: 700, minHeight: 350 }}>
              <div className="iso-floor mx-auto" style={{ width: "min(550px, 85vw)", height: "min(400px, 65vw)", minWidth: 320, minHeight: 240 }}>

                {/* Zone labels */}
                {ZONE_ORDER.map((zone) => {
                  const meta = ZONE_META[zone];
                  return (
                    <div
                      key={zone}
                      className="iso-zone-label absolute"
                      style={{ left: `${meta.lx}%`, top: `${meta.ly}%` }}
                    >
                      <span className="font-pixel text-[4px] md:text-[5px] tracking-[0.15em] uppercase" style={{ color: meta.color, opacity: 0.6 }}>
                        {meta.label}
                      </span>
                    </div>
                  );
                })}

                {/* Zone dividers */}
                <div className="absolute left-[33%] top-[5%] h-[90%] w-px bg-[#c4b8a8]/40" />
                <div className="absolute left-[66%] top-[5%] h-[90%] w-px bg-[#c4b8a8]/40" />
                <div className="absolute left-[5%] top-[48%] h-px w-[90%] bg-[#c4b8a8]/40" />

                {/* Meeting table */}
                <div
                  className="absolute"
                  style={{ left: `${MEETING_POS.x}%`, top: `${MEETING_POS.y}%`, marginLeft: -20, marginTop: -20 }}
                >
                  <div className="iso-meeting-table" style={{ width: 40, height: 40 }} />
                </div>

                {/* Desks */}
                {agentPositions.map(({ agent, x, y }) => (
                  <FloorDesk
                    key={`desk-${agent.id}`}
                    x={x}
                    y={y}
                    hasMonitor
                    screenColor={SCREEN_BG[agent.status]}
                  />
                ))}

                {/* Plants */}
                {[
                  { x: 28, y: 30 }, { x: 68, y: 30 }, { x: 5, y: 48 },
                  { x: 95, y: 48 }, { x: 28, y: 88 }, { x: 68, y: 88 },
                ].map((pos, i) => (
                  <div
                    key={`plant-${i}`}
                    className="iso-plant absolute"
                    style={{ left: `${pos.x}%`, top: `${pos.y}%`, marginLeft: -6 }}
                  >
                    <div className="h-3 w-3 rounded-full bg-green-800/70" />
                    <div className="mx-auto h-2 w-1.5 bg-amber-900/60" />
                  </div>
                ))}

                {/* Agents */}
                {agentPositions.map(({ agent, x, y }) => (
                  <FloorAgent
                    key={agent.id}
                    agent={agent}
                    x={x}
                    y={y}
                    inMeeting={meetingActive && simulating}
                    onClick={() => setSelectedAgent(agent)}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Sim log (desktop only) */}
          {simLog.length > 0 && (
            <div className="hidden w-56 flex-shrink-0 overflow-y-auto rounded-lg border border-border bg-surface p-3 lg:block" style={{ maxHeight: 500 }}>
              <h3 className="mb-2 font-mono text-xs font-bold text-text-primary">Sim Log</h3>
              {simLog.map((line, i) => (
                <p key={i} className="text-[0.65rem] leading-relaxed text-text-secondary">{line}</p>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Bottom bar */}
      <div className="mt-4 flex items-center justify-center gap-1 overflow-x-auto rounded-lg border border-border bg-surface p-2">
        {displayAgents.map((agent) => (
          <button key={agent.id} onClick={() => setSelectedAgent(agent)}
            className="flex items-center gap-1.5 rounded-md px-2 py-1 text-xs hover:bg-elevated transition-colors">
            <span className={`h-1.5 w-1.5 rounded-full ${agent.status === "working" ? "animate-pulse" : ""}`}
              style={{ backgroundColor: STATUS_COLOR[agent.status] }} />
            <span className="text-text-secondary">{agent.emoji}</span>
            <span className="hidden font-mono text-[0.6rem] text-muted sm:inline">{agent.name}</span>
          </button>
        ))}
      </div>

      <AgentOutputDrawer agent={selectedAgent} onClose={() => setSelectedAgent(null)} />
    </>
  );
}
