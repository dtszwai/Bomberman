import { Camera } from "./Camera";

export type ValueOf<T> = T[keyof T];

export type GameTime = { previous: number; secondsPassed: number };

export type Position = { x: number; y: number };
export type Velocity = { x: number; y: number };

export type Rect = { x: number; y: number; width: number; height: number };

export type Tile = { row: number; column: number };

export type FrameDimensions = [number, number, number, number];
export type FrameOrigin = [number, number];
export type FrameData = [FrameDimensions, FrameOrigin];
export type FrameDataMap = Map<string, FrameData>;

export type AnimationFrame = [string, number];

export type onSceneEndHandler<T> = (newScene: ValueOf<T>) => void;

export interface Updateable {
  update(
    time: GameTime,
    context?: CanvasRenderingContext2D,
    camera?: Camera
  ): void;
}

export interface Drawable {
  draw(context: CanvasRenderingContext2D, camera?: Camera): void;
}

export interface Scene extends Updateable, Drawable {}

export interface Entity extends Updateable, Drawable {
  position: Position;
  animationFrame: number;
  animationTimer: DOMHighResTimeStamp;

  image: HTMLImageElement;
}
export type Context2D =
  | CanvasRenderingContext2D
  | OffscreenCanvasRenderingContext2D;
