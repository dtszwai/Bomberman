import {
  EPLOSION_FRAME_DELAY,
  EXPLOSION_ANIMATION_SEQUENCE,
} from "../constants/bombs";
import { GameTime, Tile } from "@arcade/realtime-core";
import { FlameCell } from "../types";

export const EXPLOSION_DURATION_MS =
  EXPLOSION_ANIMATION_SEQUENCE.length * EPLOSION_FRAME_DELAY;

export interface ExplosionSnapshot {
  id: number;
  cell: Tile;
  startedAt: number;
  durationMs: number;
  flameCells: FlameCell[];
}

/**
 * Class representing a bomb explosion in the game.
 * Manages lifecycle. Client derives animation from {startedAt, durationMs}.
 * Shares id with the Bomb it originated from, so clients can correlate
 * bomb:placed → bomb:exploded.
 */
export class Explosion {
  public readonly startedAt: number;
  public readonly durationMs: number = EXPLOSION_DURATION_MS;

  constructor(
    public readonly id: number,
    public cell: Tile,
    public flameCells: FlameCell[],
    time: GameTime,
    private onExplosionComplete: (explosion: Explosion) => void
  ) {
    this.startedAt = time.previous;
  }

  public update(time: GameTime) {
    if (time.previous - this.startedAt >= this.durationMs) {
      this.onExplosionComplete(this);
    }
  }

  public serialize(): ExplosionSnapshot {
    return {
      id: this.id,
      cell: this.cell,
      flameCells: this.flameCells,
      startedAt: this.startedAt,
      durationMs: this.durationMs,
    };
  }
}
