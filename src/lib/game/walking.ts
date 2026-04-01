import type { AgentSpriteData } from "./agent-sprite";
import { getMeetingPosition } from "./constants";

interface WalkTarget {
  sprite: AgentSpriteData;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  progress: number;
  speed: number; // progress per frame (0 to 1 range)
}

function easeInOut(t: number): number {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
}

export class WalkingManager {
  private walks: WalkTarget[] = [];

  walkToMeeting(sprites: AgentSpriteData[]) {
    this.walks = [];
    const total = sprites.length;

    sprites.forEach((sprite, index) => {
      const meetingPos = getMeetingPosition(index, total);

      // Stagger start slightly per agent
      const staggerDelay = index * 0.02;

      this.walks.push({
        sprite,
        startX: sprite.container.x,
        startY: sprite.container.y,
        endX: meetingPos.x,
        endY: meetingPos.y - 8, // offset above floor like desk position
        progress: -staggerDelay, // negative = delayed start
        speed: 0.015, // ~67 frames to complete (~1.1s at 60fps)
      });
    });
  }

  walkToDesks(sprites: AgentSpriteData[]) {
    this.walks = [];

    sprites.forEach((sprite, index) => {
      const staggerDelay = index * 0.02;

      this.walks.push({
        sprite,
        startX: sprite.container.x,
        startY: sprite.container.y,
        endX: sprite.deskX,
        endY: sprite.deskY,
        progress: -staggerDelay,
        speed: 0.015,
      });
    });
  }

  // Call this from the game ticker
  update(): boolean {
    if (this.walks.length === 0) return false;

    let allDone = true;

    for (const walk of this.walks) {
      walk.progress += walk.speed;

      if (walk.progress < 0) {
        // Still in stagger delay
        allDone = false;
        continue;
      }

      if (walk.progress >= 1) {
        walk.sprite.container.x = walk.endX;
        walk.sprite.container.y = walk.endY;
        continue;
      }

      allDone = false;
      const t = easeInOut(Math.min(walk.progress, 1));
      walk.sprite.container.x =
        walk.startX + (walk.endX - walk.startX) * t;
      walk.sprite.container.y =
        walk.startY + (walk.endY - walk.startY) * t;
    }

    if (allDone) {
      this.walks = [];
    }

    return !allDone; // true = still animating
  }

  isAnimating(): boolean {
    return this.walks.length > 0;
  }
}
