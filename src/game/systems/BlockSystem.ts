import { GameTime, Tile } from "../engine/types";
import {
  BlockSnapshot,
  DestructionAnimationBlock,
} from "../entities/DestructionAnimationBlock";
import {
  CollisionTile,
  MapTile,
  playerStartCoords,
  PowerupType,
  stageData,
} from "../constants/levelData";

/**
 * Represents a block entry within the BlockSystem.
 */
interface BlockEntry {
  /** The tile coordinates of the block. */
  cell: Tile;
  /** The Block entity associated with this block, if any. */
  entity?: DestructionAnimationBlock;
  /** The type of power-up contained in this block, if any. */
  powerup?: PowerupType;
}

export interface BlocksSnapshot {
  blocks: {
    cell: Tile;
    powerup?: PowerupType;
    entity?: BlockSnapshot;
  }[];
}

/**
 * The BlockSystem class manages blocks within the game stage, including their placement,
 * associated entities, and power-ups.
 */
export class BlockSystem {
  /** Array of blocks managed by the BlockSystem. */
  private blocks: BlockEntry[] = [];

  /**
   * Creates an instance of BlockSystem.
   *
   * @param updateStageMapAt - Function to update the stage matrix at a specific cell.
   * @param getStageCollisionTileAt - Function to retrieve the collision tile at a specific cell.
   * @param addPowerup - Function to add a power-up to a specific cell.
   */
  constructor(
    private updateStageMapAt: (cell: Tile, tile: MapTile) => void,
    private getStageCollisionTileAt: (cell: Tile) => CollisionTile,
    private addPowerup: (cell: Tile, type: PowerupType) => void
  ) {
    this.initializeBlocks();
    this.assignPowerupsToBlocks();
  }

  /**
   * Initializes blocks by adding them to the stage until the maximum limit is reached.
   */
  private initializeBlocks() {
    while (this.blocks.length < stageData.maxBlocks) {
      const cell = this.generateRandomCell();
      if (!this.isPlacementAllowed(cell)) continue;

      this.updateStageMapAt(cell, MapTile.BLOCK);
      this.blocks.push({ cell });
    }
  }

  /**
   * Generates a random cell within the stage boundaries, excluding the outer walls.
   *
   * @returns A randomly generated tile cell.
   */
  private generateRandomCell(): Tile {
    const row = Math.floor(Math.random() * (stageData.tiles.length - 2));
    const column = Math.floor(Math.random() * (stageData.tiles[0].length - 2));
    return { row, column };
  }

  /**
   * Checks if placing a block at the specified cell is allowed.
   *
   * @param cell - The tile cell to check.
   * @returns `true` if placement is allowed; otherwise, `false`.
   */
  private isPlacementAllowed(cell: Tile) {
    const isInStartZone = playerStartCoords.some(
      ([startRow, startColumn]) =>
        startRow === cell.row && startColumn === cell.column
    );

    const isEmpty = this.getStageCollisionTileAt(cell) === CollisionTile.EMPTY;

    return !isInStartZone && isEmpty;
  }

  /**
   * Assigns random power-ups to blocks based on the stage data.
   */
  private assignPowerupsToBlocks(): void {
    for (const [type, amount] of Object.entries(stageData.powerups)) {
      const powerUpType = Number(type) as PowerupType;
      for (let i = 0; i < amount; i++) {
        const availableBlocks = this.blocks.filter((block) => !block.powerup);
        if (availableBlocks.length === 0) break;

        const randomIndex = Math.floor(Math.random() * availableBlocks.length);
        availableBlocks[randomIndex].powerup = powerUpType;
      }
    }
  }

  /**
   * Adds a new Block entity to a specified cell.
   *
   * @param cell - The tile cell where the block is to be added.
   */
  public addBlock = (cell: Tile) => {
    const blockEntry = this.blocks.find(
      (block) =>
        block.cell.row === cell.row && block.cell.column === cell.column
    );

    if (blockEntry && !blockEntry.entity) {
      blockEntry.entity = new DestructionAnimationBlock(cell, this.removeBlock);
    }
  };

  /**
   * Handles the spawning of a power-up when a block is removed.
   *
   * @param index - The index of the block in the blocks array.
   */
  private spawnPowerUp(index: number): void {
    const { powerup, cell } = this.blocks[index];
    if (powerup) {
      this.addPowerup(cell, powerup);
    }
  }

  /**
   * Removes a Block entity from the system.
   *
   * @param destroyedBlock - The Block entity to be removed.
   */
  public removeBlock = (destroyedBlock: DestructionAnimationBlock) => {
    const index = this.blocks.findIndex(
      (block) =>
        block.cell.row === destroyedBlock.cell.row &&
        block.cell.column === destroyedBlock.cell.column
    );
    if (index < 0) return;

    this.updateStageMapAt(destroyedBlock.cell, MapTile.FLOOR);
    this.spawnPowerUp(index);
    this.blocks.splice(index, 1);
  };

  /**
   * Updates all active Block entities.
   */
  public update(time: GameTime) {
    this.blocks.forEach((block) => block.entity?.update(time));
  }

  /**
   * Serializes the current state of all active Block entities.
   */
  public serialize(): BlocksSnapshot {
    return {
      blocks: this.blocks.map((block) => ({
        cell: block.cell,
        powerup: block.powerup,
        entity: block.entity?.serialize(),
      })),
    };
  }
}
