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

// Zone definitions matching the team structure
const ZONES = [
  { id: "executive",   label: "EXECUTIVE",   color: 0x777777, fill: 0x222233 },
  { id: "operations",  label: "OPERATIONS",  color: 0xb08800, fill: 0x2a2210 },
  { id: "finance",     label: "FINANCE",     color: 0x008844, fill: 0x102a18 },
  { id: "marketing",   label: "MARKETING",   color: 0xcc4422, fill: 0x2a1510 },
  { id: "engineering", label: "ENGINEERING", color: 0x2266cc, fill: 0x101a2a },
  { id: "security",    label: "SECURITY",    color: 0x7733aa, fill: 0x1a1028 },
] as const;

// Convert grid coords (0-1 range) to isometric diamond coords
function toIso(gx: number, gy: number, w: number, h: number): [number, number] {
  // Map to diamond: top=N, right=E, bottom=S, left=W
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

  // Diamond dimensions
  const dw = stageWidth * 0.85;
  const dh = dw * 0.5;
  const cx = stageWidth / 2;
  const cy = stageHeight * 0.45;

  // Floor surface (full diamond)
  const floorShape = new PIXI.Graphics();
  floorShape.poly([
    cx, cy - dh / 2,       // top
    cx + dw / 2, cy,       // right
    cx, cy + dh / 2,       // bottom
    cx - dw / 2, cy,       // left
  ]);
  floorShape.fill({ color: 0xddd2c2, alpha: 1 });
  floor.addChild(floorShape);

  // Checkerboard tiles
  const tileCount = 12;
  for (let row = 0; row < tileCount; row++) {
    for (let col = 0; col < tileCount; col++) {
      if ((row + col) % 2 === 0) continue;
      const g = new PIXI.Graphics();
      const t = 1 / tileCount;
      const x0 = col * t;
      const y0 = row * t;
      const [ax, ay] = toIso(x0, y0, dw, dh);
      const [bx, by] = toIso(x0 + t, y0, dw, dh);
      const [ccx, ccy] = toIso(x0 + t, y0 + t, dw, dh);
      const [dx, dy] = toIso(x0, y0 + t, dw, dh);
      g.poly([cx + ax, cy + ay, cx + bx, cy + by, cx + ccx, cy + ccy, cx + dx, cy + dy]);
      g.fill({ color: 0xd6cab8, alpha: 0.3 });
      floor.addChild(g);
    }
  }

  // Left wall (depth)
  const wallLeft = new PIXI.Graphics();
  wallLeft.poly([
    cx - dw / 2, cy,
    cx, cy + dh / 2,
    cx, cy + dh / 2 + 15,
    cx - dw / 2, cy + 15,
  ]);
  wallLeft.fill({ color: 0xb0a090 });
  floor.addChild(wallLeft);

  // Right wall (depth)
  const wallRight = new PIXI.Graphics();
  wallRight.poly([
    cx, cy + dh / 2,
    cx + dw / 2, cy,
    cx + dw / 2, cy + 15,
    cx, cy + dh / 2 + 15,
  ]);
  wallRight.fill({ color: 0xa09080 });
  floor.addChild(wallRight);

  // Zone dividers: vertical center line + horizontal center line
  const dividers = new PIXI.Graphics();
  dividers.setStrokeStyle({ width: 1, color: 0xb8a890, alpha: 0.3 });
  // Vertical divider (top to bottom of diamond)
  dividers.moveTo(cx, cy - dh / 2);
  dividers.lineTo(cx, cy + dh / 2);
  dividers.stroke();
  // Horizontal divider (left to right of diamond)
  dividers.moveTo(cx - dw / 2, cy);
  dividers.lineTo(cx + dw / 2, cy);
  dividers.stroke();
  floor.addChild(dividers);

  // Zone overlays (colored tints on each quadrant section)
  // Layout: 2x3 grid -> top row: executive (left), operations (center), finance (right)
  //                      bottom row: marketing (left), engineering (center), security (right)
  // We split the diamond into 6 zones using thirds horizontally
  const zonePositions = [
    // Top row (y: 0 to 0.5)
    { zone: ZONES[0], gx: 0.17, gy: 0.25 }, // executive - top left
    { zone: ZONES[1], gx: 0.50, gy: 0.18 }, // operations - top center
    { zone: ZONES[2], gx: 0.83, gy: 0.25 }, // finance - top right
    // Bottom row (y: 0.5 to 1)
    { zone: ZONES[3], gx: 0.17, gy: 0.75 }, // marketing - bottom left
    { zone: ZONES[4], gx: 0.50, gy: 0.72 }, // engineering - bottom center
    { zone: ZONES[5], gx: 0.83, gy: 0.75 }, // security - bottom right
  ];

  for (const { zone, gx, gy } of zonePositions) {
    // Zone label
    const label = new PIXI.Text({
      text: zone.label,
      style: {
        fontFamily: "monospace",
        fontSize: 9,
        fill: zone.color,
        letterSpacing: 2,
        fontWeight: "bold",
      },
    });
    label.alpha = 0.6;
    label.anchor.set(0.5);
    // Position labels on the diamond surface
    const lx = cx + (gx - 0.5) * dw * 0.85;
    const ly = cy + (gy - 0.5) * dh * 0.85;
    label.x = lx;
    label.y = ly;
    floor.addChild(label);
  }

  // Meeting table (center of diamond)
  const table = new PIXI.Graphics();
  table.ellipse(cx, cy, 22, 12);
  table.fill({ color: 0xc4a882 });
  table.stroke({ width: 1, color: 0xd4b892 });
  floor.addChild(table);

  // Plants around the edges
  const plantPositions = [
    [cx - dw * 0.38, cy - dh * 0.15],
    [cx + dw * 0.38, cy - dh * 0.15],
    [cx - dw * 0.38, cy + dh * 0.15],
    [cx + dw * 0.38, cy + dh * 0.15],
    [cx - dw * 0.12, cy + dh * 0.38],
    [cx + dw * 0.12, cy + dh * 0.38],
  ];

  for (const [px, py] of plantPositions) {
    const plant = new PIXI.Graphics();
    // Pot
    plant.rect(px - 2, py + 1, 4, 4);
    plant.fill({ color: 0x8a7050 });
    // Leaves
    plant.circle(px, py - 2, 5);
    plant.fill({ color: 0x2a6a3a, alpha: 0.8 });
    plant.circle(px - 2, py - 5, 3);
    plant.fill({ color: 0x3a8a4a, alpha: 0.6 });
    floor.addChild(plant);
  }

  // Title text at bottom
  const title = new PIXI.Text({
    text: "FLOWSTATE HEADQUARTERS",
    style: {
      fontFamily: "monospace",
      fontSize: 8,
      fill: 0xffffff,
      letterSpacing: 4,
    },
  });
  title.alpha = 0.08;
  title.anchor.set(0.5);
  title.x = cx;
  title.y = stageHeight - 20;
  floor.addChild(title);

  return floor;
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

      // Build the isometric floor with zones
      const floor = buildFloor(PIXI, app.screen.width, app.screen.height);
      app.stage.addChild(floor);

      // Agent count indicator (temporary, replaced in D3 with sprites)
      const counter = new PIXI.Text({
        text: `${agents.length} agents online`,
        style: {
          fontFamily: "monospace",
          fontSize: 10,
          fill: 0x00ff88,
        },
      });
      counter.alpha = 0.4;
      counter.x = 12;
      counter.y = 12;
      app.stage.addChild(counter);

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
