import {
  EPLOSION_FRAME_DELAY,
  EXPLOSION_ANIMATION_SEQUENCE,
} from "../constants/bombs";
import { GameTime, Tile } from "@/engine/types";
import { FlameCell } from "../types";

/**
 * Class representing a bomb explosion in the game.
 * Manages the explosion animation and lifecycle.
 */
export class BombExplosion {
  /** Current frame index for the explosion animation */
  private animationFrameIndex = 0;
  /** Timestamp for scheduling the next frame update */
  private nextAnimationUpdate = 0;

  /**
   * Creates an instance of BombExplosion.
   *
   * @param cell - The tile position of the bomb explosion.
   * @param flameCells - Array of flame cells associated with the explosion.
   * @param onExplosionComplete - Callback invoked when the explosion animation completes.
   */
  constructor(
    public cell: Tile,
    public flameCells: FlameCell[],
    private onExplosionComplete: (explosion: BombExplosion) => void
  ) {}

  /**
   * Updates the explosion animation based on the current game time.
   */
  private updateAnimation(time: GameTime) {
    if (time.previous < this.nextAnimationUpdate) return;
    this.animationFrameIndex += 1;
    this.nextAnimationUpdate = time.previous + EPLOSION_FRAME_DELAY;
    if (this.animationFrameIndex >= EXPLOSION_ANIMATION_SEQUENCE.length) {
      this.animationFrameIndex = 0;
      this.onExplosionComplete(this);
    }
  }

  /**
   * Updates the explosion state.
   */
  public update(time: GameTime) {
    this.updateAnimation(time);
  }

  /**
   * Serializes the bomb explosion's current state.
   */
  public serialize() {
    return {
      cell: this.cell,
      animationFrameIndex: this.animationFrameIndex,
      nextAnimationUpdate: this.nextAnimationUpdate,
      flameCells: this.flameCells,
    };
  }
}
