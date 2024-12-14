import {
  CollisionTile,
  MapTile,
  MapToCollisionTileLookup,
  stageData,
} from "@/game/constants/levelData";
import { drawTile } from "@/engine/context";
import { TILE_SIZE } from "@/game/constants/game";
import { Camera } from "@/engine";
import StageUrl from "@assets/images/stage.png";
import { Context2D, Tile } from "@/engine/types";
import { loadImage } from "../utils/utils";

/**
 * Class representing the game stage.
 * Manages the tile map, collision map, and rendering of the stage.
 */
export class Stage {
  /** 2D array representing the type of each tile on the stage */
  private tileMap: MapTile[][] = stageData.tiles.map((row) => [...row]);
  /** 2D array representing collision data for each tile on the stage */
  public collisionMap: CollisionTile[][] = stageData.tiles.map((row) =>
    row.map((tile) => MapToCollisionTileLookup[tile])
  );
  /** Image asset containing all stage tiles */
  private static image = loadImage(StageUrl);

  /**
   * Creates an instance of Stage.
   * Initializes the offscreen canvas and begins building the stage map once the image is loaded.
   *
   * @throws Will throw an error if the offscreen canvas context cannot be retrieved.
   */
  constructor() {
    if (Stage.image.complete) {
      this.initializeStageMap();
    } else {
      Stage.image.onload = () => {
        this.initializeStageMap();
      };
    }
  }

  /**
   * Initializes the stage map by rendering each tile onto the offscreen canvas.
   * Called once the stage image has fully loaded.
   */
  private initializeStageMap() {
    for (let rowIndex = 0; rowIndex < this.tileMap.length; rowIndex++) {
      for (
        let columnIndex = 0;
        columnIndex < this.tileMap[rowIndex].length;
        columnIndex++
      ) {
        const tile = this.tileMap[rowIndex][columnIndex];
        this.updateMapAt({ row: rowIndex, column: columnIndex }, tile);
      }
    }
  }

  /**
   * Retrieves the collision tile type at a specific cell.
   *
   * @param cell - The tile position to query.
   * @returns The collision tile type, or CollisionTile.EMPTY if out of bounds.
   */
  public getCollisionTileAt = (cell: Tile): CollisionTile =>
    this.collisionMap[cell.row][cell.column] ?? CollisionTile.EMPTY;

  /**
   * Updates the tile map and collision map at a specific cell,
   * and renders the corresponding tile onto the offscreen canvas.
   *
   * @param cell - The tile position to update.
   * @param tileType - The new type of the tile.
   */
  public updateMapAt = (cell: Tile, tileType: MapTile) => {
    const { row, column } = cell;
    this.tileMap[row][column] = tileType;
    this.collisionMap[row][column] = MapToCollisionTileLookup[tileType];
  };

  /**
   * Renders the pre-rendered stage onto the main canvas context,
   * adjusted by the camera's position.
   */
  public draw(context: Context2D, camera: Camera) {
    for (let row = 0; row < this.tileMap.length; row++) {
      for (let col = 0; col < this.tileMap[row].length; col++) {
        const tileType = this.tileMap[row][col];
        const x = col * TILE_SIZE - camera.position.x;
        const y = row * TILE_SIZE - camera.position.y;

        drawTile(context, Stage.image, tileType, x, y, TILE_SIZE);
      }
    }
  }

  /**
   * Serializes the current state of the stage.
   *
   * @returns The serialized stage state.
   */
  public serialize() {
    return {
      tileMap: this.tileMap,
      collisionMap: this.collisionMap,
    };
  }
}
