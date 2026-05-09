import { Direction } from "../constants/entities";

interface Rectangle {
  x: number;
  y: number;
  width: number;
  height: number;
}

export const rectanglesOverlap = (rectA: Rectangle, rectB: Rectangle) =>
  rectA.x + rectA.width >= rectB.x &&
  rectA.x <= rectB.x + rectB.width &&
  rectA.y + rectA.height >= rectB.y &&
  rectA.y <= rectB.y + rectB.height;

export const collisionOffsets = {
  [Direction.LEFT]: [
    { dx: -9, dy: -8 },
    { dx: -9, dy: 7 },
  ],
  [Direction.RIGHT]: [
    { dx: 8, dy: -8 },
    { dx: 8, dy: 7 },
  ],
  [Direction.UP]: [
    { dx: -8, dy: -9 },
    { dx: 7, dy: -9 },
  ],
  [Direction.DOWN]: [
    { dx: -8, dy: 8 },
    { dx: 7, dy: 8 },
  ],
};
