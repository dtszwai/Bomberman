import { Position } from "@/engine/types";

// Check if a point is at the origin (0, 0)
export const isZero = (point: Position) => point.x === 0 && point.y === 0;

export const loadImage = (url: string) =>
  Object.assign(new Image(), { src: url });
