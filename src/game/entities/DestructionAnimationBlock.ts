import { GameTime, Tile } from "../engine/types";
import { BLOCK_FRAME_DELAY, MapTile } from "../constants";

export interface BlockSnapshot {
  cell: Tile;
  animationFrameIndex: MapTile;
}

const TOTAL_FRAMES = 8;

/**
 * Class representing a destroyed block in the game.
 * This block is instantiated when a regular block is destroyed by a bomb,
 * triggering a destruction animation before being removed from the game.
 */
export class DestructionAnimationBlock {
  /** Current frame index for the destruction animation */
  private animationFrameIndex = MapTile.BLOCK;
  /** Timestamp for the next frame update */
  private nextAnimationUpdate = 0;

  /**
   * Creates an instance of DestructibleBlock.
   *
   * @param cell - The tile position where the block is located.
   * @param onDestructionComplete - Callback invoked when the destruction animation finishes.
   */
  constructor(
    public readonly cell: Tile,
    private onDestructionComplete: (block: DestructionAnimationBlock) => void
  ) {}

  /**
   * Updates the block's destruction animation based on the current game time.
   */
  private updateAnimation(time: GameTime) {
    if (time.previous < this.nextAnimationUpdate) return;

    this.animationFrameIndex += 1;
    this.nextAnimationUpdate = time.previous + BLOCK_FRAME_DELAY;

    // Check if the animation has reached its final frame
    if (this.animationFrameIndex >= MapTile.BLOCK + TOTAL_FRAMES) {
      this.onDestructionComplete(this);
    }
  }

  /**
   * Updates the block's state, managing the destruction animation.
   */
  public update(time: GameTime) {
    this.updateAnimation(time);
  }

  /**
   * Serializes the destructible block's current state.
   */
  public serialize(): BlockSnapshot {
    return {
      cell: this.cell,
      animationFrameIndex: this.animationFrameIndex,
    };
  }
}
