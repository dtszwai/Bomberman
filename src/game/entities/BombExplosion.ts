import StageUrl from "@assets/images/stage.png";
import {
  BASE_FRAME,
  BombFrames,
  EPLOSION_FRAME_DELAY,
  EXPLOSION_ANIMATION_SEQUENCE,
  FLAME_ANIMATION_SEQUENCE,
} from "../constants/bombs";
import { GameTime, Tile } from "@/engine/types";
import { Camera } from "@/engine";
import { drawTile } from "@/engine/context";
import { TILE_SIZE } from "../constants/game";
import { loadImage } from "../utils/utils";
import { FlameCell } from "../types";

/**
 * Class representing a bomb explosion in the game.
 * Manages the explosion animation and lifecycle.
 */
export class BombExplosion {
  /** Image asset containing sprites for explosions and flames */
  private static image = loadImage(StageUrl);
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
   * Determines the base frame for a given flame cell based on its properties.
   *
   * @param flameCell - The flame cell to determine the base frame for.
   * @returns The base frame index for rendering the flame cell.
   */
  private getBaseFrame(flameCell: FlameCell) {
    const { cell, isLast, isVertical } = flameCell;

    // If the flame cell is not the last cell in the flame, use the base frame.
    if (!isLast) {
      return isVertical ? BombFrames.VERTICAL : BombFrames.HORIZONTAL;
    }

    // If the flame cell is the last cell in the flame, use the last frame.
    if (isVertical) {
      return cell.row < this.cell.row
        ? BombFrames.TOP_LAST
        : BombFrames.BOTTOM_LAST;
    }

    return cell.column < this.cell.column
      ? BombFrames.LEFT_LAST
      : BombFrames.RIGHT_LAST;
  }

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
   * Draws the bomb explosion and associated flames onto the canvas.
   */
  public draw(context: CanvasRenderingContext2D, camera: Camera) {
    // Draw main explosion
    drawTile(
      context,
      BombExplosion.image,
      BASE_FRAME + EXPLOSION_ANIMATION_SEQUENCE[this.animationFrameIndex],
      this.cell.column * TILE_SIZE - camera.position.x,
      this.cell.row * TILE_SIZE - camera.position.y,
      TILE_SIZE
    );

    // Draw flames
    for (const flameCell of this.flameCells) {
      const baseFrame = this.getBaseFrame(flameCell);

      drawTile(
        context,
        BombExplosion.image,
        baseFrame + FLAME_ANIMATION_SEQUENCE[this.animationFrameIndex],
        flameCell.cell.column * TILE_SIZE - camera.position.x,
        flameCell.cell.row * TILE_SIZE - camera.position.y,
        TILE_SIZE
      );
    }
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
