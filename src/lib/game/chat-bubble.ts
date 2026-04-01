import { Container, Graphics, Text } from "pixi.js";

const BUBBLE_MESSAGES: Record<string, string> = {
  working: "working...",
  done: "done!",
  error: "error!",
};

const BUBBLE_COLORS: Record<string, number> = {
  working: 0xb08800,
  done: 0x00cc66,
  error: 0xff4444,
};

export interface ChatBubble {
  container: Container;
  show: (status: string) => void;
  hide: () => void;
  updateAnimation: () => void;
}

export function createChatBubble(): ChatBubble {
  const container = new Container();
  container.visible = false;

  // Bubble background
  const bg = new Graphics();
  container.addChild(bg);

  // Triangle pointer
  const pointer = new Graphics();
  container.addChild(pointer);

  // Text
  const text = new Text({
    text: "",
    style: {
      fontFamily: "monospace",
      fontSize: 4,
      fill: 0xffffff,
    },
  });
  text.anchor.set(0.5, 0.5);
  container.addChild(text);

  // Animation state
  let targetScale = 0;
  let currentScale = 0;
  let targetAlpha = 0;
  let currentAlpha = 0;

  const bubble: ChatBubble = {
    container,

    show(status: string) {
      const message = BUBBLE_MESSAGES[status];
      if (!message) {
        bubble.hide();
        return;
      }

      const fillColor = BUBBLE_COLORS[status] ?? 0x888888;

      text.text = message;
      text.style.fill = fillColor;

      // Position bubble above agent's head
      const bubbleWidth = 32;
      const bubbleHeight = 10;
      const offsetX = 12.5; // 5 * P (P=2.5)
      const offsetY = -25; // -10 * P

      bg.clear();
      bg.roundRect(offsetX, offsetY, bubbleWidth, bubbleHeight, 3);
      bg.fill({ color: 0xffffff });
      bg.stroke({ color: 0xdddddd, width: 0.5 });

      pointer.clear();
      pointer.moveTo(offsetX + 4, offsetY + bubbleHeight);
      pointer.lineTo(offsetX + 8, offsetY + bubbleHeight + 3);
      pointer.lineTo(offsetX + 10, offsetY + bubbleHeight);
      pointer.fill({ color: 0xffffff });

      text.x = offsetX + bubbleWidth / 2;
      text.y = offsetY + bubbleHeight / 2;

      container.visible = true;
      targetScale = 1;
      targetAlpha = 1;
    },

    hide() {
      targetScale = 0;
      targetAlpha = 0;
    },

    updateAnimation() {
      // Smooth scale lerp (pop-in / pop-out)
      const scaleLerp = 0.15;
      currentScale += (targetScale - currentScale) * scaleLerp;
      container.scale.set(currentScale);

      // Smooth alpha lerp
      const alphaLerp = 0.1;
      currentAlpha += (targetAlpha - currentAlpha) * alphaLerp;
      container.alpha = currentAlpha;

      // Hide when fully faded out
      if (currentScale < 0.01 && targetScale === 0) {
        container.visible = false;
        currentScale = 0;
        currentAlpha = 0;
      }
    },
  };

  return bubble;
}
