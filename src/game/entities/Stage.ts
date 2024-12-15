import {
  CollisionTile,
  MapTile,
  MapToCollisionTileLookup,
  stageData,
} from "@/game/constants/levelData";
import { Tile } from "@/engine/types";

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

  /**
   * Creates an instance of Stage and initializes the stage map.
   */
  constructor() {
    this.initializeStageMap();
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
