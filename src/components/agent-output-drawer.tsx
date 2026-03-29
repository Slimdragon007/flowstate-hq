"use client";

import { useEffect, useRef } from "react";
import { StatusBadge } from "./status-badge";

interface Agent {
  id: string;
  name: string;
  role: string;
  emoji: string;
  color: string;
  status: string;
  last_output: string | null;
  last_run_at: string | null;
  zone: string;
  mcp_target: string | null;
}

function timeAgo(dateStr: string | null): string {
  if (!dateStr) return "Never";
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export function AgentOutputDrawer({
  agent,
  onClose,
}: {
  agent: Agent | null;
  onClose: () => void;
}) {
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleEscape(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    if (agent) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "";
    };
  }, [agent, onClose]);

  if (!agent) return null;

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex justify-end"
      onClick={(e) => {
        if (e.target === overlayRef.current) onClose();
      }}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      {/* Drawer */}
      <div className="relative w-full max-w-lg animate-slide-in border-l border-border bg-base overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 z-10 border-b border-border bg-base/95 backdrop-blur-sm p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-2xl">{agent.emoji}</span>
              <div>
                <h2 className="font-mono text-lg font-bold text-text-primary">
                  {agent.name}
                </h2>
                <p className="text-sm text-muted">{agent.role}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="rounded-lg border border-border p-2 text-muted hover:bg-surface hover:text-text-primary transition-colors"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M4 4L12 12M12 4L4 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </button>
          </div>

          {/* Meta row */}
          <div className="mt-3 flex items-center gap-3">
            <StatusBadge status={agent.status} />
            <span className="text-xs text-muted">
              Last run: {timeAgo(agent.last_run_at)}
            </span>
            {agent.mcp_target && (
              <span className="rounded-full border border-border bg-surface px-2 py-0.5 text-[0.6rem] text-text-secondary uppercase">
                {agent.mcp_target}
              </span>
            )}
          </div>
        </div>

        {/* Output */}
        <div className="p-4">
          {agent.last_output ? (
            <div className="rounded-lg border border-border bg-surface p-4">
              <h3 className="mb-3 font-mono text-xs font-bold uppercase tracking-wider text-muted">
                Output
              </h3>
              <pre className="whitespace-pre-wrap break-words font-sans text-sm leading-relaxed text-text-secondary">
                {agent.last_output}
              </pre>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <span className="text-4xl opacity-30">{agent.emoji}</span>
              <p className="mt-4 text-sm text-muted">
                No output yet. Run this agent to see results.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
