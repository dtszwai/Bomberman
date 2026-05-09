import { BaseRenderer } from "@arcade/canvas-renderer";
import { loadImage, drawTile } from "@arcade/canvas-renderer";
import StageUrl from "../../assets/images/stage.png";
import {
  BASE_FRAME,
  BombFrames,
  EPLOSION_FRAME_DELAY,
  EXPLOSION_ANIMATION_SEQUENCE,
  FLAME_ANIMATION_SEQUENCE,
  TILE_SIZE,
} from "../../../sim/constants";
import { FlameCell } from "../../../sim/types";
import { Tile } from "@arcade/realtime-core";

export interface ExplosionRenderData {
  cell: Tile;
  startedAt: number;
  flameCells: FlameCell[];
}

/**
 * Renderer class for handling bomb explosions and their flames.
 * Animation frame derived from elapsed time since `startedAt`.
 */
export class ExplosionRenderer extends BaseRenderer {
  private static image = loadImage(StageUrl);
  private bombExplosions: ExplosionRenderData[] = [];

  public update(explosions: ExplosionRenderData[]) {
    this.bombExplosions = explosions;
  }

  public render() {
    this.bombExplosions.forEach(this.renderExplosion);
  }

  private resolveFrameIndex(startedAt: number) {
    const elapsed = Math.max(0, Date.now() - startedAt);
    const step = Math.floor(elapsed / EPLOSION_FRAME_DELAY);
    return Math.min(step, EXPLOSION_ANIMATION_SEQUENCE.length - 1);
  }

  private renderExplosion = (explosion: ExplosionRenderData) => {
    const { cell, flameCells, startedAt } = explosion;

    const drawX = cell.column * TILE_SIZE - this.camera.position.x;
    const drawY = cell.row * TILE_SIZE - this.camera.position.y;

    const frameIndex = this.resolveFrameIndex(startedAt);
    const explosionFrame = BASE_FRAME + EXPLOSION_ANIMATION_SEQUENCE[frameIndex];

    drawTile(
      this.context,
      ExplosionRenderer.image,
      explosionFrame,
      drawX,
      drawY,
      TILE_SIZE
    );

    flameCells.forEach((flameCell) =>
      this.renderFlame(flameCell, explosion, frameIndex)
    );
  };

  private renderFlame = (
    flameCell: FlameCell,
    explosion: ExplosionRenderData,
    frameIndex: number
  ) => {
    const baseFrame = this.determineFlameBaseFrame(flameCell, explosion);
    const flameFrame = baseFrame + FLAME_ANIMATION_SEQUENCE[frameIndex];

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
