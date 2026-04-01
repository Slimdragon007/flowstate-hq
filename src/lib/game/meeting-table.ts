import { Graphics } from "pixi.js";
import { MEETING_CENTER } from "./constants";

export function createMeetingTable(): Graphics {
  const table = new Graphics();
  table.ellipse(MEETING_CENTER.x, MEETING_CENTER.y, 22, 12);
  table.fill({ color: 0xc4a882 });
  table.stroke({ color: 0xd4b892, width: 1 });
  return table;
}
