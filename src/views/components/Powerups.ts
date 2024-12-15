import { BaseRenderer } from "../BaseRenderer";
import { loadImage, drawFrame } from "../utils";
import PowerupsUrl from "@assets/images/powerups.png";
import { PowerupType, TILE_SIZE } from "@/game/constants";
import { Tile } from "@/engine/types";

interface PowerupData {
  type: PowerupType;
  cell: Tile;
}

export interface PowerupsRenderData {
  powerups: PowerupData[];
  animationFrameIndex: number;
}

export class PowerupRenderer extends BaseRenderer {
  private static image = loadImage(PowerupsUrl);

  // Current state of powerups to render
  private renderData: PowerupsRenderData = {} as PowerupsRenderData;

  public update(powerupsRenderData: PowerupsRenderData) {
    this.renderData = powerupsRenderData;
  }

  public render() {
    const { powerups, animationFrameIndex } = this.renderData;
    powerups.forEach((powerup) =>
      this.renderPowerup(powerup, animationFrameIndex)
    );
  }

  /**
   * Renders a single powerup.
   * @param powerup - The powerup data to render.
   * @param animationFrameIndex - The current animation frame index.
   */
  private renderPowerup = (
    powerup: PowerupData,
    animationFrameIndex: number
  ) => {
    const spriteX = 8 + animationFrameIndex * TILE_SIZE;
    const spriteY = 8 + (powerup.type - 1) * TILE_SIZE;

    const drawX = powerup.cell.column * TILE_SIZE - this.camera.position.x;
    const drawY = powerup.cell.row * TILE_SIZE - this.camera.position.y;

    drawFrame(
      this.context,
      PowerupRenderer.image,
      [spriteX, spriteY, TILE_SIZE, TILE_SIZE],
      drawX,
      drawY
    );
  };
}
