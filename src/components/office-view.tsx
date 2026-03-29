"use client";

import { useState } from "react";
import type { AgentData } from "./agent-card";
import { AgentOutputDrawer } from "./agent-output-drawer";

const ZONE_META: Record<string, { label: string; bg: string; border: string }> = {
  core: { label: "COMMAND", bg: "bg-white/5", border: "border-white/10" },
  yelp: { label: "YELP OPS", bg: "bg-amber/5", border: "border-amber/10" },
  flowstate: { label: "FLOWSTATE LAB", bg: "bg-[#aa66ff]/5", border: "border-[#aa66ff]/10" },
  personal: { label: "PERSONAL STACK", bg: "bg-[#00d4ff]/5", border: "border-[#00d4ff]/10" },
};

const STATUS_COLORS: Record<string, string> = {
  idle: "bg-muted",
  working: "bg-amber",
  done: "bg-green",
  error: "bg-red",
};

function AgentDesk({
  agent,
  onClick,
}: {
  agent: AgentData;
  onClick: () => void;
}) {
  const isWorking = agent.status === "working";

  return (
    <button
      onClick={onClick}
      className="group relative flex flex-col items-center gap-1 transition-transform hover:scale-105"
    >
      {/* Monitor */}
      <div className="relative">
        <div
          className={`h-10 w-14 rounded-sm border-2 ${
            isWorking ? "border-amber/60" : "border-border"
          } bg-surface flex items-center justify-center`}
        >
          {/* Screen content */}
          {isWorking ? (
            <div className="flex gap-0.5">
              <span className="h-1 w-1 animate-bounce rounded-full bg-amber" style={{ animationDelay: "0ms" }} />
              <span className="h-1 w-1 animate-bounce rounded-full bg-amber" style={{ animationDelay: "150ms" }} />
              <span className="h-1 w-1 animate-bounce rounded-full bg-amber" style={{ animationDelay: "300ms" }} />
            </div>
          ) : agent.status === "done" ? (
            <div className="flex flex-col gap-0.5 px-1">
              <div className="h-0.5 w-full rounded bg-green/40" />
              <div className="h-0.5 w-3/4 rounded bg-green/30" />
              <div className="h-0.5 w-full rounded bg-green/20" />
            </div>
          ) : (
            <div className="flex flex-col gap-0.5 px-1">
              <div className="h-0.5 w-full rounded bg-muted/30" />
              <div className="h-0.5 w-2/3 rounded bg-muted/20" />
            </div>
          )}
        </div>
        {/* Monitor stand */}
        <div className="mx-auto h-1.5 w-3 bg-border" />
        <div className="mx-auto h-0.5 w-6 rounded-sm bg-border" />
      </div>

      {/* Desk surface */}
      <div
        className="relative -mt-0.5 flex h-8 w-20 items-center justify-center rounded-sm border"
        style={{
          backgroundColor: `${agent.color}08`,
          borderColor: `${agent.color}30`,
        }}
      >
        {/* Agent (pixel person) */}
        <div className="relative">
          <span className={`text-lg ${isWorking ? "animate-pulse-glow" : ""}`}>
            {agent.emoji}
          </span>
          {/* Status dot */}
          <span
            className={`absolute -right-1 -top-1 h-2 w-2 rounded-full ${STATUS_COLORS[agent.status] ?? STATUS_COLORS.idle} ${
              isWorking ? "animate-pulse" : ""
            } ring-1 ring-base`}
          />
        </div>
      </div>

      {/* Name plate */}
      <span className="font-mono text-[0.55rem] font-bold text-text-secondary group-hover:text-text-primary transition-colors">
        {agent.name}
      </span>

      {/* Activity bubble */}
      {isWorking && (
        <div className="absolute -right-2 -top-2 rounded-full border border-amber/30 bg-surface px-1.5 py-0.5">
          <span className="text-[0.5rem] text-amber">typing...</span>
        </div>
      )}
    </button>
  );
}

function ZoneFloor({
  zone,
  agents,
  onSelectAgent,
}: {
  zone: string;
  agents: AgentData[];
  onSelectAgent: (agent: AgentData) => void;
}) {
  const meta = ZONE_META[zone] ?? ZONE_META.core;

  return (
    <div className={`rounded-xl border ${meta.border} ${meta.bg} p-4`}>
      {/* Zone label */}
      <div className="mb-4 flex items-center gap-2">
        <div
          className="h-px flex-1"
          style={{ background: `linear-gradient(to right, transparent, ${zone === "yelp" ? "#ffcc00" : zone === "flowstate" ? "#aa66ff" : zone === "personal" ? "#00d4ff" : "#ffffff"}20, transparent)` }}
        />
        <span className="font-pixel text-[0.45rem] tracking-[0.2em] text-muted">
          {meta.label}
        </span>
        <div
          className="h-px flex-1"
          style={{ background: `linear-gradient(to right, transparent, ${zone === "yelp" ? "#ffcc00" : zone === "flowstate" ? "#aa66ff" : zone === "personal" ? "#00d4ff" : "#ffffff"}20, transparent)` }}
        />
      </div>

      {/* Desks grid */}
      <div className="flex flex-wrap items-center justify-center gap-6">
        {agents.map((agent) => (
          <AgentDesk
            key={agent.id}
            agent={agent}
            onClick={() => onSelectAgent(agent)}
          />
        ))}
      </div>
    </div>
  );
}

export function OfficeView({ agents }: { agents: AgentData[] }) {
  const [selectedAgent, setSelectedAgent] = useState<AgentData | null>(null);

  const zones = ["core", "yelp", "flowstate", "personal"];
  const agentsByZone = zones.map((zone) => ({
    zone,
    agents: agents.filter((a) => a.zone === zone),
  }));

  // Count active agents
  const workingCount = agents.filter((a) => a.status === "working").length;
  const doneCount = agents.filter((a) => a.status === "done").length;
  const idleCount = agents.filter((a) => a.status === "idle").length;

  return (
    <>
      {/* Office stats bar */}
      <div className="mb-6 flex items-center justify-center gap-6">
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
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {agentsByZone.map(({ zone, agents: zoneAgents }) => (
          <ZoneFloor
            key={zone}
            zone={zone}
            agents={zoneAgents}
            onSelectAgent={setSelectedAgent}
          />
        ))}
      </div>

      <AgentOutputDrawer
        agent={selectedAgent}
        onClose={() => setSelectedAgent(null)}
      />
    </>
  );
}
