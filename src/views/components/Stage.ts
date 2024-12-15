import { BaseRenderer } from "../BaseRenderer";
import { loadImage, drawTile } from "../utils";
import StageUrl from "@assets/images/stage.png";
import { MapTile, stageData, TILE_SIZE } from "@/game/constants";

export type StageRenderData = MapTile[][];

/**
 * Renderer class for handling the game stage rendering.
 */
export class StageRenderer extends BaseRenderer {
  private static image = loadImage(StageUrl);
  /**
   * Current tile map representing the stage layout.
   */
  private tileMap: MapTile[][] = stageData.tiles.map((row) => [...row]);

  public update(tileMap: MapTile[][]) {
    this.tileMap = tileMap;
  }

  public render() {
    for (let row = 0; row < this.tileMap.length; row++) {
      for (let col = 0; col < this.tileMap[row].length; col++) {
        const tileType = this.tileMap[row][col];
        const x = col * TILE_SIZE - this.camera.position.x;
        const y = row * TILE_SIZE - this.camera.position.y;

        drawTile(this.context, StageRenderer.image, tileType, x, y, TILE_SIZE);
      }
    }
  }
}
