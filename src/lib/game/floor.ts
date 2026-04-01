import { Container, Graphics, Text } from "pixi.js";
import { ZONE_COLORS } from "./constants";

const ZONE_LABELS: { label: string; zone: string; x: number; y: number }[] = [
  { label: "EXECUTIVE", zone: "executive", x: -180, y: 70 },
  { label: "OPERATIONS", zone: "operations", x: 0, y: 50 },
  { label: "FINANCE", zone: "finance", x: 180, y: 70 },
  { label: "MARKETING", zone: "marketing", x: -180, y: 210 },
  { label: "ENGINEERING", zone: "engineering", x: 0, y: 200 },
  { label: "SECURITY", zone: "security", x: 180, y: 210 },
];

export function createFloor(): Container {
  const container = new Container();

  // Diamond floor surface
  const floor = new Graphics();
  floor.poly([0, 0, 350, 175, 0, 350, -350, 175]);
  floor.fill({ color: 0xddd2c2 });
  floor.stroke({ color: 0xc4b8a8, width: 2 });
  container.addChild(floor);

  // Checkerboard overlay
  const checker = new Graphics();
  const tileSize = 25;
  // Draw alternating tiles on the diamond using isometric projection
  for (let row = 0; row < 14; row++) {
    for (let col = 0; col < 14; col++) {
      if ((row + col) % 2 === 0) continue;
      // Map grid to diamond coords
      const gx = col * tileSize - 175;
      const gy = row * tileSize;
      // Isometric skew: x stays, y maps to diamond
      const ix = gx * 0.5 - (gy - 175) * 0.5;
      const iy = gx * 0.25 + (gy - 175) * 0.25 + 175;
      // Only draw if inside diamond bounds (rough check)
      const distFromCenter =
        Math.abs(ix) / 350 + Math.abs(iy - 175) / 175;
      if (distFromCenter > 1) continue;
      checker.rect(ix - tileSize * 0.35, iy - tileSize * 0.18, tileSize * 0.7, tileSize * 0.35);
      checker.fill({ color: 0xd6cab8, alpha: 0.3 });
    }
  }
  container.addChild(checker);

  // Left wall
  const leftWall = new Graphics();
  leftWall.poly([-350, 175, 0, 350, 0, 365, -350, 190]);
  leftWall.fill({ color: 0xb0a090 });
  container.addChild(leftWall);

  // Right wall
  const rightWall = new Graphics();
  rightWall.poly([0, 350, 350, 175, 350, 190, 0, 365]);
  rightWall.fill({ color: 0xa09080 });
  container.addChild(rightWall);

  // Zone divider lines (dashed via segments)
  const dividers = new Graphics();
  // Vertical center line
  drawDashedLine(dividers, 0, 0, 0, 350, 0xb8a890, 0.3);
  // Horizontal center line
  drawDashedLine(dividers, -350, 175, 350, 175, 0xb8a890, 0.3);
  container.addChild(dividers);

  // Zone labels
  for (const { label, zone, x, y } of ZONE_LABELS) {
    const text = new Text({
      text: label,
      style: {
        fontFamily: "monospace",
        fontSize: 8,
        fontWeight: "bold",
        fill: ZONE_COLORS[zone] ?? 0x777777,
        letterSpacing: 2,
      },
    });
    text.anchor.set(0.5, 0.5);
    text.x = x;
    text.y = y;
    text.alpha = 0.6;
    container.addChild(text);
  }

  // Meeting table (center)
  const table = new Graphics();
  table.ellipse(0, 175, 22, 12);
  table.fill({ color: 0xc4a882 });
  table.stroke({ color: 0xd4b892, width: 1 });
  container.addChild(table);

  return container;
}

function drawDashedLine(
  g: Graphics,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  color: number,
  alpha: number
) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const length = Math.sqrt(dx * dx + dy * dy);
  const dashLen = 4;
  const gapLen = 3;
  const step = dashLen + gapLen;
  const nx = dx / length;
  const ny = dy / length;

  for (let d = 0; d < length; d += step) {
    const sx = x1 + nx * d;
    const sy = y1 + ny * d;
    const ex = x1 + nx * Math.min(d + dashLen, length);
    const ey = y1 + ny * Math.min(d + dashLen, length);
    g.moveTo(sx, sy);
    g.lineTo(ex, ey);
    g.stroke({ color, width: 0.5, alpha });
  }
}
