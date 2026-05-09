import { GameTime, Tile } from "@arcade/realtime-core";
import { FUSE_TIMER } from "../constants/bombs";

export interface BombSnapshot {
  id: number;
  cell: Tile;
  ownerId: number;
  strength: number;
  placedAt: number;
  fuseMs: number;
}

/**
 * Class representing a bomb in the game.
 * Manages fuse timer. Client derives fuse/sprite animation from {placedAt, fuseMs}.
 */
export class Bomb {
  public readonly placedAt: number;
  public fuseExpiration: number;

  constructor(
    public readonly id: number,
    public readonly cell: Tile,
    public readonly ownerId: number,
    public readonly strength: number,
    time: GameTime,
    private onFuseComplete: (bomb: Bomb, time: GameTime) => void,
    public readonly fuseMs: number = FUSE_TIMER
  ) {
    this.placedAt = time.previous;
    this.fuseExpiration = time.previous + this.fuseMs;
  }

  private checkFuse(time: GameTime) {
    if (time.previous >= this.fuseExpiration) {
      this.onFuseComplete(this, time);
    }
  }

  public update(time: GameTime) {
    this.checkFuse(time);
  }

  public serialize(): BombSnapshot {
    return {
      id: this.id,
      cell: this.cell,
      ownerId: this.ownerId,
      strength: this.strength,
      placedAt: this.placedAt,
      fuseMs: this.fuseMs,
    };
  }
}
