import { GameTime, Tile } from "@/engine/types";
import StageUrl from "@assets/images/stage.png";
import {
  BASE_FRAME,
  BOMB_ANIMATION_SEQUENCE,
  BOMB_FRAME_DELAY,
  FUSE_TIMER,
} from "../constants/bombs";
import { Camera } from "@/engine";
import { drawTile } from "@/engine/context";
import { TILE_SIZE } from "../constants/game";
import { loadImage } from "../utils/utils";

/**
 * Class representing a bomb in the game.
 * Manages bomb animation and fuse timer.
 */
export class Bomb {
  private static image = loadImage(StageUrl);
  /** Current frame index for bomb animation */
  private animationFrameIndex = 0;
  /** Timestamp for scheduling the next animation frame update */
  private nextAnimationUpdate: number;
  /** Timestamp when the bomb's fuse expires */
  public fuseExpiration: number;

  /**
   * Creates an instance of Bomb.
   *
   * @param cell - The tile position of the bomb.
   * @param time - The current game time.
   * @param onFuseComplete - Callback invoked when the bomb's fuse expires.
   */
  constructor(
    public readonly cell: Tile,
    time: GameTime,
    private onFuseComplete: (bomb: Bomb) => void
  ) {
    this.nextAnimationUpdate = time.previous + BOMB_FRAME_DELAY;
    this.fuseExpiration = time.previous + FUSE_TIMER;
  }

  /**
   * Updates the bomb's animation based on the current game time.
   */
  private updateAnimation(time: GameTime) {
    if (time.previous < this.nextAnimationUpdate) return;

    this.animationFrameIndex =
      (this.animationFrameIndex + 1) % BOMB_ANIMATION_SEQUENCE.length;
    this.nextAnimationUpdate = time.previous + BOMB_FRAME_DELAY;
  }

  /**
   * Checks if the bomb's fuse has expired and triggers the callback if so.
   */
  private checkFuse(time: GameTime) {
    if (time.previous >= this.fuseExpiration) {
      this.onFuseComplete(this);
    }
  }

  /**
   * Updates the bomb's state, managing animation and fuse timer.
   */
  public update(time: GameTime) {
    this.updateAnimation(time);
    this.checkFuse(time);
  }

  /**
   * Draws the bomb onto the canvas.
   */
  public draw(context: CanvasRenderingContext2D, camera: Camera) {
    drawTile(
      context,
      Bomb.image,
      BASE_FRAME + BOMB_ANIMATION_SEQUENCE[this.animationFrameIndex],
      this.cell.column * TILE_SIZE - camera.position.x,
      this.cell.row * TILE_SIZE - camera.position.y,
      TILE_SIZE
    );
  }
}
