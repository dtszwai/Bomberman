export interface Point {
  x: number;
  y: number;
}

export function distance(pointA: Point, pointB: Point) {
  const distanceX = pointA.x - pointB.x;
  const distanceY = pointA.y - pointB.y;

  return Math.sqrt(distanceX * distanceX + distanceY * distanceY);
}

export function radians(pointA: Point, pointB: Point) {
  const dy = pointB.y - pointA.y;
  const dx = pointB.x - pointA.x;

  return Math.atan2(-dy, -dx);
}

export const toDegrees = (radians: number) => (radians * 180) / Math.PI;

export const toRadians = (degrees: number) => (degrees * Math.PI) / 180;

export const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(min, value), max);

export const lerp = (min: number, max: number, value: number) =>
  min + value * (max - min);
