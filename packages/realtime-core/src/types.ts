export type GameTime = { previous: number; secondsPassed: number };

export type Position = { x: number; y: number };
export type Velocity = { x: number; y: number };
export type Rect = { x: number; y: number; width: number; height: number };
export type Tile = { row: number; column: number };

/**
 * Adapter interface entities use to ask "is the player trying to move/
 * act?" without knowing where the input came from — local keyboard,
 * remote socket payload, bot, replay, etc.
 */
export interface InputHandler {
  isLeft: () => boolean;
  isRight: () => boolean;
  isUp: () => boolean;
  isDown: () => boolean;
  isAction: () => boolean;
}

/** Per-player key code mapping for a realtime input scheme. */
export interface KeyBindings {
  left: string;
  right: string;
  up: string;
  down: string;
  action: string;
}
