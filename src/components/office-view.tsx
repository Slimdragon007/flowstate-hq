"use client";

import { useState } from "react";
import type { AgentData } from "./agent-card";
import { AgentOutputDrawer } from "./agent-output-drawer";

const STATUS_DOT: Record<string, string> = {
  idle: "#666688",
  working: "#ffcc00",
  done: "#00ff88",
  error: "#ff4444",
};

const SCREEN_BG: Record<string, string> = {
  idle: "#1a2030",
  working: "#2a2800",
  done: "#0a2815",
  error: "#2a1010",
};

const SCREEN_GLOW: Record<string, string> = {
  idle: "0 0 4px rgba(100,120,180,0.2)",
  working: "0 0 12px rgba(255,204,0,0.5)",
  done: "0 0 8px rgba(0,255,136,0.4)",
  error: "0 0 8px rgba(255,68,68,0.5)",
};

// Isometric desk with monitor, keyboard, chair, and agent
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
    <g
      onClick={onClick}
      className="cursor-pointer"
      style={{ transform: flip ? "scale(-1,1)" : undefined }}
    >
      {/* Shadow under desk */}
      <ellipse cx="0" cy="10" rx="28" ry="8" fill="rgba(0,0,0,0.15)" />

      {/* Desk legs */}
      <rect x="-22" y="-2" width="2" height="12" fill="#5a4a3a" rx="0.5" />
      <rect x="20" y="-2" width="2" height="12" fill="#5a4a3a" rx="0.5" />
      <rect x="-22" y="4" width="2" height="8" fill="#4a3a2a" rx="0.5" />
      <rect x="20" y="4" width="2" height="8" fill="#4a3a2a" rx="0.5" />

      {/* Desk top surface */}
      <path
        d="M-24,-4 L24,-4 L28,0 L-20,0 Z"
        fill="#8b7355"
        stroke="#9a8265"
        strokeWidth="0.5"
      />
      {/* Desk front */}
      <path d="M-20,0 L28,0 L28,3 L-20,3 Z" fill="#7a6245" />

      {/* Monitor */}
      <g>
        {/* Monitor back/frame */}
        <rect
          x="-10"
          y="-22"
          width="20"
          height="16"
          rx="1.5"
          fill="#2a2a35"
          stroke="#3a3a45"
          strokeWidth="0.5"
        />
        {/* Screen */}
        <rect
          x="-8"
          y="-20"
          width="16"
          height="12"
          rx="0.5"
          fill={SCREEN_BG[agent.status]}
          style={{ boxShadow: SCREEN_GLOW[agent.status] }}
        >
          {isWorking && (
            <animate attributeName="opacity" values="0.85;1;0.85" dur="2s" repeatCount="indefinite" />
          )}
        </rect>
        {/* Screen glow filter */}
        <rect
          x="-8"
          y="-20"
          width="16"
          height="12"
          rx="0.5"
          fill="none"
          stroke={STATUS_DOT[agent.status]}
          strokeWidth="0.3"
          opacity="0.5"
        />
        {/* Screen content */}
        {agent.status === "done" && (
          <g opacity="0.5">
            <rect x="-6" y="-18" width="8" height="1" rx="0.5" fill="#00ff88" opacity="0.4" />
            <rect x="-6" y="-16" width="11" height="1" rx="0.5" fill="#00ff88" opacity="0.3" />
            <rect x="-6" y="-14" width="6" height="1" rx="0.5" fill="#00ff88" opacity="0.2" />
            <rect x="-6" y="-12" width="9" height="1" rx="0.5" fill="#00ff88" opacity="0.15" />
          </g>
        )}
        {isWorking && (
          <g>
            <rect x="-6" y="-17" width="4" height="1" rx="0.5" fill="#ffcc00" opacity="0.6">
              <animate attributeName="width" values="4;8;4" dur="1.5s" repeatCount="indefinite" />
            </rect>
            <rect x="-6" y="-15" width="7" height="1" rx="0.5" fill="#ffcc00" opacity="0.3">
              <animate attributeName="width" values="7;3;7" dur="2s" repeatCount="indefinite" />
            </rect>
          </g>
        )}
        {/* Monitor stand */}
        <rect x="-2" y="-6" width="4" height="3" fill="#2a2a35" />
        <rect x="-6" y="-4" width="12" height="1.5" rx="0.5" fill="#333340" />
      </g>

      {/* Keyboard */}
      <rect x="-8" y="-2" width="12" height="2" rx="0.5" fill="#333340" stroke="#444450" strokeWidth="0.3" />

      {/* Chair */}
      <g transform="translate(0, 14)">
        {/* Chair base */}
        <ellipse cx="0" cy="2" rx="6" ry="2" fill="#333340" />
        {/* Chair seat */}
        <rect x="-6" y="-3" width="12" height="5" rx="2" fill="#444458" stroke="#555568" strokeWidth="0.3" />
        {/* Chair back */}
        <rect x="-5" y="-10" width="10" height="8" rx="2" fill="#3a3a50" stroke="#4a4a60" strokeWidth="0.3" />
      </g>

      {/* Pixel art agent (sitting in chair) */}
      <g transform="translate(0, 2)">
        {/*
          Pixel person: each "pixel" is a 2x2 rect
          Grid centered at 0,0 - person is ~10px wide, ~18px tall
          p = pixel size
        */}
        {(() => {
          const p = 2; // pixel size
          const skin = "#e8c8a0";
          const shirt = agent.color;
          const hair = agent.color === "#ffffff" ? "#555566" : agent.color;
          const pants = "#334";
          const shoe = "#222";

          // Hair row 1 (top of head)
          const pixels: { x: number; y: number; c: string }[] = [
            // Hair top
            { x: -2, y: -16, c: hair }, { x: -1, y: -16, c: hair }, { x: 0, y: -16, c: hair }, { x: 1, y: -16, c: hair },
            // Hair sides + forehead
            { x: -3, y: -15, c: hair }, { x: -2, y: -15, c: hair }, { x: -1, y: -15, c: skin }, { x: 0, y: -15, c: skin }, { x: 1, y: -15, c: hair }, { x: 2, y: -15, c: hair },
            // Face row 1 (eyes)
            { x: -2, y: -14, c: skin }, { x: -1, y: -14, c: "#333" }, { x: 0, y: -14, c: skin }, { x: 1, y: -14, c: "#333" },
            // Face row 2 (mouth)
            { x: -2, y: -13, c: skin }, { x: -1, y: -13, c: skin }, { x: 0, y: -13, c: "#c88" }, { x: 1, y: -13, c: skin },
            // Neck
            { x: -1, y: -12, c: skin }, { x: 0, y: -12, c: skin },
            // Shoulders + shirt
            { x: -3, y: -11, c: shirt }, { x: -2, y: -11, c: shirt }, { x: -1, y: -11, c: shirt }, { x: 0, y: -11, c: shirt }, { x: 1, y: -11, c: shirt }, { x: 2, y: -11, c: shirt },
            // Arms + torso
            { x: -4, y: -10, c: skin }, { x: -3, y: -10, c: shirt }, { x: -2, y: -10, c: shirt }, { x: -1, y: -10, c: shirt }, { x: 0, y: -10, c: shirt }, { x: 1, y: -10, c: shirt }, { x: 2, y: -10, c: shirt }, { x: 3, y: -10, c: skin },
            // Lower torso
            { x: -3, y: -9, c: shirt }, { x: -2, y: -9, c: shirt }, { x: -1, y: -9, c: shirt }, { x: 0, y: -9, c: shirt }, { x: 1, y: -9, c: shirt }, { x: 2, y: -9, c: shirt },
            // Hands reaching to keyboard
            { x: -5, y: -8, c: skin }, { x: -4, y: -8, c: skin },
            { x: 3, y: -8, c: skin }, { x: 4, y: -8, c: skin },
            // Belt / waist
            { x: -2, y: -8, c: "#444" }, { x: -1, y: -8, c: "#444" }, { x: 0, y: -8, c: "#444" }, { x: 1, y: -8, c: "#444" },
            // Legs (sitting)
            { x: -3, y: -7, c: pants }, { x: -2, y: -7, c: pants }, { x: -1, y: -7, c: pants }, { x: 0, y: -7, c: pants }, { x: 1, y: -7, c: pants }, { x: 2, y: -7, c: pants },
            { x: -3, y: -6, c: pants }, { x: -2, y: -6, c: pants }, { x: 1, y: -6, c: pants }, { x: 2, y: -6, c: pants },
            // Shoes
            { x: -4, y: -5, c: shoe }, { x: -3, y: -5, c: shoe }, { x: 2, y: -5, c: shoe }, { x: 3, y: -5, c: shoe },
          ];

          return (
            <>
              {pixels.map((px, i) => (
                <rect
                  key={i}
                  x={px.x * p}
                  y={px.y * p + 24}
                  width={p}
                  height={p}
                  fill={px.c}
                  className="select-none"
                />
              ))}
              {/* Typing animation: hands bob up and down */}
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
            </>
          );
        })()}
      </g>

      {/* Status dot */}
      <circle cx="14" cy="-22" r="2.5" fill={STATUS_DOT[agent.status]}>
        {isWorking && (
          <animate attributeName="opacity" values="1;0.3;1" dur="1s" repeatCount="indefinite" />
        )}
      </circle>

      {/* Name label */}
      <text
        x="0"
        y="32"
        textAnchor="middle"
        fill="#ccccdd"
        fontSize="5.5"
        fontWeight="bold"
        fontFamily="var(--font-space-mono), monospace"
        className="select-none"
        style={{ transform: flip ? "scale(-1,1)" : undefined, transformOrigin: "0 32px" }}
      >
        {agent.name}
      </text>
    </g>
  );
}

// Meeting room round table
function MeetingRoom() {
  return (
    <g>
      {/* Shadow */}
      <ellipse cx="0" cy="8" rx="30" ry="10" fill="rgba(0,0,0,0.1)" />
      {/* Table */}
      <ellipse cx="0" cy="0" rx="20" ry="8" fill="#6b5540" stroke="#7a6450" strokeWidth="0.5" />
      <ellipse cx="0" cy="-2" rx="20" ry="8" fill="#8b7355" stroke="#9a8265" strokeWidth="0.5" />
      {/* Chairs */}
      {[-25, 25].map((x) =>
        [-6, 6].map((y, i) => (
          <ellipse key={`${x}-${i}`} cx={x} cy={y} rx="5" ry="3" fill="#444458" stroke="#555568" strokeWidth="0.3" />
        ))
      )}
      {/* Items on table */}
      <rect x="-5" y="-4" width="4" height="3" rx="0.5" fill="#2a2a35" opacity="0.6" /> {/* laptop */}
      <circle cx="8" cy="-1" r="2" fill="#3a2a1a" opacity="0.4" /> {/* coffee */}
    </g>
  );
}

// Couch/lounge area
function Couch() {
  return (
    <g>
      <ellipse cx="0" cy="6" rx="22" ry="5" fill="rgba(0,0,0,0.08)" />
      {/* Couch base */}
      <rect x="-18" y="-4" width="36" height="10" rx="3" fill="#3a3555" stroke="#4a4565" strokeWidth="0.5" />
      {/* Couch back */}
      <rect x="-18" y="-10" width="36" height="8" rx="3" fill="#4a4570" stroke="#5a5580" strokeWidth="0.5" />
      {/* Cushions */}
      <rect x="-15" y="-3" width="12" height="8" rx="2" fill="#4a4570" opacity="0.5" />
      <rect x="3" y="-3" width="12" height="8" rx="2" fill="#4a4570" opacity="0.5" />
      {/* Coffee table */}
      <rect x="-8" y="12" width="16" height="6" rx="1" fill="#6b5540" stroke="#7a6450" strokeWidth="0.3" />
    </g>
  );
}

// Plant decoration
function PlantPot() {
  return (
    <g>
      <rect x="-3" y="2" width="6" height="6" rx="1" fill="#6b5540" />
      <circle cx="0" cy="-2" r="6" fill="#2a5a3a" opacity="0.8" />
      <circle cx="-3" cy="-5" r="4" fill="#3a7a4a" opacity="0.6" />
      <circle cx="3" cy="-4" r="4.5" fill="#2a6a3a" opacity="0.7" />
    </g>
  );
}

// Water cooler
function WaterCooler() {
  return (
    <g>
      <rect x="-4" y="-2" width="8" height="14" rx="1" fill="#aabbcc" stroke="#99aabb" strokeWidth="0.5" />
      <rect x="-3" y="-8" width="6" height="7" rx="1" fill="#88ccff" opacity="0.4" />
      <rect x="-3" y="-9" width="6" height="2" rx="0.5" fill="#8899aa" />
    </g>
  );
}

// Zone positions: { agentPositions, features }
const OFFICE_LAYOUT = {
  // Total SVG viewBox: 800 x 500
  zones: {
    core: {
      area: { x: 40, y: 40, w: 340, h: 180 },
      label: { text: "COMMAND", x: 210, y: 58, color: "#ffffff" },
      agents: [{ x: 160, y: 130 }],
    },
    yelp: {
      area: { x: 420, y: 40, w: 340, h: 180 },
      label: { text: "YELP OPS", x: 590, y: 58, color: "#ffcc00" },
      agents: [
        { x: 490, y: 110, flip: false },
        { x: 590, y: 110, flip: true },
        { x: 690, y: 110, flip: false },
      ],
    },
    flowstate: {
      area: { x: 40, y: 260, w: 340, h: 200 },
      label: { text: "FLOWSTATE LAB", x: 210, y: 278, color: "#aa66ff" },
      agents: [
        { x: 100, y: 330, flip: false },
        { x: 200, y: 330, flip: true },
        { x: 100, y: 410, flip: false },
        { x: 200, y: 410, flip: true },
      ],
    },
    personal: {
      area: { x: 420, y: 260, w: 340, h: 200 },
      label: { text: "PERSONAL STACK", x: 590, y: 278, color: "#00d4ff" },
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
      { x: 60, y: 140 },
      { x: 310, y: 140 },
      { x: 740, y: 140 },
      { x: 60, y: 420 },
      { x: 310, y: 420 },
      { x: 740, y: 420 },
    ],
    waterCooler: { x: 380, y: 300 },
  },
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

      {/* Office SVG */}
      <div className="mx-auto overflow-x-auto rounded-2xl border border-border" style={{ background: "#0c0c18" }}>
        <svg
          viewBox="0 0 800 500"
          className="w-full"
          style={{ minWidth: 600, maxWidth: 900 }}
        >
          <defs>
            {/* Floor tile pattern */}
            <pattern id="floorTile" width="40" height="40" patternUnits="userSpaceOnUse">
              <rect width="40" height="40" fill="#1a1828" />
              <rect x="0" y="0" width="20" height="20" fill="#1c1a2c" />
              <rect x="20" y="20" width="20" height="20" fill="#1c1a2c" />
            </pattern>
            {/* Warm spotlight gradient */}
            <radialGradient id="warmGlow" cx="50%" cy="40%" r="60%">
              <stop offset="0%" stopColor="rgba(255,200,100,0.04)" />
              <stop offset="100%" stopColor="rgba(0,0,0,0)" />
            </radialGradient>
          </defs>

          {/* Main floor */}
          <rect x="20" y="20" width="760" height="460" rx="12" fill="url(#floorTile)" />
          <rect x="20" y="20" width="760" height="460" rx="12" fill="url(#warmGlow)" />

          {/* Floor border/walls */}
          <rect
            x="20"
            y="20"
            width="760"
            height="460"
            rx="12"
            fill="none"
            stroke="#2a2840"
            strokeWidth="2"
          />

          {/* Zone dividers */}
          <line x1="400" y1="40" x2="400" y2="460" stroke="#2a2840" strokeWidth="1" strokeDasharray="4,4" />
          <line x1="40" y1="240" x2="760" y2="240" stroke="#2a2840" strokeWidth="1" strokeDasharray="4,4" />

          {/* Zone backgrounds */}
          {Object.entries(OFFICE_LAYOUT.zones).map(([zone, config]) => (
            <g key={zone}>
              <rect
                x={config.area.x}
                y={config.area.y}
                width={config.area.w}
                height={config.area.h}
                rx="6"
                fill={`${config.label.color}03`}
              />
              {/* Zone label */}
              <text
                x={config.label.x}
                y={config.label.y}
                textAnchor="middle"
                fill={`${config.label.color}40`}
                fontSize="8"
                fontFamily="var(--font-press-start), monospace"
                letterSpacing="3"
                className="select-none"
              >
                {config.label.text}
              </text>
            </g>
          ))}

          {/* Meeting room */}
          <g transform={`translate(${OFFICE_LAYOUT.features.meetingRoom.x}, ${OFFICE_LAYOUT.features.meetingRoom.y})`}>
            <MeetingRoom />
          </g>

          {/* Couch area */}
          <g transform={`translate(${OFFICE_LAYOUT.features.couch.x}, ${OFFICE_LAYOUT.features.couch.y})`}>
            <Couch />
          </g>

          {/* Water cooler */}
          <g transform={`translate(${OFFICE_LAYOUT.features.waterCooler.x}, ${OFFICE_LAYOUT.features.waterCooler.y})`}>
            <WaterCooler />
          </g>

          {/* Plants */}
          {OFFICE_LAYOUT.features.plants.map((p, i) => (
            <g key={i} transform={`translate(${p.x}, ${p.y})`}>
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
                  <IsoDesk
                    agent={agent}
                    flip={"flip" in pos ? pos.flip : false}
                    onClick={() => setSelectedAgent(agent)}
                  />
                </g>
              );
            })
          )}

          {/* "HQ" watermark */}
          <text
            x="400"
            y="490"
            textAnchor="middle"
            fill="#ffffff08"
            fontSize="6"
            fontFamily="var(--font-press-start), monospace"
            letterSpacing="4"
            className="select-none"
          >
            FLOWSTATE HEADQUARTERS
          </text>
        </svg>
      </div>

      {/* Bottom agent bar */}
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
