import { GameTime, Tile } from "@arcade/realtime-core";
import { BLOCK_FRAME_DELAY } from "../constants";

const TOTAL_FRAMES = 8;
export const BLOCK_DESTRUCTION_DURATION_MS = TOTAL_FRAMES * BLOCK_FRAME_DELAY;

export interface BlockSnapshot {
  cell: Tile;
  destroyedAt: number;
  durationMs: number;
}

/**
 * Class representing a destroyed block in the game.
 * Instantiated when a regular block is destroyed by a bomb.
 * Client derives the destruction sprite frame from {destroyedAt, durationMs}.
 */
export class DestructionAnimationBlock {
  public readonly destroyedAt: number;
  public readonly durationMs: number = BLOCK_DESTRUCTION_DURATION_MS;

  constructor(
    public readonly cell: Tile,
    time: GameTime,
    private onDestructionComplete: (block: DestructionAnimationBlock) => void
  ) {
    this.destroyedAt = time.previous;
  }

  public update(time: GameTime) {
    if (time.previous - this.destroyedAt >= this.durationMs) {
      this.onDestructionComplete(this);
    }
  }

  public serialize(): BlockSnapshot {
    return {
      cell: this.cell,
      destroyedAt: this.destroyedAt,
      durationMs: this.durationMs,
    };
  }
}
