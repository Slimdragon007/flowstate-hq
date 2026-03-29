"use client";

import { useState } from "react";
import type { AgentData } from "./agent-card";
import { AgentOutputDrawer } from "./agent-output-drawer";

// Status -> screen glow color
const STATUS_GLOW: Record<string, string> = {
  idle: "rgba(102, 102, 136, 0.15)",
  working: "rgba(255, 204, 0, 0.4)",
  done: "rgba(0, 255, 136, 0.3)",
  error: "rgba(255, 68, 68, 0.4)",
};

const STATUS_SCREEN: Record<string, string> = {
  idle: "#1a1a2e",
  working: "#2a2200",
  done: "#0a2a15",
  error: "#2a0a0a",
};

const STATUS_DOT: Record<string, string> = {
  idle: "#666688",
  working: "#ffcc00",
  done: "#00ff88",
  error: "#ff4444",
};

// Isometric workstation: desk + monitor + chair + agent
function Workstation({
  agent,
  onClick,
  style,
}: {
  agent: AgentData;
  onClick: () => void;
  style?: React.CSSProperties;
}) {
  const isWorking = agent.status === "working";
  const screenColor = STATUS_SCREEN[agent.status] ?? STATUS_SCREEN.idle;
  const glowColor = STATUS_GLOW[agent.status] ?? STATUS_GLOW.idle;
  const dotColor = STATUS_DOT[agent.status] ?? STATUS_DOT.idle;

  return (
    <button
      onClick={onClick}
      className="group absolute cursor-pointer"
      style={style}
      title={`${agent.name} - ${agent.role}`}
    >
      <svg
        width="100"
        height="90"
        viewBox="0 0 100 90"
        className="transition-transform group-hover:scale-110"
      >
        {/* Desk surface (isometric rectangle) */}
        <polygon
          points="50,52 85,37 50,22 15,37"
          fill="#2a2a3e"
          stroke="#3a3a50"
          strokeWidth="1"
        />
        {/* Desk front face */}
        <polygon
          points="15,37 50,52 50,58 15,43"
          fill="#222235"
          stroke="#3a3a50"
          strokeWidth="0.5"
        />
        {/* Desk right face */}
        <polygon
          points="50,52 85,37 85,43 50,58"
          fill="#1e1e30"
          stroke="#3a3a50"
          strokeWidth="0.5"
        />

        {/* Monitor back (isometric) */}
        <polygon
          points="40,32 60,22 60,8 40,18"
          fill="#1a1a2e"
          stroke="#2a2a40"
          strokeWidth="1"
        />
        {/* Monitor screen */}
        <polygon
          points="42,30 58,21 58,10 42,19"
          fill={screenColor}
          className={isWorking ? "animate-screen-flicker" : ""}
          style={{ filter: `drop-shadow(0 0 6px ${glowColor})` }}
        />
        {/* Screen content lines */}
        {agent.status === "done" && (
          <>
            <line x1="44" y1="22" x2="54" y2="17" stroke="#00ff8840" strokeWidth="1" />
            <line x1="44" y1="24" x2="52" y2="20" stroke="#00ff8830" strokeWidth="1" />
            <line x1="44" y1="26" x2="56" y2="21" stroke="#00ff8820" strokeWidth="1" />
          </>
        )}
        {isWorking && (
          <>
            <line x1="44" y1="22" x2="48" y2="20" stroke="#ffcc0060" strokeWidth="1.5" className="animate-pulse" />
            <line x1="50" y1="19" x2="54" y2="17" stroke="#ffcc0040" strokeWidth="1.5" className="animate-pulse" style={{ animationDelay: "0.3s" }} />
          </>
        )}
        {/* Monitor stand */}
        <line x1="50" y1="32" x2="50" y2="36" stroke="#2a2a40" strokeWidth="2" />

        {/* Chair (behind desk) */}
        <ellipse cx="50" cy="62" rx="8" ry="4" fill="#1a1a30" stroke="#2a2a40" strokeWidth="0.5" />
        <polygon
          points="44,62 56,62 54,54 46,54"
          fill="#222240"
          stroke="#2a2a50"
          strokeWidth="0.5"
        />

        {/* Agent (person sitting in chair) */}
        <g className={isWorking ? "animate-iso-typing" : ""}>
          {/* Body */}
          <ellipse cx="50" cy="48" rx="5" ry="3" fill={agent.color} opacity="0.7" />
          {/* Head */}
          <circle cx="50" cy="43" r="4" fill={agent.color} opacity="0.9" />
          {/* Emoji face */}
          <text x="50" y="46" textAnchor="middle" fontSize="7" className="select-none">
            {agent.emoji}
          </text>
        </g>

        {/* Status indicator dot */}
        <circle cx="68" cy="12" r="3" fill={dotColor}>
          {isWorking && (
            <animate attributeName="opacity" values="1;0.3;1" dur="1.5s" repeatCount="indefinite" />
          )}
        </circle>

        {/* Name label */}
        <text
          x="50"
          y="78"
          textAnchor="middle"
          fill="#aaaacc"
          fontSize="7"
          fontFamily="var(--font-space-mono), monospace"
          fontWeight="bold"
          className="select-none group-hover:fill-white transition-colors"
        >
          {agent.name}
        </text>

        {/* Role label */}
        <text
          x="50"
          y="86"
          textAnchor="middle"
          fill="#666688"
          fontSize="5"
          fontFamily="var(--font-inter), sans-serif"
          className="select-none"
        >
          {agent.role}
        </text>
      </svg>

      {/* Activity speech bubble */}
      {isWorking && (
        <div className="absolute -right-4 -top-2 z-10 rounded-lg border border-amber/30 bg-surface/95 px-2 py-1 backdrop-blur-sm">
          <span className="font-mono text-[0.5rem] text-amber">working...</span>
        </div>
      )}
    </button>
  );
}

// Meeting table for the center of the office
function MeetingTable() {
  return (
    <svg width="120" height="80" viewBox="0 0 120 80">
      {/* Table surface */}
      <polygon
        points="60,20 110,45 60,70 10,45"
        fill="#3a2a1a"
        stroke="#4a3a2a"
        strokeWidth="1"
      />
      {/* Table front */}
      <polygon
        points="10,45 60,70 60,75 10,50"
        fill="#2a1a0a"
        stroke="#4a3a2a"
        strokeWidth="0.5"
      />
      {/* Table right */}
      <polygon
        points="60,70 110,45 110,50 60,75"
        fill="#251508"
        stroke="#4a3a2a"
        strokeWidth="0.5"
      />
      {/* Chairs around table */}
      {[
        { cx: 35, cy: 30 },
        { cx: 85, cy: 30 },
        { cx: 25, cy: 50 },
        { cx: 95, cy: 50 },
      ].map((pos, i) => (
        <ellipse
          key={i}
          cx={pos.cx}
          cy={pos.cy}
          rx="6"
          ry="3"
          fill="#1a1a30"
          stroke="#2a2a40"
          strokeWidth="0.5"
        />
      ))}
    </svg>
  );
}

// Decorative elements
function Plant({ x, y }: { x: number; y: number }) {
  return (
    <svg
      width="30"
      height="40"
      viewBox="0 0 30 40"
      className="absolute"
      style={{ left: x, top: y }}
    >
      {/* Pot */}
      <polygon points="10,30 20,30 18,40 12,40" fill="#4a3020" />
      {/* Leaves */}
      <circle cx="15" cy="24" r="8" fill="#1a4a2a" opacity="0.8" />
      <circle cx="12" cy="20" r="5" fill="#2a6a3a" opacity="0.7" />
      <circle cx="18" cy="22" r="6" fill="#1a5a2a" opacity="0.6" />
    </svg>
  );
}

// Zone label with glowing line
function ZoneLabel({
  label,
  color,
  style,
}: {
  label: string;
  color: string;
  style?: React.CSSProperties;
}) {
  return (
    <div className="absolute flex items-center gap-2" style={style}>
      <div className="h-px w-8" style={{ background: `${color}40` }} />
      <span
        className="font-pixel text-[0.4rem] tracking-[0.25em] uppercase"
        style={{ color: `${color}80` }}
      >
        {label}
      </span>
      <div className="h-px w-8" style={{ background: `${color}40` }} />
    </div>
  );
}

// Workstation positions on the floor (x, y coordinates)
const POSITIONS: Record<string, { x: number; y: number }[]> = {
  // Top-left zone: Command (1 agent)
  core: [{ x: 60, y: 30 }],
  // Top-right zone: Yelp Ops (3 agents)
  yelp: [
    { x: 380, y: 20 },
    { x: 500, y: 20 },
    { x: 440, y: 90 },
  ],
  // Bottom-left zone: FlowstateAI Lab (4 agents)
  flowstate: [
    { x: 30, y: 200 },
    { x: 150, y: 200 },
    { x: 30, y: 290 },
    { x: 150, y: 290 },
  ],
  // Bottom-right zone: Personal Stack (4 agents)
  personal: [
    { x: 380, y: 200 },
    { x: 500, y: 200 },
    { x: 380, y: 290 },
    { x: 500, y: 290 },
  ],
};

export function OfficeView({ agents }: { agents: AgentData[] }) {
  const [selectedAgent, setSelectedAgent] = useState<AgentData | null>(null);

  const workingCount = agents.filter((a) => a.status === "working").length;
  const doneCount = agents.filter((a) => a.status === "done").length;
  const idleCount = agents.filter((a) => a.status === "idle").length;

  const agentsByZone: Record<string, AgentData[]> = {
    core: agents.filter((a) => a.zone === "core"),
    yelp: agents.filter((a) => a.zone === "yelp"),
    flowstate: agents.filter((a) => a.zone === "flowstate"),
    personal: agents.filter((a) => a.zone === "personal"),
  };

  return (
    <>
      {/* Stats bar */}
      <div className="mb-4 flex items-center justify-center gap-6">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-green" />
          <span className="text-xs text-muted">{doneCount} done</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-amber animate-pulse" />
          <span className="text-xs text-muted">{workingCount} working</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-muted" />
          <span className="text-xs text-muted">{idleCount} idle</span>
        </div>
      </div>

      {/* Office floor */}
      <div className="mx-auto overflow-x-auto">
        <div className="relative mx-auto" style={{ width: 640, height: 420 }}>
          {/* Floor base */}
          <div
            className="absolute inset-0 rounded-2xl border border-border/50"
            style={{
              background: "linear-gradient(135deg, #12121f 0%, #0e0e1a 50%, #101020 100%)",
              boxShadow: "inset 0 0 60px rgba(0, 0, 0, 0.5), 0 0 40px rgba(0, 0, 0, 0.3)",
            }}
          >
            {/* Floor grid overlay */}
            <div
              className="absolute inset-0 rounded-2xl opacity-[0.03]"
              style={{
                backgroundImage:
                  "linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)",
                backgroundSize: "40px 40px",
              }}
            />
          </div>

          {/* Zone labels */}
          <ZoneLabel label="Command" color="#ffffff" style={{ left: 40, top: 12 }} />
          <ZoneLabel label="Yelp Ops" color="#ffcc00" style={{ right: 40, top: 12 }} />
          <ZoneLabel label="FlowstateAI Lab" color="#aa66ff" style={{ left: 40, top: 185 }} />
          <ZoneLabel label="Personal Stack" color="#00d4ff" style={{ right: 40, top: 185 }} />

          {/* Zone divider lines */}
          <div
            className="absolute left-1/2 top-4 h-[calc(100%-32px)] w-px"
            style={{ background: "linear-gradient(to bottom, transparent, #1a1a3e, transparent)" }}
          />
          <div
            className="absolute left-4 top-[46%] h-px w-[calc(100%-32px)]"
            style={{ background: "linear-gradient(to right, transparent, #1a1a3e, transparent)" }}
          />

          {/* Meeting table in center */}
          <div className="absolute" style={{ left: 260, top: 160 }}>
            <MeetingTable />
          </div>

          {/* Decorative plants */}
          <Plant x={190} y={80} />
          <Plant x={420} y={160} />
          <Plant x={180} y={350} />
          <Plant x={430} y={350} />

          {/* Agent workstations */}
          {Object.entries(agentsByZone).map(([zone, zoneAgents]) =>
            zoneAgents.map((agent, i) => {
              const positions = POSITIONS[zone];
              const pos = positions?.[i];
              if (!pos) return null;
              return (
                <Workstation
                  key={agent.id}
                  agent={agent}
                  onClick={() => setSelectedAgent(agent)}
                  style={{ left: pos.x, top: pos.y }}
                />
              );
            })
          )}

          {/* "FLOWSTATE HQ" watermark */}
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2">
            <span className="font-pixel text-[0.35rem] tracking-[0.3em] text-muted/30 uppercase">
              FlowstateAI Headquarters
            </span>
          </div>
        </div>
      </div>

      {/* Bottom agent status bar */}
      <div className="mt-4 flex items-center justify-center gap-1 overflow-x-auto rounded-lg border border-border bg-surface p-2">
        {agents.map((agent) => (
          <button
            key={agent.id}
            onClick={() => setSelectedAgent(agent)}
            className="flex items-center gap-1.5 rounded-md px-2 py-1 text-xs hover:bg-elevated transition-colors"
            title={`${agent.name}: ${agent.status}`}
          >
            <span
              className={`h-1.5 w-1.5 rounded-full ${
                agent.status === "working" ? "animate-pulse" : ""
              }`}
              style={{ backgroundColor: STATUS_DOT[agent.status] }}
            />
            <span className="text-text-secondary">{agent.emoji}</span>
            <span className="hidden font-mono text-[0.6rem] text-muted sm:inline">
              {agent.name}
            </span>
          </button>
        ))}
      </div>

      <AgentOutputDrawer
        agent={selectedAgent}
        onClose={() => setSelectedAgent(null)}
      />
    </>
  );
}
