"use client";

import { useState, useEffect, useCallback } from "react";

interface AgentMessage {
  id: string;
  channel: string;
  message: string;
  created_at: string;
  from_agent: { name: string; emoji: string; color: string } | null;
  to_agent: { name: string; emoji: string } | null;
}

const CHANNEL_CONFIG: Record<string, { color: string; bg: string; label: string }> = {
  general: { color: "text-text-secondary", bg: "bg-surface", label: "GENERAL" },
  status_update: { color: "text-green", bg: "bg-green/5", label: "STATUS" },
  handoff: { color: "text-[#aa66ff]", bg: "bg-[#aa66ff]/5", label: "HANDOFF" },
  alert: { color: "text-red", bg: "bg-red/5", label: "ALERT" },
  request: { color: "text-amber", bg: "bg-amber/5", label: "REQUEST" },
};

const ALL_CHANNELS = ["all", "status_update", "handoff", "alert", "request", "general"];

function timeAgo(dateStr: string): string {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

function MessageRow({ msg }: { msg: AgentMessage }) {
  const config = CHANNEL_CONFIG[msg.channel] ?? CHANNEL_CONFIG.general;

  return (
    <div className={`border-b border-border/50 p-4 ${config.bg}`}>
      <div className="flex items-start gap-3">
        {/* Agent avatar */}
        <div
          className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border border-border"
          style={{ borderColor: msg.from_agent?.color ?? "#1a1a3e" }}
        >
          <span className="text-sm">{msg.from_agent?.emoji ?? "⚙️"}</span>
        </div>

        <div className="min-w-0 flex-1">
          {/* Header: agent name + channel badge + time */}
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-bold text-text-primary">
              {msg.from_agent?.name ?? "System"}
            </span>
            {msg.to_agent && (
              <>
                <span className="text-[0.6rem] text-muted">-&gt;</span>
                <span className="font-mono text-xs text-text-secondary">
                  {msg.to_agent.emoji} {msg.to_agent.name}
                </span>
              </>
            )}
            <span
              className={`rounded-full border border-border px-1.5 py-0 text-[0.55rem] font-bold uppercase tracking-wider ${config.color}`}
            >
              {config.label}
            </span>
            <span className="ml-auto text-[0.6rem] text-muted">
              {timeAgo(msg.created_at)}
            </span>
          </div>

          {/* Message body */}
          <p className="mt-1 text-sm leading-relaxed text-text-secondary">
            {msg.message}
          </p>
        </div>
      </div>
    </div>
  );
}

export function CommsView({
  initialMessages,
}: {
  initialMessages: AgentMessage[];
}) {
  const [messages, setMessages] = useState(initialMessages);
  const [activeChannel, setActiveChannel] = useState("all");

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/comms");
      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages);
      }
    } catch {
      // Silent poll failure
    }
  }, []);

  useEffect(() => {
    const interval = setInterval(refresh, 10000);
    return () => clearInterval(interval);
  }, [refresh]);

  const filtered =
    activeChannel === "all"
      ? messages
      : messages.filter((m) => m.channel === activeChannel);

  return (
    <div>
      {/* Channel filter tabs */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        {ALL_CHANNELS.map((ch) => {
          const config = CHANNEL_CONFIG[ch];
          const count =
            ch === "all"
              ? messages.length
              : messages.filter((m) => m.channel === ch).length;

          return (
            <button
              key={ch}
              onClick={() => setActiveChannel(ch)}
              className={`flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-mono font-bold uppercase transition-all ${
                activeChannel === ch
                  ? "border-border bg-elevated text-text-primary"
                  : "border-transparent text-muted hover:text-text-secondary"
              }`}
            >
              <span className={config?.color ?? "text-text-primary"}>
                {ch === "all" ? "All" : config?.label ?? ch}
              </span>
              <span className="rounded-full bg-surface px-1.5 text-[0.55rem] text-muted">
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Messages list */}
      <div className="rounded-lg border border-border bg-surface overflow-hidden">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <span className="text-4xl opacity-20">💬</span>
            <p className="mt-4 text-sm text-muted">
              No messages yet. Run agents to see inter-agent communication.
            </p>
          </div>
        ) : (
          <div className="max-h-[600px] overflow-y-auto">
            {filtered.map((msg) => (
              <MessageRow key={msg.id} msg={msg} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
