import { Container, Graphics, Text } from "pixi.js";
import type { AgentData } from "@/components/agent-card";
import { STATUS_COLOR } from "./constants";

const P = 2.5; // pixel unit (matches SVG p=2.5)
const SKIN = 0xe8c8a0;
const PANTS = 0x334455;

export interface AgentSpriteData {
  container: Container;
  agent: AgentData;
  deskX: number;
  deskY: number;
  updateStatus: (status: string, color: string) => void;
}

export function createAgentSprite(
  agent: AgentData,
  onClick: () => void
): AgentSpriteData {
  const container = new Container();
  container.interactive = true;
  container.cursor = "pointer";
  container.on("pointerdown", onClick);

  // Hit area covers the full sprite
  const hitArea = new Graphics();
  hitArea.rect(-3 * P, -8 * P, 7 * P, 14 * P);
  hitArea.fill({ color: 0x000000, alpha: 0.001 });
  container.addChild(hitArea);

  const color = parseInt(agent.color.replace("#", ""), 16);
  const hair = agent.color === "#ffffff" ? 0x555555 : color;

  // Shadow
  const shadow = new Graphics();
  shadow.ellipse(0, 4 * P, 3 * P, P);
  shadow.fill({ color: 0x000000, alpha: 0.12 });
  container.addChild(shadow);

  // Body graphics
  const body = new Graphics();

  // Hair
  body.rect(-1 * P, -8 * P, 3 * P, P);
  body.fill({ color: hair });
  body.rect(-2 * P, -7 * P, 4 * P, P);
  body.fill({ color: hair });

  // Face
  body.rect(-1 * P, -7 * P, P, P);
  body.fill({ color: SKIN });
  body.rect(0, -7 * P, P, P);
  body.fill({ color: SKIN });

  // Eyes
  body.rect(-1 * P, -6 * P, P, P);
  body.fill({ color: 0x333333 });
  body.rect(1 * P, -6 * P, P, P);
  body.fill({ color: 0x333333 });

  // Lower face
  body.rect(-1 * P, -5 * P, P, P);
  body.fill({ color: SKIN });
  body.rect(0, -5 * P, P, P);
  body.fill({ color: 0xcc8888 });
  body.rect(1 * P, -5 * P, P, P);
  body.fill({ color: SKIN });

  // Neck
  body.rect(0, -4 * P, P, P);
  body.fill({ color: SKIN });

  // Shirt
  body.rect(-2 * P, -3 * P, 5 * P, P);
  body.fill({ color: color });
  body.rect(-3 * P, -2 * P, 7 * P, P);
  body.fill({ color: color });
  body.rect(-2 * P, -1 * P, 5 * P, P);
  body.fill({ color: color });

  // Arms (at rest)
  body.rect(-3 * P, -2 * P, P, P);
  body.fill({ color: SKIN });
  body.rect(3 * P, -2 * P, P, P);
  body.fill({ color: SKIN });

  // Belt
  body.rect(-2 * P, 0, 5 * P, P);
  body.fill({ color: 0x444444 });

  // Pants
  body.rect(-2 * P, P, 5 * P, P);
  body.fill({ color: PANTS });
  body.rect(-2 * P, 2 * P, 2 * P, P);
  body.fill({ color: PANTS });
  body.rect(1 * P, 2 * P, 2 * P, P);
  body.fill({ color: PANTS });

  // Shoes
  body.rect(-2 * P, 3 * P, 2 * P, P);
  body.fill({ color: 0x222222 });
  body.rect(1 * P, 3 * P, 2 * P, P);
  body.fill({ color: 0x222222 });

  container.addChild(body);

  // Typing hands (visible only when working)
  const leftHand = new Graphics();
  leftHand.rect(-4 * P, -2 * P, P, P);
  leftHand.fill({ color: SKIN });
  leftHand.visible = false;
  leftHand.label = "leftHand";
  container.addChild(leftHand);

  const rightHand = new Graphics();
  rightHand.rect(4 * P, -2 * P, P, P);
  rightHand.fill({ color: SKIN });
  rightHand.visible = false;
  rightHand.label = "rightHand";
  container.addChild(rightHand);

  // Status dot
  const statusDot = new Graphics();
  statusDot.circle(4 * P, -8 * P, P);
  statusDot.fill({ color: STATUS_COLOR[agent.status] ?? STATUS_COLOR.idle });
  statusDot.label = "statusDot";
  container.addChild(statusDot);

  // Name label
  const nameText = new Text({
    text: agent.name,
    style: {
      fontFamily: "monospace",
      fontSize: 6,
      fontWeight: "bold",
      fill: 0x665544,
    },
  });
  nameText.anchor.set(0.5, 0);
  nameText.y = 6 * P;
  container.addChild(nameText);

  // Animation state
  let typingTime = 0;
  let statusPulseTime = 0;
  let currentStatus = agent.status;

  // Ticker update (called externally from game loop)
  container.onRender = () => {
    const isWorking = currentStatus === "working";

    // Typing hands animation
    leftHand.visible = isWorking;
    rightHand.visible = isWorking;
    if (isWorking) {
      typingTime += 0.05;
      leftHand.y = Math.sin(typingTime * 6) * P * 0.5;
      rightHand.y = Math.sin(typingTime * 6 + Math.PI) * P * 0.5;
    }

    // Status dot pulse when working
    if (isWorking) {
      statusPulseTime += 0.03;
      statusDot.alpha = 0.3 + Math.sin(statusPulseTime * 3) * 0.35 + 0.35;
    } else {
      statusDot.alpha = 1;
    }
  };

  const spriteData: AgentSpriteData = {
    container,
    agent: { ...agent },
    deskX: 0,
    deskY: 0,
    updateStatus(status: string, agentColor: string) {
      currentStatus = status;
      spriteData.agent.status = status;
      spriteData.agent.color = agentColor;

      // Update status dot color
      const dot = container.getChildByLabel("statusDot") as Graphics | null;
      if (dot) {
        dot.clear();
        dot.circle(4 * P, -8 * P, P);
        dot.fill({ color: STATUS_COLOR[status] ?? STATUS_COLOR.idle });
      }
    },
  };

  return spriteData;
}
