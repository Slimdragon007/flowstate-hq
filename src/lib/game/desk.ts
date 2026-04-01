import { Container, Graphics } from "pixi.js";
import { SCREEN_BG } from "./constants";

export function createDesk(status: string): Container {
  const desk = new Container();

  // Desk surface
  const surface = new Graphics();
  surface.rect(-14, -2, 28, 10);
  surface.fill({ color: 0xc4a882 });
  surface.stroke({ color: 0xd4b892, width: 0.5 });
  desk.addChild(surface);

  // Monitor frame
  const monitorFrame = new Graphics();
  monitorFrame.rect(-6, -12, 12, 9);
  monitorFrame.fill({ color: 0x1a1a22 });
  monitorFrame.stroke({ color: 0x333333, width: 0.5 });
  desk.addChild(monitorFrame);

  // Monitor screen (color based on status)
  const screen = new Graphics();
  screen.rect(-4, -10, 8, 5);
  screen.fill({ color: SCREEN_BG[status] ?? SCREEN_BG.idle });
  screen.label = "screen";
  desk.addChild(screen);

  return desk;
}

export function updateDeskScreen(desk: Container, status: string) {
  const screen = desk.getChildByLabel("screen") as Graphics | null;
  if (!screen) return;
  screen.clear();
  screen.rect(-4, -10, 8, 5);
  screen.fill({ color: SCREEN_BG[status] ?? SCREEN_BG.idle });
}
