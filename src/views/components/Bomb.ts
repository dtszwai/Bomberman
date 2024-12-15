import { BaseRenderer } from "../BaseRenderer";
import { loadImage, drawTile } from "../utils";
import StageUrl from "@assets/images/stage.png";
import {
  BASE_FRAME,
  BOMB_ANIMATION_SEQUENCE,
  TILE_SIZE,
} from "@/game/constants";
import { Tile } from "@/game/engine/types";

export interface BombRenderData {
  cell: Tile;
  animationFrameIndex: number;
}

export class BombRenderer extends BaseRenderer {
  private static image = loadImage(StageUrl);

  // Array to hold the current state of all bombs
  private bombs: BombRenderData[] = [];

  public update(bombs: BombRenderData[]) {
    this.bombs = bombs;
  }

  public render() {
    this.bombs.forEach(this.renderBomb);
  }

  /**
   * Renders a single bomb.
   * @param bomb The bomb data to render.
   */
  private renderBomb = (bomb: BombRenderData) => {
    const { cell, animationFrameIndex } = bomb;

    // Calculate the bomb's position relative to the camera
    const drawX = cell.column * TILE_SIZE - this.camera.position.x;
    const drawY = cell.row * TILE_SIZE - this.camera.position.y;

    // Determine the frame for the bomb animation
    const bombFrame = BASE_FRAME + BOMB_ANIMATION_SEQUENCE[animationFrameIndex];

    // Draw the bomb tile
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
