import { Camera } from "@/engine";
import { GameTime, Tile } from "@/engine/types";
import { drawTile } from "@/engine/context";
import StageUrl from "@assets/images/stage.png";
import { TILE_SIZE } from "../constants/game";
import { MapTile } from "../constants/levelData";
import { loadImage } from "../utils/utils";
import { BLOCK_FRAME_DELAY } from "../constants/bombs";

const TOTAL_FRAMES = 8;

/**
 * Class representing a destructible block in the game.
 * This block is instantiated when a regular block is destroyed by a bomb,
 * triggering a destruction animation before being removed from the game.
 */
export class DestructibleBlock {
  /** Image asset for block sprites */
  private static image = loadImage(StageUrl);
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
    private onDestructionComplete: (block: DestructibleBlock) => void
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
   * Draws the destructible block's current animation frame onto the canvas.
   */
  public draw(context: CanvasRenderingContext2D, camera: Camera) {
    drawTile(
      context,
      DestructibleBlock.image,
      this.animationFrameIndex,
      this.cell.column * TILE_SIZE - camera.position.x,
      this.cell.row * TILE_SIZE - camera.position.y,
      TILE_SIZE
    );
  }
}
