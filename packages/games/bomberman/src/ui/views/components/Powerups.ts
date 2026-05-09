import { BaseRenderer } from "@arcade/canvas-renderer";
import { loadImage, drawFrame } from "@arcade/canvas-renderer";
import PowerupsUrl from "../../assets/images/powerups.png";
import { FRAME_TIME, PowerupType, TILE_SIZE } from "../../../sim/constants";
import { Tile } from "@arcade/realtime-core";

interface PowerupData {
  type: PowerupType;
  cell: Tile;
}

export interface PowerupsRenderData {
  powerups: PowerupData[];
}

const FRAME_DELAY = 8 * FRAME_TIME;

export class PowerupRenderer extends BaseRenderer {
  private static image = loadImage(PowerupsUrl);

  private renderData: PowerupsRenderData = { powerups: [] };

  public update(powerupsRenderData: PowerupsRenderData) {
    this.renderData = powerupsRenderData;
  }

  public render() {
    const { powerups } = this.renderData;
    const animationFrameIndex = Math.floor(Date.now() / FRAME_DELAY) % 2;
    powerups.forEach((powerup) =>
      this.renderPowerup(powerup, animationFrameIndex)
    );
  }

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
