import { Direction } from "@/game/constants/entities";
import { distance } from "./maths";

interface Point {
  x: number;
  y: number;
}

interface Circle {
  x: number;
  y: number;
  radius: number;
}

interface Rectangle {
  x: number;
  y: number;
  width: number;
  height: number;
}

export const pointRectangleOverlap = (point: Point, rect: Rectangle) =>
  point.x >= rect.x &&
  point.x <= rect.x + rect.width &&
  point.y >= rect.y &&
  point.y <= rect.y + rect.height;

export const pointCircleOverlap = (point: Point, circle: Circle) =>
  distance(point, circle) <= circle.radius;

export const rectanglesOverlap = (rectA: Rectangle, rectB: Rectangle) =>
  rectA.x + rectA.width >= rectB.x &&
  rectA.x <= rectB.x + rectB.width &&
  rectA.y + rectA.height >= rectB.y &&
  rectA.y <= rectB.y + rectB.height;

export const circlesOverlap = (circleA: Circle, circleB: Circle) =>
  distance(circleA, circleB) <= circleA.radius + circleB.radius;

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
