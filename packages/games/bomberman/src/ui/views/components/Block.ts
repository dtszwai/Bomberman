import { BaseRenderer } from "@arcade/canvas-renderer";
import { loadImage, drawTile } from "@arcade/canvas-renderer";
import StageUrl from "../../assets/images/stage.png";
import { BLOCK_FRAME_DELAY, MapTile, TILE_SIZE } from "../../../sim/constants";
import { Tile } from "@arcade/realtime-core";

const TOTAL_FRAMES = 8;

export interface BlockRenderData {
  cell: Tile;
  destroyedAt: number;
}

export class BlockRenderer extends BaseRenderer {
  private static image = loadImage(StageUrl);

  private blocks: BlockRenderData[] = [];

  public update(blocks: BlockRenderData[]) {
    this.blocks = blocks;
  }

  public render() {
    this.blocks.forEach(this.renderBlock);
  }

  private renderBlock = (block: BlockRenderData) => {
    const { cell, destroyedAt } = block;

    const drawX = cell.column * TILE_SIZE - this.camera.position.x;
    const drawY = cell.row * TILE_SIZE - this.camera.position.y;

    const elapsed = Math.max(0, Date.now() - destroyedAt);
    const step = Math.min(
      Math.floor(elapsed / BLOCK_FRAME_DELAY),
      TOTAL_FRAMES - 1
    );
    const frameTile: MapTile = MapTile.BLOCK + step;

    drawTile(
      this.context,
      BlockRenderer.image,
      frameTile,
      drawX,
      drawY,
      TILE_SIZE
    );
  };
}
