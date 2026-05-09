import { BaseRenderer } from "@arcade/canvas-renderer";
import { loadImage, drawTile } from "@arcade/canvas-renderer";
import StageUrl from "../../assets/images/stage.png";
import {
  BASE_FRAME,
  BOMB_ANIMATION_SEQUENCE,
  BOMB_FRAME_DELAY,
  TILE_SIZE,
} from "../../../sim/constants";
import { Tile } from "@arcade/realtime-core";

export interface BombRenderData {
  cell: Tile;
  placedAt: number;
}

export class BombRenderer extends BaseRenderer {
  private static image = loadImage(StageUrl);

  private bombs: BombRenderData[] = [];

  public update(bombs: BombRenderData[]) {
    this.bombs = bombs;
  }

  public render() {
    this.bombs.forEach(this.renderBomb);
  }

  private renderBomb = (bomb: BombRenderData) => {
    const { cell, placedAt } = bomb;

    const drawX = cell.column * TILE_SIZE - this.camera.position.x;
    const drawY = cell.row * TILE_SIZE - this.camera.position.y;

    const elapsed = Math.max(0, Date.now() - placedAt);
    const frameIndex =
      Math.floor(elapsed / BOMB_FRAME_DELAY) % BOMB_ANIMATION_SEQUENCE.length;
    const bombFrame = BASE_FRAME + BOMB_ANIMATION_SEQUENCE[frameIndex];

    drawTile(
      this.context,
      BombRenderer.image,
      bombFrame,
      drawX,
      drawY,
      TILE_SIZE
    );
  };
}
