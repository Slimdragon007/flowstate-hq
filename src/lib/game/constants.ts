// Theme colors as PixiJS hex numbers
export const COLORS = {
  base: 0x0a0a18,
  surface: 0x0f0f24,
  elevated: 0x161632,
  border: 0x1a1a3e,
  green: 0x00ff88,
  amber: 0xffcc00,
  red: 0xff4444,
  muted: 0x666688,
  textPrimary: 0xffffff,
  textSecondary: 0xaaaacc,
} as const;

export const STATUS_COLOR: Record<string, number> = {
  idle: 0x888888,
  working: 0xffcc00,
  done: 0x00cc66,
  error: 0xff4444,
};

export const SCREEN_BG: Record<string, number> = {
  idle: 0x1a2a3a,
  working: 0x332800,
  done: 0x0a2815,
  error: 0x2a1010,
};

// Desk positions in grid coordinates (matching SVG office-view)
export const DESK_POSITIONS: Record<string, { x: number; y: number }[]> = {
  executive: [{ x: 80, y: 65 }],
  operations: [
    { x: 235, y: 50 },
    { x: 310, y: 50 },
    { x: 270, y: 110 },
  ],
  finance: [
    { x: 470, y: 50 },
    { x: 540, y: 50 },
  ],
  marketing: [
    { x: 70, y: 290 },
    { x: 145, y: 290 },
  ],
  engineering: [
    { x: 240, y: 275 },
    { x: 315, y: 275 },
    { x: 240, y: 345 },
    { x: 315, y: 345 },
  ],
  security: [
    { x: 470, y: 290 },
    { x: 540, y: 290 },
  ],
};

export const ZONE_ORDER = [
  "executive",
  "operations",
  "finance",
  "marketing",
  "engineering",
  "security",
];

export const ZONE_COLORS: Record<string, number> = {
  executive: 0x777777,
  operations: 0xb08800,
  finance: 0x008844,
  marketing: 0xcc4422,
  engineering: 0x2266cc,
  security: 0x7733aa,
};

// Canvas dimensions (matching SVG viewBox proportions)
export const CANVAS_WIDTH = 800;
export const CANVAS_HEIGHT = 500;

// Isometric floor origin (center-top of diamond)
export const FLOOR_ORIGIN = { x: 400, y: 60 };

// Convert grid coords (0-600, 0-440) to isometric position on the diamond
export function gridToIso(gx: number, gy: number): { x: number; y: number } {
  const ix = (gx - 300) * 0.95;
  const iy = (gy / 440) * 350;
  return { x: ix, y: iy };
}

// Meeting table center (relative to floor origin)
export const MEETING_CENTER = { x: 0, y: 175 };

// Get deterministic meeting position for an agent by index
export function getMeetingPosition(
  index: number,
  total: number
): { x: number; y: number } {
  const angle = (index / total) * 2 * Math.PI;
  return {
    x: Math.cos(angle) * 35,
    y: MEETING_CENTER.y + Math.sin(angle) * 20,
  };
}
