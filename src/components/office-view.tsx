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

// -- Pixel Person (8-bit character) --
function PixelPerson({
  color,
  isWorking,
  flip,
}: {
  color: string;
  isWorking: boolean;
  flip?: boolean;
}) {
  const p = 2;
  const skin = "#e8c8a0";
  const hair = color === "#ffffff" ? "#555566" : color;
  const pants = "#334";
  const shoe = "#222";

  const pixels = [
    { x: -2, y: -16, c: hair }, { x: -1, y: -16, c: hair }, { x: 0, y: -16, c: hair }, { x: 1, y: -16, c: hair },
    { x: -3, y: -15, c: hair }, { x: -2, y: -15, c: hair }, { x: -1, y: -15, c: skin }, { x: 0, y: -15, c: skin }, { x: 1, y: -15, c: hair }, { x: 2, y: -15, c: hair },
    { x: -2, y: -14, c: skin }, { x: -1, y: -14, c: "#333" }, { x: 0, y: -14, c: skin }, { x: 1, y: -14, c: "#333" },
    { x: -2, y: -13, c: skin }, { x: -1, y: -13, c: skin }, { x: 0, y: -13, c: "#c88" }, { x: 1, y: -13, c: skin },
    { x: -1, y: -12, c: skin }, { x: 0, y: -12, c: skin },
    { x: -3, y: -11, c: color }, { x: -2, y: -11, c: color }, { x: -1, y: -11, c: color }, { x: 0, y: -11, c: color }, { x: 1, y: -11, c: color }, { x: 2, y: -11, c: color },
    { x: -4, y: -10, c: skin }, { x: -3, y: -10, c: color }, { x: -2, y: -10, c: color }, { x: -1, y: -10, c: color }, { x: 0, y: -10, c: color }, { x: 1, y: -10, c: color }, { x: 2, y: -10, c: color }, { x: 3, y: -10, c: skin },
    { x: -3, y: -9, c: color }, { x: -2, y: -9, c: color }, { x: -1, y: -9, c: color }, { x: 0, y: -9, c: color }, { x: 1, y: -9, c: color }, { x: 2, y: -9, c: color },
    { x: -5, y: -8, c: skin }, { x: -4, y: -8, c: skin }, { x: 3, y: -8, c: skin }, { x: 4, y: -8, c: skin },
    { x: -2, y: -8, c: "#444" }, { x: -1, y: -8, c: "#444" }, { x: 0, y: -8, c: "#444" }, { x: 1, y: -8, c: "#444" },
    { x: -3, y: -7, c: pants }, { x: -2, y: -7, c: pants }, { x: -1, y: -7, c: pants }, { x: 0, y: -7, c: pants }, { x: 1, y: -7, c: pants }, { x: 2, y: -7, c: pants },
    { x: -3, y: -6, c: pants }, { x: -2, y: -6, c: pants }, { x: 1, y: -6, c: pants }, { x: 2, y: -6, c: pants },
    { x: -4, y: -5, c: shoe }, { x: -3, y: -5, c: shoe }, { x: 2, y: -5, c: shoe }, { x: 3, y: -5, c: shoe },
  ];

  return (
    <g style={{ transform: flip ? "scale(-1,1)" : undefined }}>
      {pixels.map((px, i) => (
        <rect key={i} x={px.x * p} y={px.y * p + 24} width={p} height={p} fill={px.c} />
      ))}
      {isWorking && (
        <>
          <rect x={-5 * p} y={0} width={p * 2} height={p} fill={skin}>
            <animate attributeName="y" values={`${-8 * p + 24};${-9 * p + 24};${-8 * p + 24}`} dur="0.35s" repeatCount="indefinite" />
          </rect>
          <rect x={3 * p} y={0} width={p * 2} height={p} fill={skin}>
            <animate attributeName="y" values={`${-8 * p + 24};${-9 * p + 24};${-8 * p + 24}`} dur="0.35s" begin="0.17s" repeatCount="indefinite" />
          </rect>
        </>
      )}
    </g>
  );
}

// -- Workstation (desk + monitor + chair + pixel person) --
function IsoDesk({
  agent,
  flip,
  onClick,
}: {
  agent: AgentData;
  flip?: boolean;
  onClick: () => void;
}) {
  const isWorking = agent.status === "working";

  return (
    <g onClick={onClick} className="cursor-pointer" style={{ transform: flip ? "scale(-1,1)" : undefined }}>
      {/* Shadow */}
      <ellipse cx="0" cy="12" rx="30" ry="8" fill="rgba(0,0,0,0.12)" />

      {/* Desk */}
      <path d="M-24,-4 L24,-4 L28,0 L-20,0 Z" fill="#c4a882" stroke="#d4b892" strokeWidth="0.5" />
      <path d="M-20,0 L28,0 L28,3 L-20,3 Z" fill="#b09070" />
      <rect x="-22" y="-2" width="2" height="12" fill="#a08060" />
      <rect x="20" y="-2" width="2" height="12" fill="#a08060" />

      {/* Monitor */}
      <rect x="-10" y="-22" width="20" height="16" rx="1" fill="#1a1a22" stroke="#333" strokeWidth="0.5" />
      <rect x="-8" y="-20" width="16" height="12" rx="0.5" fill={SCREEN_BG[agent.status]}>
        {isWorking && <animate attributeName="opacity" values="0.85;1;0.85" dur="2s" repeatCount="indefinite" />}
      </rect>
      <rect x="-8" y="-20" width="16" height="12" rx="0.5" fill="none" stroke={STATUS_DOT[agent.status]} strokeWidth="0.3" opacity="0.4" />
      {agent.status === "done" && (
        <g opacity="0.5">
          <rect x="-6" y="-18" width="8" height="1" fill="#00cc66" opacity="0.4" />
          <rect x="-6" y="-16" width="11" height="1" fill="#00cc66" opacity="0.3" />
          <rect x="-6" y="-14" width="6" height="1" fill="#00cc66" opacity="0.2" />
        </g>
      )}
      {isWorking && (
        <g>
          <rect x="-6" y="-17" width="4" height="1" fill="#ffcc00" opacity="0.6">
            <animate attributeName="width" values="4;8;4" dur="1.5s" repeatCount="indefinite" />
          </rect>
          <rect x="-6" y="-15" width="7" height="1" fill="#ffcc00" opacity="0.3">
            <animate attributeName="width" values="7;3;7" dur="2s" repeatCount="indefinite" />
          </rect>
        </g>
      )}
      <rect x="-2" y="-6" width="4" height="3" fill="#1a1a22" />
      <rect x="-6" y="-4" width="12" height="1.5" rx="0.5" fill="#2a2a30" />

      {/* Keyboard */}
      <rect x="-8" y="-2" width="12" height="2" rx="0.5" fill="#2a2a30" />

      {/* Chair */}
      <g transform="translate(0, 14)">
        <ellipse cx="0" cy="2" rx="6" ry="2" fill="#333" />
        <rect x="-6" y="-3" width="12" height="5" rx="2" fill="#2a2a38" />
        <rect x="-5" y="-10" width="10" height="8" rx="2" fill="#222230" />
      </g>

      {/* Pixel person */}
      <g transform="translate(0, 2)">
        <PixelPerson color={agent.color} isWorking={isWorking} flip={flip} />
      </g>

      {/* Status dot */}
      <circle cx="14" cy="-22" r="2.5" fill={STATUS_DOT[agent.status]}>
        {isWorking && <animate attributeName="opacity" values="1;0.3;1" dur="1s" repeatCount="indefinite" />}
      </circle>

      {/* Name */}
      <text x="0" y="32" textAnchor="middle" fill="#444" fontSize="5.5" fontWeight="bold" fontFamily="var(--font-space-mono), monospace" className="select-none"
        style={{ transform: flip ? "scale(-1,1)" : undefined, transformOrigin: "0 32px" }}>
        {agent.name}
      </text>

      {/* Working bubble */}
      {isWorking && (
        <g style={{ transform: flip ? "scale(-1,1)" : undefined, transformOrigin: "14px -28px" }}>
          <rect x="6" y="-32" width="28" height="8" rx="3" fill="white" stroke="#ddd" strokeWidth="0.5" />
          <text x="20" y="-26" textAnchor="middle" fontSize="4" fill="#cc9900" fontFamily="var(--font-space-mono)">typing...</text>
        </g>
      )}
    </g>
  );
}

// -- Office furniture (warm corporate colors) --
function MeetingRoom() {
  return (
    <g>
      <ellipse cx="0" cy="8" rx="30" ry="10" fill="rgba(0,0,0,0.08)" />
      <ellipse cx="0" cy="0" rx="20" ry="8" fill="#8a7050" />
      <ellipse cx="0" cy="-2" rx="20" ry="8" fill="#c4a882" stroke="#d4b892" strokeWidth="0.5" />
      {[-25, 25].map((x) =>
        [-6, 6].map((y, i) => (
          <ellipse key={`${x}-${i}`} cx={x} cy={y} rx="5" ry="3" fill="#2a2a38" stroke="#333" strokeWidth="0.3" />
        ))
      )}
      <rect x="-5" y="-4" width="4" height="3" rx="0.5" fill="#1a1a22" opacity="0.6" />
      <circle cx="8" cy="-1" r="2" fill="#6b4020" opacity="0.5" />
    </g>
  );
}

function Couch() {
  return (
    <g>
      <ellipse cx="0" cy="6" rx="22" ry="5" fill="rgba(0,0,0,0.06)" />
      <rect x="-18" y="-4" width="36" height="10" rx="3" fill="#3a3a42" stroke="#4a4a50" strokeWidth="0.5" />
      <rect x="-18" y="-10" width="36" height="8" rx="3" fill="#444450" stroke="#555560" strokeWidth="0.5" />
      <rect x="-15" y="-3" width="12" height="8" rx="2" fill="#444450" opacity="0.5" />
      <rect x="3" y="-3" width="12" height="8" rx="2" fill="#444450" opacity="0.5" />
      <rect x="-8" y="12" width="16" height="6" rx="1" fill="#b09070" stroke="#c4a882" strokeWidth="0.3" />
    </g>
  );
}

function PlantPot() {
  return (
    <g>
      <rect x="-3" y="2" width="6" height="6" rx="1" fill="#8a7050" />
      <circle cx="0" cy="-2" r="6" fill="#2a6a3a" opacity="0.8" />
      <circle cx="-3" cy="-5" r="4" fill="#3a8a4a" opacity="0.6" />
      <circle cx="3" cy="-4" r="4.5" fill="#2a7a3a" opacity="0.7" />
    </g>
  );
}

function WaterCooler() {
  return (
    <g>
      <rect x="-4" y="-2" width="8" height="14" rx="1" fill="#ccc" stroke="#bbb" strokeWidth="0.5" />
      <rect x="-3" y="-8" width="6" height="7" rx="1" fill="#88ccff" opacity="0.5" />
      <rect x="-3" y="-9" width="6" height="2" rx="0.5" fill="#aaa" />
    </g>
  );
}

// -- Layout --
const OFFICE_LAYOUT = {
  zones: {
    core: {
      area: { x: 40, y: 40, w: 340, h: 180 },
      label: { text: "COMMAND", x: 210, y: 58, color: "#555" },
      agents: [{ x: 160, y: 130, flip: false }],
    },
    yelp: {
      area: { x: 420, y: 40, w: 340, h: 180 },
      label: { text: "YELP OPS", x: 590, y: 58, color: "#b08800" },
      agents: [
        { x: 490, y: 110, flip: false },
        { x: 590, y: 110, flip: true },
        { x: 690, y: 110, flip: false },
      ],
    },
    flowstate: {
      area: { x: 40, y: 260, w: 340, h: 200 },
      label: { text: "FLOWSTATE LAB", x: 210, y: 278, color: "#7744aa" },
      agents: [
        { x: 100, y: 330, flip: false },
        { x: 200, y: 330, flip: true },
        { x: 100, y: 410, flip: false },
        { x: 200, y: 410, flip: true },
      ],
    },
    personal: {
      area: { x: 420, y: 260, w: 340, h: 200 },
      label: { text: "PERSONAL STACK", x: 590, y: 278, color: "#0088aa" },
      agents: [
        { x: 490, y: 330, flip: false },
        { x: 590, y: 330, flip: true },
        { x: 690, y: 330, flip: false },
        { x: 590, y: 410, flip: true },
      ],
    },
  },
  features: {
    meetingRoom: { x: 330, y: 160 },
    couch: { x: 400, y: 430 },
    plants: [
      { x: 60, y: 140 }, { x: 310, y: 140 }, { x: 740, y: 140 },
      { x: 60, y: 420 }, { x: 310, y: 420 }, { x: 740, y: 420 },
    ],
    waterCooler: { x: 380, y: 300 },
  },
};

// -- Main Office View --
export function OfficeView({ agents }: { agents: AgentData[] }) {
  const [selectedAgent, setSelectedAgent] = useState<AgentData | null>(null);
  const [simulating, setSimulating] = useState(false);
  const [simAgents, setSimAgents] = useState<AgentData[]>(agents);
  const [simLog, setSimLog] = useState<string[]>([]);

  // Keep simAgents in sync with prop changes
  useEffect(() => {
    if (!simulating) setSimAgents(agents);
  }, [agents, simulating]);

  const displayAgents = simulating ? simAgents : agents;

  const workingCount = displayAgents.filter((a) => a.status === "working").length;
  const doneCount = displayAgents.filter((a) => a.status === "done").length;
  const idleCount = displayAgents.filter((a) => a.status === "idle").length;

  const agentsByZone: Record<string, AgentData[]> = {
    core: displayAgents.filter((a) => a.zone === "core"),
    yelp: displayAgents.filter((a) => a.zone === "yelp"),
    flowstate: displayAgents.filter((a) => a.zone === "flowstate"),
    personal: displayAgents.filter((a) => a.zone === "personal"),
  };

  // Simulation: run agents one by one with visual feedback
  const runSimulation = useCallback(async () => {
    setSimulating(true);
    setSimLog(["Simulation starting..."]);

    const agentsCopy = agents.map((a) => ({ ...a, status: "idle" as string }));
    setSimAgents(agentsCopy);

    for (let i = 0; i < agentsCopy.length; i++) {
      const agent = agentsCopy[i];

      // Set current agent to working
      setSimAgents((prev) =>
        prev.map((a) => (a.id === agent.id ? { ...a, status: "working" } : a))
      );
      setSimLog((prev) => [...prev, `${agent.emoji} ${agent.name} is working...`]);

      // Actually call the API
      try {
        const res = await fetch(`/api/agents/${agent.id}/run`, { method: "POST" });
        const data = await res.json();

        setSimAgents((prev) =>
          prev.map((a) =>
            a.id === agent.id
              ? {
                  ...a,
                  status: data.success ? "done" : "error",
                  last_output: data.output || a.last_output,
                  last_run_at: new Date().toISOString(),
                }
              : a
          )
        );
        setSimLog((prev) => [
          ...prev,
          data.success
            ? `${agent.emoji} ${agent.name} completed.`
            : `${agent.emoji} ${agent.name} failed: ${data.error}`,
        ]);
      } catch {
        setSimAgents((prev) =>
          prev.map((a) => (a.id === agent.id ? { ...a, status: "error" } : a))
        );
        setSimLog((prev) => [...prev, `${agent.emoji} ${agent.name} errored.`]);
      }
    }

    setSimLog((prev) => [...prev, "Simulation complete."]);
    setSimulating(false);
  }, [agents]);

  return (
    <>
      {/* Controls bar */}
      <div className="mb-4 flex flex-wrap items-center justify-center gap-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full" style={{ background: "#00cc66" }} />
            <span className="text-xs text-muted">{doneCount} done</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-amber animate-pulse" />
            <span className="text-xs text-muted">{workingCount} working</span>
          </div>
          <div className="flex items-center gap-2">
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

      <div className="flex gap-4">
        {/* Office SVG */}
        <div
          className="flex-1 overflow-x-auto rounded-2xl border"
          style={{ background: "#e8ddd0", borderColor: "#c4b8a8" }}
        >
          <svg
            viewBox="0 0 800 500"
            className="w-full"
            style={{ minWidth: 600, maxWidth: 960 }}
          >
            <defs>
              <pattern id="floorTile" width="40" height="40" patternUnits="userSpaceOnUse">
                <rect width="40" height="40" fill="#ddd2c2" />
                <rect x="0" y="0" width="20" height="20" fill="#e2d7c8" />
                <rect x="20" y="20" width="20" height="20" fill="#e2d7c8" />
              </pattern>
              <radialGradient id="warmGlow" cx="50%" cy="40%" r="60%">
                <stop offset="0%" stopColor="rgba(255,220,160,0.15)" />
                <stop offset="100%" stopColor="rgba(0,0,0,0)" />
              </radialGradient>
              <filter id="shadow">
                <feDropShadow dx="0" dy="1" stdDeviation="2" floodColor="rgba(0,0,0,0.1)" />
              </filter>
            </defs>

            {/* Floor */}
            <rect x="20" y="20" width="760" height="460" rx="8" fill="url(#floorTile)" />
            <rect x="20" y="20" width="760" height="460" rx="8" fill="url(#warmGlow)" />

            {/* Walls */}
            <rect x="20" y="20" width="760" height="460" rx="8" fill="none" stroke="#b8a890" strokeWidth="3" />

            {/* Zone dividers (subtle) */}
            <line x1="400" y1="30" x2="400" y2="470" stroke="#c4b8a8" strokeWidth="1" strokeDasharray="6,4" />
            <line x1="30" y1="240" x2="770" y2="240" stroke="#c4b8a8" strokeWidth="1" strokeDasharray="6,4" />

            {/* Zone labels */}
            {Object.entries(OFFICE_LAYOUT.zones).map(([zone, config]) => (
              <g key={zone}>
                <rect
                  x={config.area.x}
                  y={config.area.y}
                  width={config.area.w}
                  height={config.area.h}
                  rx="4"
                  fill={`${config.label.color}08`}
                />
                <text
                  x={config.label.x}
                  y={config.label.y}
                  textAnchor="middle"
                  fill={config.label.color}
                  fontSize="7"
                  fontFamily="var(--font-press-start), monospace"
                  letterSpacing="2"
                  opacity="0.5"
                  className="select-none"
                >
                  {config.label.text}
                </text>
              </g>
            ))}

            {/* Furniture */}
            <g transform={`translate(${OFFICE_LAYOUT.features.meetingRoom.x}, ${OFFICE_LAYOUT.features.meetingRoom.y})`}>
              <MeetingRoom />
            </g>
            <g transform={`translate(${OFFICE_LAYOUT.features.couch.x}, ${OFFICE_LAYOUT.features.couch.y})`}>
              <Couch />
            </g>
            <g transform={`translate(${OFFICE_LAYOUT.features.waterCooler.x}, ${OFFICE_LAYOUT.features.waterCooler.y})`}>
              <WaterCooler />
            </g>
            {OFFICE_LAYOUT.features.plants.map((pos, i) => (
              <g key={i} transform={`translate(${pos.x}, ${pos.y})`}>
                <PlantPot />
              </g>
            ))}

            {/* Agent workstations */}
            {Object.entries(OFFICE_LAYOUT.zones).map(([zone, config]) =>
              agentsByZone[zone]?.map((agent, i) => {
                const pos = config.agents[i];
                if (!pos) return null;
                return (
                  <g key={agent.id} transform={`translate(${pos.x}, ${pos.y})`}>
                    <IsoDesk agent={agent} flip={pos.flip} onClick={() => setSelectedAgent(agent)} />
                  </g>
                );
              })
            )}

            {/* Watermark */}
            <text x="400" y="490" textAnchor="middle" fill="#b8a89040" fontSize="6"
              fontFamily="var(--font-press-start), monospace" letterSpacing="4" className="select-none">
              FLOWSTATE HEADQUARTERS
            </text>
          </svg>
        </div>

        {/* Simulation log (visible during/after sim) */}
        {simLog.length > 0 && (
          <div className="hidden w-64 flex-shrink-0 overflow-y-auto rounded-lg border border-border bg-surface p-3 lg:block"
            style={{ maxHeight: 500 }}>
            <h3 className="mb-2 font-mono text-xs font-bold text-text-primary">Simulation Log</h3>
            <div className="space-y-1">
              {simLog.map((line, i) => (
                <p key={i} className="text-[0.65rem] leading-relaxed text-text-secondary">
                  {line}
                </p>
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
            title={`${agent.name}: ${agent.status}`}
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
