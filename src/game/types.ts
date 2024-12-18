import { Tile } from "./engine/types";
import { CollisionTile, MapTile } from "./constants/levelData";
import {
  BombermanSnapshot,
  BombSnapshot,
  ExplosionSnapshot,
  StageSnapshot,
} from "./entities";
import { BlocksSnapshot, PowerupsSnapshot } from "./systems";

/**
 * Interface representing the state of the game.
 */
export interface GameState {
  /** Array representing the number of wins per player */
  wins: number[];
  /** Maximum number of wins required to win the game */
  maxWins: number;
}

/**
 * Interface representing the structure of stage data.
 */
export interface StageData {
  readonly maxBlocks: number;
  readonly powerups: Partial<Record<CollisionTile, number>>;
  readonly tiles: MapTile[][];
}

/**
 * Interface representing a flame cell in the bomb explosion.
 */
export interface FlameCell {
  /** The tile position of the flame */
  cell: Tile;
  /** Indicates if the flame is vertical */
  isVertical: boolean;
  /** Indicates if the flame is the last in its direction */
  isLast: boolean;
}

export interface GameSnapshot {
  hud: { time: [number, number]; state: GameState };
  stage: StageSnapshot;
  players: BombermanSnapshot[];
  blocks: BlocksSnapshot["blocks"];
  bombs: BombSnapshot[];
  explosions: ExplosionSnapshot[];
  powerups: PowerupsSnapshot;
}
