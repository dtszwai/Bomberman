import { BaseRenderer } from "../BaseRenderer";
import { loadImage, drawTile } from "../utils";
import StageUrl from "@assets/images/stage.png";
import {
  BASE_FRAME,
  BombFrames,
  EXPLOSION_ANIMATION_SEQUENCE,
  FLAME_ANIMATION_SEQUENCE,
  TILE_SIZE,
} from "@/game/constants";
import { FlameCell } from "@/game/types";
import { Tile } from "@/game/engine/types";

export interface ExplosionRenderData {
  cell: Tile;
  animationFrameIndex: number;
  flameCells: FlameCell[];
}

/**
 * Renderer class for handling bomb explosions and their flames.
 */
export class ExplosionRenderer extends BaseRenderer {
  private static image = loadImage(StageUrl);
  // Array to hold the current state of all bomb explosions
  private bombExplosions: ExplosionRenderData[] = [];

  public update(explosions: ExplosionRenderData[]) {
    this.bombExplosions = explosions;
  }

  public render() {
    this.bombExplosions.forEach(this.renderExplosion);
  }

  /**
   * Renders a single explosion and its flames.
   * @param explosion The explosion data to render.
   */
  private renderExplosion = (explosion: ExplosionRenderData) => {
    const { cell, animationFrameIndex, flameCells } = explosion;

    // Calculate the tile's position relative to the camera
    const drawX = cell.column * TILE_SIZE - this.camera.position.x;
    const drawY = cell.row * TILE_SIZE - this.camera.position.y;

    // Determine the frame for the explosion animation
    const explosionFrame =
      BASE_FRAME + EXPLOSION_ANIMATION_SEQUENCE[animationFrameIndex];

    drawTile(
      this.context,
      ExplosionRenderer.image,
      explosionFrame,
      drawX,
      drawY,
      TILE_SIZE
    );

    flameCells.forEach((flameCell) => this.renderFlame(flameCell, explosion));
  };

  /**
   * Renders a single flame cell.
   * @param flameCell The flame cell data to render.
   * @param explosion The parent explosion data.
   */
  private renderFlame = (
    flameCell: FlameCell,
    explosion: ExplosionRenderData
  ) => {
    // Determine the base frame based on flame cell properties
    const baseFrame = this.determineFlameBaseFrame(flameCell, explosion);

    // Determine the frame for the flame animation
    const flameFrame =
      baseFrame + FLAME_ANIMATION_SEQUENCE[explosion.animationFrameIndex];

    // Calculate the flame's position relative to the camera
    const drawX = flameCell.cell.column * TILE_SIZE - this.camera.position.x;
    const drawY = flameCell.cell.row * TILE_SIZE - this.camera.position.y;

    drawTile(
      this.context,
      ExplosionRenderer.image,
      flameFrame,
      drawX,
      drawY,
      TILE_SIZE
    );
  };

  /**
   * Determines the base frame for a flame cell based on its position and state.
   * @param flameCell The flame cell data.
   * @param explosion The parent explosion data.
   * @returns The base frame index.
   */
  private determineFlameBaseFrame(
    flameCell: FlameCell,
    explosion: ExplosionRenderData
  ) {
    const { cell, isLast, isVertical } = flameCell;

    if (!isLast) {
      return isVertical ? BombFrames.VERTICAL : BombFrames.HORIZONTAL;
    }

    if (isVertical) {
      return cell.row < explosion.cell.row
        ? BombFrames.TOP_LAST
        : BombFrames.BOTTOM_LAST;
    }

    return cell.column < explosion.cell.column
      ? BombFrames.LEFT_LAST
      : BombFrames.RIGHT_LAST;
  }
}
