import { BaseRenderer } from "../BaseRenderer";
import { loadImage, drawTile } from "../utils";
import StageUrl from "@assets/images/stage.png";
import { MapTile, TILE_SIZE } from "@/game/constants";
import { Tile } from "@/engine/types";

export interface BlockRenderData {
  cell: Tile;
  animationFrameIndex: MapTile;
}

export class BlockRenderer extends BaseRenderer {
  private static image = loadImage(StageUrl);

  // Array to hold the current state of all blocks
  private blocks: BlockRenderData[] = [];

  public update(blocks: BlockRenderData[]) {
    this.blocks = blocks;
  }

  public render() {
    this.blocks.forEach(this.renderBlock);
  }

  /**
   * Renders a single block.
   * @param block The block data to render.
   */
  private renderBlock = (block: BlockRenderData) => {
    const { cell, animationFrameIndex } = block;

    // Calculate the block's position relative to the camera
    const drawX = cell.column * TILE_SIZE - this.camera.position.x;
    const drawY = cell.row * TILE_SIZE - this.camera.position.y;

    // Draw the block tile
    drawTile(
      this.context,
      BlockRenderer.image,
      animationFrameIndex,
      drawX,
      drawY,
      TILE_SIZE
    );
  };
}
