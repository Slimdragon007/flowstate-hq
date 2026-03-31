"use client";

import { useRef, useEffect, useState } from "react";
import type { AgentData } from "./agent-card";

let pixiModule: typeof import("pixi.js") | null = null;

async function loadPixi() {
  if (!pixiModule) {
    pixiModule = await import("pixi.js");
  }
  return pixiModule;
}

export function PixiCanvas({ agents }: { agents: AgentData[] }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const appRef = useRef<import("pixi.js").Application | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let destroyed = false;

    async function init() {
      const PIXI = await loadPixi();
      if (destroyed || !container) return;

      const app = new PIXI.Application();
      await app.init({
        background: 0x0a0a18,
        resizeTo: container,
        antialias: true,
        resolution: window.devicePixelRatio || 1,
        autoDensity: true,
      });

      if (destroyed) {
        app.destroy(true);
        return;
      }

      container.appendChild(app.canvas as HTMLCanvasElement);
      appRef.current = app;

      // Scaffold: show agent count as proof-of-life text
      const title = new PIXI.Text({
        text: `FLOWSTATE HEADQUARTERS - ${agents.length} agents`,
        style: {
          fontFamily: "monospace",
          fontSize: 12,
          fill: 0xffffff,
          letterSpacing: 2,
        },
      });
      title.alpha = 0.15;
      title.anchor.set(0.5);
      title.x = app.screen.width / 2;
      title.y = app.screen.height - 20;
      app.stage.addChild(title);

      setReady(true);
    }

    init();

    return () => {
      destroyed = true;
      if (appRef.current) {
        appRef.current.destroy(true, { children: true });
        appRef.current = null;
      }
      setReady(false);
    };
  }, [agents.length]);

  return (
    <div
      ref={containerRef}
      className="relative w-full overflow-hidden rounded-xl border border-border"
      style={{ height: 500, minWidth: 500 }}
    >
      {!ready && (
        <div className="absolute inset-0 flex items-center justify-center bg-[#0a0a18]">
          <span className="animate-pulse font-mono text-xs text-muted">
            Loading office...
          </span>
        </div>
      )}
    </div>
  );
}
