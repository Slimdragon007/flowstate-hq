import { Container, Text } from "pixi.js";
import type { AgentData } from "@/components/agent-card";
import type { OfficeGame, GameCallbacks } from "./types";
import { createApp } from "./app";
import {
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  FLOOR_ORIGIN,
  DESK_POSITIONS,
  ZONE_ORDER,
  gridToIso,
} from "./constants";
import { createFloor } from "./floor";
import { createPlants } from "./plant";
import { createAgentSprite, type AgentSpriteData } from "./agent-sprite";
import { createDesk, updateDeskScreen } from "./desk";
import { WalkingManager } from "./walking";
import { createChatBubble, type ChatBubble } from "./chat-bubble";

export type { OfficeGame, GameCallbacks };

export async function createOfficeGame(
  container: HTMLElement,
  initialAgents: AgentData[],
  callbacks: GameCallbacks
): Promise<OfficeGame> {
  const app = await createApp(container);

  // Root container for all game content, centered like the SVG
  const world = new Container();
  app.stage.addChild(world);

  // Scale world to fit container while maintaining aspect ratio
  function resize() {
    const scaleX = app.screen.width / CANVAS_WIDTH;
    const scaleY = app.screen.height / CANVAS_HEIGHT;
    const scale = Math.min(scaleX, scaleY);
    world.scale.set(scale);
    world.x = (app.screen.width - CANVAS_WIDTH * scale) / 2;
    world.y = (app.screen.height - CANVAS_HEIGHT * scale) / 2;
  }
  resize();
  app.renderer.on("resize", resize);

  // Isometric floor positioned at center-top of canvas
  const floorContainer = new Container();
  floorContainer.x = FLOOR_ORIGIN.x;
  floorContainer.y = FLOOR_ORIGIN.y;
  world.addChild(floorContainer);

  // Add floor geometry (diamond, walls, zone labels, meeting table)
  const floor = createFloor();
  floorContainer.addChild(floor);

  // Decorative plants
  const plants = createPlants();
  floorContainer.addChild(plants);

  // Agent + desk layer (on top of floor, under bubbles)
  const agentLayer = new Container();
  floorContainer.addChild(agentLayer);

  // Chat bubble layer (on top of agents)
  const bubbleLayer = new Container();
  floorContainer.addChild(bubbleLayer);

  // Build agent sprites and desks from initial data
  const spriteMap = new Map<string, AgentSpriteData>();
  const deskMap = new Map<string, Container>();
  const bubbleMap = new Map<string, ChatBubble>();

  function buildAgents(agents: AgentData[]) {
    // Clear existing
    agentLayer.removeChildren();
    bubbleLayer.removeChildren();
    spriteMap.clear();
    deskMap.clear();
    bubbleMap.clear();

    // Position agents by zone
    for (const zone of ZONE_ORDER) {
      const zoneAgents = agents.filter((a) => a.zone === zone);
      const positions = DESK_POSITIONS[zone] || [];

      zoneAgents.forEach((agent, i) => {
        const pos = positions[i];
        if (!pos) return;

        const iso = gridToIso(pos.x, pos.y);

        // Create desk
        const desk = createDesk(agent.status);
        desk.x = iso.x;
        desk.y = iso.y;
        desk.label = `desk-${agent.id}`;
        agentLayer.addChild(desk);
        deskMap.set(agent.id, desk);

        // Create agent sprite
        const sprite = createAgentSprite(agent, () => {
          // Find current agent data (may have updated)
          const current = spriteMap.get(agent.id);
          if (current) callbacks.onAgentClick(current.agent);
        });
        sprite.container.x = iso.x;
        sprite.container.y = iso.y - 8; // offset above desk
        sprite.deskX = iso.x;
        sprite.deskY = iso.y - 8;
        agentLayer.addChild(sprite.container);
        spriteMap.set(agent.id, sprite);

        // Chat bubble (follows agent position)
        const bubble = createChatBubble();
        bubble.container.x = iso.x;
        bubble.container.y = iso.y - 8;
        if (agent.status === "working") bubble.show("working");
        bubbleLayer.addChild(bubble.container);
        bubbleMap.set(agent.id, bubble);
      });
    }
  }

  // Footer text
  const footer = new Text({
    text: "FLOWSTATE HEADQUARTERS",
    style: {
      fontFamily: "monospace",
      fontSize: 7,
      fill: 0xffffff,
      letterSpacing: 4,
    },
  });
  footer.anchor.set(0.5, 0);
  footer.x = CANVAS_WIDTH / 2;
  footer.y = 485;
  footer.alpha = 0.08;
  world.addChild(footer);

  buildAgents(initialAgents);

  // FPS cap for performance
  app.ticker.maxFPS = 30;

  // Pause ticker when tab is hidden
  function handleVisibility() {
    if (document.hidden) {
      app.ticker.stop();
    } else {
      app.ticker.start();
    }
  }
  document.addEventListener("visibilitychange", handleVisibility);

  // Walking animation manager
  const walkManager = new WalkingManager();
  let meetingActive = false;

  // Previous status tracker for bubble transitions
  const prevStatus = new Map<string, string>();
  for (const agent of initialAgents) {
    prevStatus.set(agent.id, agent.status);
  }

  // Ambient animation time
  let ambientTime = 0;

  // Game ticker for walking + bubble + ambient animations
  app.ticker.add(() => {
    walkManager.update();
    ambientTime += 0.02;

    // Update sprites: breathing for idle, bubble positions
    spriteMap.forEach((sprite, agentId) => {
      // Idle breathing: gentle Y oscillation
      if (sprite.agent.status === "idle" && !walkManager.isAnimating()) {
        // Use agent index for phase offset so they don't breathe in sync
        const phase = parseInt(agentId.slice(0, 8), 16) % 100;
        sprite.container.y =
          sprite.deskY + Math.sin(ambientTime * 2 + phase) * 0.3;
      }

      // Update bubble position to follow agent
      const bubble = bubbleMap.get(agentId);
      if (bubble) {
        bubble.container.x = sprite.container.x;
        bubble.container.y = sprite.container.y;
        bubble.updateAnimation();
      }
    });
  });

  return {
    updateAgents(agents: AgentData[]) {
      // Update existing sprites or rebuild if agent count changed
      if (agents.length !== spriteMap.size) {
        buildAgents(agents);
        return;
      }

      for (const agent of agents) {
        const sprite = spriteMap.get(agent.id);
        if (sprite) {
          sprite.updateStatus(agent.status, agent.color);
          sprite.agent.last_output = agent.last_output;
          sprite.agent.last_run_at = agent.last_run_at;
        }

        const desk = deskMap.get(agent.id);
        if (desk) {
          updateDeskScreen(desk, agent.status);
        }

        // Show/hide chat bubble on status change
        const bubble = bubbleMap.get(agent.id);
        const prev = prevStatus.get(agent.id);
        if (bubble && agent.status !== prev) {
          if (agent.status === "working" || agent.status === "done" || agent.status === "error") {
            bubble.show(agent.status);
            // Auto-hide "done" and "error" bubbles after 2s
            if (agent.status !== "working") {
              setTimeout(() => bubble.hide(), 2000);
            }
          } else {
            bubble.hide();
          }
          prevStatus.set(agent.id, agent.status);
        }
      }
    },

    setMeetingActive(active: boolean) {
      if (active === meetingActive) return;
      meetingActive = active;

      const allSprites = Array.from(spriteMap.values());

      const allDesks = Array.from(deskMap.values());

      if (active) {
        // Hide desks, walk agents to meeting table
        allDesks.forEach((desk) => (desk.visible = false));
        walkManager.walkToMeeting(allSprites);
      } else {
        // Walk agents back to desks, then show desks
        walkManager.walkToDesks(allSprites);
        // Show desks after a delay (walk takes ~1.1s)
        setTimeout(() => {
          allDesks.forEach((desk) => (desk.visible = true));
        }, 1200);
      }
    },

    destroy() {
      document.removeEventListener("visibilitychange", handleVisibility);
      app.renderer.off("resize", resize);
      app.destroy(
        { removeView: true },
        { children: true, texture: true, textureSource: true }
      );
    },
  };
}
