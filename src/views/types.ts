import { Snapshot } from "./BattleSceneRenderer";

export type Position = { x: number; y: number };

export type FrameDimensions = [number, number, number, number];
export type FrameOrigin = [number, number];
export type FrameData = [FrameDimensions, FrameOrigin];

export type Context2D =
  | CanvasRenderingContext2D
  | OffscreenCanvasRenderingContext2D;

export interface IGameRenderer {
  update(snapshot: Snapshot): void;
  render(ctx: Context2D): void;
  cleanup(): void;
}
