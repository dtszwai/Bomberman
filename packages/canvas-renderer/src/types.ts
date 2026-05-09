export type Context2D =
  | CanvasRenderingContext2D
  | OffscreenCanvasRenderingContext2D;

export type FrameDimensions = [number, number, number, number];
export type FrameOrigin = [number, number];
export type FrameData = [FrameDimensions, FrameOrigin];

export type { Position } from "@arcade/realtime-core";
