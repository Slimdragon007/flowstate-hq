"use client";

import { useState } from "react";

export function BootButton({ onComplete }: { onComplete?: () => void }) {
  const [running, setRunning] = useState(false);
  const [statusText, setStatusText] = useState("");

  async function handleBoot() {
    if (running) return;
    setRunning(true);
    setStatusText("Oracle booting...");

    try {
      const res = await fetch("/api/briefing/boot", { method: "POST" });
      const data = await res.json();

      if (data.success) {
        const agentCount = Object.keys(data.results).length;
        setStatusText(`Briefing complete. ${agentCount} agents reported.`);
        onComplete?.();
      } else {
        setStatusText(`Failed: ${data.error}`);
      }
    } catch {
      setStatusText("Network error. Try again.");
    } finally {
      setRunning(false);
      setTimeout(() => setStatusText(""), 5000);
    }
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <button
        onClick={handleBoot}
        disabled={running}
        className={`group relative rounded-lg border px-8 py-3 font-mono text-sm font-bold transition-all ${
          running
            ? "cursor-wait border-amber/50 bg-amber/10 text-amber"
            : "border-green/30 bg-green/10 text-green hover:border-green/60 hover:bg-green/20 hover:shadow-[0_0_20px_rgba(0,255,136,0.15)]"
        }`}
      >
        {running ? (
          <span className="flex items-center gap-2">
            <span className="h-2 w-2 animate-pulse-glow rounded-full bg-amber" />
            Running Briefing...
          </span>
        ) : (
          "Boot Morning Briefing"
        )}
      </button>

      {statusText && (
        <p className="text-xs text-text-secondary">{statusText}</p>
      )}
    </div>
  );
}
