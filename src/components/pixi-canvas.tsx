"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import type { AgentData } from "./agent-card";

let pixiModule: typeof import("pixi.js") | null = null;

async function loadPixi() {
  if (!pixiModule) {
    pixiModule = await import("pixi.js");
  }
  return pixiModule;
}

// Zone definitions matching the team structure
const ZONES = [
  { id: "executive",   label: "EXECUTIVE",   color: 0x777777, fill: 0x222233 },
  { id: "operations",  label: "OPERATIONS",  color: 0xb08800, fill: 0x2a2210 },
  { id: "finance",     label: "FINANCE",     color: 0x008844, fill: 0x102a18 },
  { id: "marketing",   label: "MARKETING",   color: 0xcc4422, fill: 0x2a1510 },
  { id: "engineering", label: "ENGINEERING", color: 0x2266cc, fill: 0x101a2a },
  { id: "security",    label: "SECURITY",    color: 0x7733aa, fill: 0x1a1028 },
] as const;

const STATUS_COLORS: Record<string, number> = {
  idle: 0x888888,
  working: 0xffcc00,
  done: 0x00cc66,
  error: 0xff4444,
};

const SCREEN_BG: Record<string, number> = {
  idle: 0x1a2a3a,
  working: 0x332800,
  done: 0x0a2815,
  error: 0x2a1010,
};

// Desk slot positions per zone (relative to diamond center, normalized 0-1)
// Layout mirrors the old SVG: 2x3 grid
const DESK_SLOTS: Record<string, { rx: number; ry: number }[]> = {
  executive:   [{ rx: -0.28, ry: -0.35 }],
  operations:  [{ rx: -0.05, ry: -0.42 }, { rx: 0.08, ry: -0.42 }, { rx: 0.02, ry: -0.28 }],
  finance:     [{ rx: 0.25, ry: -0.35 }, { rx: 0.38, ry: -0.35 }],
  marketing:   [{ rx: -0.35, ry: 0.15 }, { rx: -0.22, ry: 0.15 }],
  engineering: [{ rx: -0.08, ry: 0.12 }, { rx: 0.05, ry: 0.12 }, { rx: -0.08, ry: 0.28 }, { rx: 0.05, ry: 0.28 }],
  security:    [{ rx: 0.25, ry: 0.15 }, { rx: 0.38, ry: 0.15 }],
};

const ZONE_ORDER = ["executive", "operations", "finance", "marketing", "engineering", "security"];

// Convert grid coords (0-1 range) to isometric diamond coords
function toIso(gx: number, gy: number, w: number, h: number): [number, number] {
  const ix = (gx - gy) * (w / 2);
  const iy = (gx + gy) * (h / 2);
  return [ix, iy];
}

function buildFloor(
  PIXI: typeof import("pixi.js"),
  stageWidth: number,
  stageHeight: number,
) {
  const floor = new PIXI.Container();
  const dw = stageWidth * 0.85;
  const dh = dw * 0.5;
  const cx = stageWidth / 2;
  const cy = stageHeight * 0.45;

  // Floor surface
  const floorShape = new PIXI.Graphics();
  floorShape.poly([cx, cy - dh / 2, cx + dw / 2, cy, cx, cy + dh / 2, cx - dw / 2, cy]);
  floorShape.fill({ color: 0xddd2c2 });
  floor.addChild(floorShape);

  // Checkerboard tiles
  const tileCount = 12;
  for (let row = 0; row < tileCount; row++) {
    for (let col = 0; col < tileCount; col++) {
      if ((row + col) % 2 === 0) continue;
      const g = new PIXI.Graphics();
      const t = 1 / tileCount;
      const x0 = col * t, y0 = row * t;
      const [ax, ay] = toIso(x0, y0, dw, dh);
      const [bx, by] = toIso(x0 + t, y0, dw, dh);
      const [ccx, ccy] = toIso(x0 + t, y0 + t, dw, dh);
      const [dx, dy] = toIso(x0, y0 + t, dw, dh);
      g.poly([cx + ax, cy + ay, cx + bx, cy + by, cx + ccx, cy + ccy, cx + dx, cy + dy]);
      g.fill({ color: 0xd6cab8, alpha: 0.3 });
      floor.addChild(g);
    }
  }

  // Walls
  const wallLeft = new PIXI.Graphics();
  wallLeft.poly([cx - dw / 2, cy, cx, cy + dh / 2, cx, cy + dh / 2 + 15, cx - dw / 2, cy + 15]);
  wallLeft.fill({ color: 0xb0a090 });
  floor.addChild(wallLeft);

  const wallRight = new PIXI.Graphics();
  wallRight.poly([cx, cy + dh / 2, cx + dw / 2, cy, cx + dw / 2, cy + 15, cx, cy + dh / 2 + 15]);
  wallRight.fill({ color: 0xa09080 });
  floor.addChild(wallRight);

  // Zone dividers
  const dividers = new PIXI.Graphics();
  dividers.setStrokeStyle({ width: 1, color: 0xb8a890, alpha: 0.3 });
  dividers.moveTo(cx, cy - dh / 2);
  dividers.lineTo(cx, cy + dh / 2);
  dividers.stroke();
  dividers.moveTo(cx - dw / 2, cy);
  dividers.lineTo(cx + dw / 2, cy);
  dividers.stroke();
  floor.addChild(dividers);

  // Zone labels
  const zonePositions = [
    { zone: ZONES[0], gx: 0.17, gy: 0.25 },
    { zone: ZONES[1], gx: 0.50, gy: 0.18 },
    { zone: ZONES[2], gx: 0.83, gy: 0.25 },
    { zone: ZONES[3], gx: 0.17, gy: 0.75 },
    { zone: ZONES[4], gx: 0.50, gy: 0.72 },
    { zone: ZONES[5], gx: 0.83, gy: 0.75 },
  ];

  for (const { zone, gx, gy } of zonePositions) {
    const label = new PIXI.Text({
      text: zone.label,
      style: { fontFamily: "monospace", fontSize: 9, fill: zone.color, letterSpacing: 2, fontWeight: "bold" },
    });
    label.alpha = 0.6;
    label.anchor.set(0.5);
    label.x = cx + (gx - 0.5) * dw * 0.85;
    label.y = cy + (gy - 0.5) * dh * 0.85;
    floor.addChild(label);
  }

  // Meeting table
  const table = new PIXI.Graphics();
  table.ellipse(cx, cy, 22, 12);
  table.fill({ color: 0xc4a882 });
  table.stroke({ width: 1, color: 0xd4b892 });
  floor.addChild(table);

  // Plants
  const plantPositions = [
    [cx - dw * 0.38, cy - dh * 0.15], [cx + dw * 0.38, cy - dh * 0.15],
    [cx - dw * 0.38, cy + dh * 0.15], [cx + dw * 0.38, cy + dh * 0.15],
    [cx - dw * 0.12, cy + dh * 0.38], [cx + dw * 0.12, cy + dh * 0.38],
  ];
  for (const [px, py] of plantPositions) {
    const plant = new PIXI.Graphics();
    plant.rect(px - 2, py + 1, 4, 4);
    plant.fill({ color: 0x8a7050 });
    plant.circle(px, py - 2, 5);
    plant.fill({ color: 0x2a6a3a, alpha: 0.8 });
    plant.circle(px - 2, py - 5, 3);
    plant.fill({ color: 0x3a8a4a, alpha: 0.6 });
    floor.addChild(plant);
  }

  // Title
  const title = new PIXI.Text({
    text: "FLOWSTATE HEADQUARTERS",
    style: { fontFamily: "monospace", fontSize: 8, fill: 0xffffff, letterSpacing: 4 },
  });
  title.alpha = 0.08;
  title.anchor.set(0.5);
  title.x = cx;
  title.y = stageHeight - 20;
  floor.addChild(title);

  return { floor, cx, cy, dw, dh };
}

function drawDesk(
  PIXI: typeof import("pixi.js"),
  x: number,
  y: number,
  screenColor: number,
) {
  const desk = new PIXI.Graphics();
  // Desk surface
  desk.rect(x - 14, y - 2, 28, 10);
  desk.fill({ color: 0xc4a882 });
  desk.stroke({ width: 0.5, color: 0xd4b892 });
  // Monitor
  desk.rect(x - 6, y - 12, 12, 9);
  desk.fill({ color: 0x1a1a22 });
  desk.stroke({ width: 0.5, color: 0x333333 });
  // Screen
  desk.rect(x - 4, y - 10, 8, 5);
  desk.fill({ color: screenColor });
  return desk;
}

function drawPixelAgent(
  PIXI: typeof import("pixi.js"),
  agent: AgentData,
  x: number,
  y: number,
  onClick: () => void,
) {
  const container = new PIXI.Container();
  container.x = x;
  container.y = y;
  container.eventMode = "static";
  container.cursor = "pointer";
  container.on("pointertap", onClick);

  const p = 2.5;
  const skin = 0xe8c8a0;
  const agentColor = parseInt(agent.color.replace("#", ""), 16);
  const hair = agent.color === "#ffffff" ? 0x555555 : agentColor;
  const pants = 0x334455;
  const statusColor = STATUS_COLORS[agent.status] ?? 0x888888;
  const isWorking = agent.status === "working";

  const g = new PIXI.Graphics();

  // Shadow
  g.ellipse(0, 4 * p, 3 * p, p);
  g.fill({ color: 0x000000, alpha: 0.12 });

  // Hair
  g.rect(-1 * p, -8 * p, 3 * p, p);
  g.fill({ color: hair });
  g.rect(-2 * p, -7 * p, 4 * p, p);
  g.fill({ color: hair });

  // Face
  g.rect(-1 * p, -7 * p, p, p);
  g.fill({ color: skin });
  g.rect(0, -7 * p, p, p);
  g.fill({ color: skin });
  // Eyes
  g.rect(-1 * p, -6 * p, p, p);
  g.fill({ color: 0x333333 });
  g.rect(1 * p, -6 * p, p, p);
  g.fill({ color: 0x333333 });
  // Mouth area
  g.rect(-1 * p, -5 * p, p, p);
  g.fill({ color: skin });
  g.rect(0, -5 * p, p, p);
  g.fill({ color: 0xcc8888 });
  g.rect(1 * p, -5 * p, p, p);
  g.fill({ color: skin });

  // Neck
  g.rect(0, -4 * p, p, p);
  g.fill({ color: skin });

  // Shirt
  g.rect(-2 * p, -3 * p, 5 * p, p);
  g.fill({ color: agentColor });
  g.rect(-3 * p, -2 * p, 7 * p, p);
  g.fill({ color: agentColor });
  g.rect(-2 * p, -1 * p, 5 * p, p);
  g.fill({ color: agentColor });

  // Arms (hands)
  g.rect(-3 * p, -2 * p, p, p);
  g.fill({ color: skin });
  g.rect(3 * p, -2 * p, p, p);
  g.fill({ color: skin });

  // Belt
  g.rect(-2 * p, 0, 5 * p, p);
  g.fill({ color: 0x444444 });

  // Pants
  g.rect(-2 * p, p, 5 * p, p);
  g.fill({ color: pants });
  g.rect(-2 * p, 2 * p, 2 * p, p);
  g.fill({ color: pants });
  g.rect(1 * p, 2 * p, 2 * p, p);
  g.fill({ color: pants });

  // Shoes
  g.rect(-2 * p, 3 * p, 2 * p, p);
  g.fill({ color: 0x222222 });
  g.rect(1 * p, 3 * p, 2 * p, p);
  g.fill({ color: 0x222222 });

  container.addChild(g);

  // Status dot
  const dot = new PIXI.Graphics();
  dot.circle(4 * p, -8 * p, p);
  dot.fill({ color: statusColor });
  container.addChild(dot);

  // Pulsing animation for working status
  if (isWorking) {
    let elapsed = 0;
    const ticker = new PIXI.Ticker();
    ticker.add((delta) => {
      elapsed += delta.deltaTime * 0.05;
      dot.alpha = 0.3 + Math.sin(elapsed * Math.PI * 2) * 0.7;
    });
    ticker.start();
    container.on("destroyed", () => ticker.destroy());
  }

  // Name label
  const nameLabel = new PIXI.Text({
    text: agent.name,
    style: { fontFamily: "monospace", fontSize: 6, fill: 0x665544, fontWeight: "bold" },
  });
  nameLabel.anchor.set(0.5);
  nameLabel.y = 6 * p;
  container.addChild(nameLabel);

  // Chat bubble when working
  if (isWorking) {
    const bubble = new PIXI.Graphics();
    bubble.roundRect(5 * p, -10 * p, 32, 10, 3);
    bubble.fill({ color: 0xffffff });
    bubble.stroke({ width: 0.5, color: 0xdddddd });
    container.addChild(bubble);

    const bubbleText = new PIXI.Text({
      text: "working...",
      style: { fontFamily: "monospace", fontSize: 4, fill: 0xb08800 },
    });
    bubbleText.anchor.set(0.5);
    bubbleText.x = 5 * p + 16;
    bubbleText.y = -10 * p + 5;
    container.addChild(bubbleText);
  }

  return container;
}

interface PixiCanvasProps {
  agents: AgentData[];
  onSelectAgent?: (agent: AgentData) => void;
}

export function PixiCanvas({ agents, onSelectAgent }: PixiCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const appRef = useRef<import("pixi.js").Application | null>(null);
  const [ready, setReady] = useState(false);
  const agentsRef = useRef(agents);
  agentsRef.current = agents;

  const handleAgentClick = useCallback((agent: AgentData) => {
    onSelectAgent?.(agent);
  }, [onSelectAgent]);

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

      const sw = app.screen.width;
      const sh = app.screen.height;

      // Build floor
      const { floor, cx, cy, dw, dh } = buildFloor(PIXI, sw, sh);
      app.stage.addChild(floor);

      // Place agents at desks
      const currentAgents = agentsRef.current;
      const agentLayer = new PIXI.Container();

      for (const zone of ZONE_ORDER) {
        const zoneAgents = currentAgents.filter((a) => a.zone === zone);
        const slots = DESK_SLOTS[zone] || [];

        zoneAgents.forEach((agent, i) => {
          const slot = slots[i];
          if (!slot) return;

          const ax = cx + slot.rx * dw;
          const ay = cy + slot.ry * dh;

          // Draw desk
          const desk = drawDesk(PIXI, ax, ay, SCREEN_BG[agent.status] ?? 0x1a2a3a);
          agentLayer.addChild(desk);

          // Draw agent (positioned above desk)
          const sprite = drawPixelAgent(PIXI, agent, ax, ay - 8, () => handleAgentClick(agent));
          agentLayer.addChild(sprite);
        });
      }

      app.stage.addChild(agentLayer);
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
  }, [agents, handleAgentClick]);

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
