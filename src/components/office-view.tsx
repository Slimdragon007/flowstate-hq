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

// Desk positions (x, y in SVG coordinates out of 600x440)
const DESK_POSITIONS: Record<string, { x: number; y: number }[]> = {
  executive: [{ x: 80, y: 65 }],
  operations: [{ x: 235, y: 50 }, { x: 310, y: 50 }, { x: 270, y: 110 }],
  finance: [{ x: 470, y: 50 }, { x: 540, y: 50 }],
  marketing: [{ x: 70, y: 290 }, { x: 145, y: 290 }],
  engineering: [{ x: 240, y: 275 }, { x: 315, y: 275 }, { x: 240, y: 345 }, { x: 315, y: 345 }],
  security: [{ x: 470, y: 290 }, { x: 540, y: 290 }],
};

const ZONE_ORDER = ["executive", "operations", "finance", "marketing", "engineering", "security"];

// Pixel person rendered as SVG rects
function PixelAgent({
  agent,
  targetX,
  targetY,
  onClick,
}: {
  agent: AgentData;
  targetX: number;
  targetY: number;
  onClick: () => void;
}) {
  const isWorking = agent.status === "working";
  const p = 2.5;
  const skin = "#e8c8a0";
  const color = agent.color;
  const hair = color === "#ffffff" ? "#555" : color;
  const pants = "#334455";

  return (
    <g onClick={onClick} className="cursor-pointer" style={{ transition: "transform 1.5s ease-in-out" }} transform={`translate(${targetX}, ${targetY})`}>
      {/* Shadow */}
      <ellipse cx="0" cy={4 * p} rx={3 * p} ry={p} fill="rgba(0,0,0,0.12)" />

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

      {/* Typing hands when working */}
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

      {/* Status dot */}
      <circle cx={4 * p} cy={-8 * p} r={p} fill={STATUS_COLOR[agent.status]}>
        {isWorking && <animate attributeName="opacity" values="1;0.3;1" dur="1s" repeatCount="indefinite" />}
      </circle>

      {/* Name label */}
      <text x="0" y={6 * p} textAnchor="middle" fill="#665544" fontSize="6" fontWeight="bold" fontFamily="monospace">{agent.name}</text>

      {/* Chat bubble */}
      {isWorking && (
        <g>
          <rect x={5 * p} y={-10 * p} width="32" height="10" rx="3" fill="white" stroke="#ddd" strokeWidth="0.5" />
          <text x={5 * p + 16} y={-10 * p + 7} textAnchor="middle" fontSize="4" fill="#b08800" fontFamily="monospace">working...</text>
        </g>
      )}
    </g>
  );
}

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
    setSimLog(["Briefing starting... agents heading to meeting room."]);
    setMeetingActive(true);

    const agentsCopy = agents.map((a) => ({ ...a, status: "idle" as string }));
    setSimAgents(agentsCopy);

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

    setSimLog((prev) => [...prev, "Briefing complete. Returning to desks."]);
    setMeetingActive(false);
    setSimulating(false);
  }, [agents]);

  // Build positions
  const agentPositions: { agent: AgentData; x: number; y: number }[] = [];
  for (const zone of ZONE_ORDER) {
    const zoneAgents = displayAgents.filter((a) => a.zone === zone);
    const positions = DESK_POSITIONS[zone] || [];
    zoneAgents.forEach((agent, i) => {
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

      {/* Isometric office: pure SVG, no CSS 3D */}
      <div className="flex gap-4">
        <div className="flex-1 overflow-x-auto">
          <div className="mx-auto" style={{ maxWidth: 800 }}>
              <svg
                viewBox="0 0 800 500"
                className="w-full"
                style={{ minWidth: 500, background: "#0a0a18", borderRadius: 12 }}
              >
                {/* Isometric floor (diamond shape) */}
                <g transform="translate(400, 60)">
                  {/* Floor surface */}
                  <polygon
                    points="0,0 350,175 0,350 -350,175"
                    fill="#ddd2c2"
                    stroke="#c4b8a8"
                    strokeWidth="2"
                  />
                  {/* Checkerboard pattern */}
                  <defs>
                    <pattern id="isoTile" width="50" height="50" patternUnits="userSpaceOnUse" patternTransform="skewY(26.57) scale(1, 0.5)">
                      <rect width="25" height="25" fill="#ddd2c2" />
                      <rect x="25" width="25" height="25" fill="#d6cab8" />
                      <rect y="25" width="25" height="25" fill="#d6cab8" />
                      <rect x="25" y="25" width="25" height="25" fill="#ddd2c2" />
                    </pattern>
                  </defs>
                  <polygon
                    points="0,0 350,175 0,350 -350,175"
                    fill="url(#isoTile)"
                    opacity="0.3"
                  />
                  {/* Left wall */}
                  <polygon
                    points="-350,175 0,350 0,365 -350,190"
                    fill="#b0a090"
                  />
                  {/* Right wall */}
                  <polygon
                    points="0,350 350,175 350,190 0,365"
                    fill="#a09080"
                  />
                </g>

                {/* Content on the isometric floor */}
                {/* iso() maps grid x,y (0-100) to diamond coords */}
                <g transform="translate(400, 60)">

                  {/* Zone dividers (isometric lines) */}
                  <line x1="0" y1="0" x2="0" y2="350" stroke="#b8a890" strokeWidth="0.5" opacity="0.3" strokeDasharray="4,3" />
                  <line x1="-350" y1="175" x2="350" y2="175" stroke="#b8a890" strokeWidth="0.5" opacity="0.3" strokeDasharray="4,3" />

                  {/* Zone labels */}
                  <text x="-180" y="70" textAnchor="middle" fill="#777" opacity="0.6" fontSize="8" fontFamily="monospace" fontWeight="bold" letterSpacing="2">EXECUTIVE</text>
                  <text x="0" y="50" textAnchor="middle" fill="#b08800" opacity="0.6" fontSize="8" fontFamily="monospace" fontWeight="bold" letterSpacing="2">OPERATIONS</text>
                  <text x="180" y="70" textAnchor="middle" fill="#008844" opacity="0.6" fontSize="8" fontFamily="monospace" fontWeight="bold" letterSpacing="2">FINANCE</text>
                  <text x="-180" y="210" textAnchor="middle" fill="#cc4422" opacity="0.6" fontSize="8" fontFamily="monospace" fontWeight="bold" letterSpacing="2">MARKETING</text>
                  <text x="0" y="200" textAnchor="middle" fill="#2266cc" opacity="0.6" fontSize="8" fontFamily="monospace" fontWeight="bold" letterSpacing="2">ENGINEERING</text>
                  <text x="180" y="210" textAnchor="middle" fill="#7733aa" opacity="0.6" fontSize="8" fontFamily="monospace" fontWeight="bold" letterSpacing="2">SECURITY</text>

                  {/* Meeting table (center) */}
                  <ellipse cx="0" cy="175" rx="22" ry="12" fill="#c4a882" stroke="#d4b892" strokeWidth="1" />

                  {/* Plants */}
                  {[[-280, 100], [280, 100], [-280, 250], [280, 250], [-100, 330], [100, 330]].map(([px, py], i) => (
                    <g key={`p${i}`} transform={`translate(${px},${py})`}>
                      <rect x="-2" y="1" width="4" height="4" fill="#8a7050" />
                      <circle cx="0" cy="-2" r="5" fill="#2a6a3a" opacity="0.8" />
                      <circle cx="-2" cy="-5" r="3" fill="#3a8a4a" opacity="0.6" />
                    </g>
                  ))}

                  {/* Desks + Agents positioned on the diamond */}
                  {agentPositions.map(({ agent, x: gx, y: gy }, idx) => {
                    // Map grid coords to isometric diamond
                    // gx: 0-600 -> -300 to 300, gy: 0-440 -> 0 to 350
                    const ix = (gx - 300) * 0.95;
                    const iy = (gy / 440) * 350;

                    // Deterministic spread around meeting table (no Math.random)
                    const angle = (idx / agentPositions.length) * 2 * Math.PI;
                    const tx = meetingActive ? Math.cos(angle) * 35 : ix;
                    const ty = meetingActive ? 175 + Math.sin(angle) * 20 : iy;

                    return (
                      <g key={agent.id}>
                        {/* Desk */}
                        {!meetingActive && (
                          <g transform={`translate(${ix}, ${iy})`}>
                            <rect x="-14" y="-2" width="28" height="10" rx="1" fill="#c4a882" stroke="#d4b892" strokeWidth="0.5" />
                            <rect x="-6" y="-12" width="12" height="9" rx="1" fill="#1a1a22" stroke="#333" strokeWidth="0.5" />
                            <rect x="-4" y="-10" width="8" height="5" fill={SCREEN_BG[agent.status]} />
                          </g>
                        )}
                        {/* Agent */}
                        <PixelAgent
                          agent={agent}
                          targetX={tx}
                          targetY={ty - 8}
                          onClick={() => setSelectedAgent(agent)}
                        />
                      </g>
                    );
                  })}
                </g>

                {/* Title */}
                <text x="400" y="485" textAnchor="middle" fill="#ffffff" opacity="0.08" fontSize="7" fontFamily="monospace" letterSpacing="4">FLOWSTATE HEADQUARTERS</text>
              </svg>
          </div>
        </div>

        {/* Sim log */}
        {simLog.length > 0 && (
          <div className="hidden w-52 flex-shrink-0 overflow-y-auto rounded-lg border border-border bg-surface p-3 lg:block" style={{ maxHeight: 450 }}>
            <h3 className="mb-2 font-mono text-xs font-bold text-text-primary">Sim Log</h3>
            {simLog.map((line, i) => (
              <p key={i} className="text-[0.65rem] leading-relaxed text-text-secondary">{line}</p>
            ))}
          </div>
        )}
      </div>

      {/* Bottom agent bar */}
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
