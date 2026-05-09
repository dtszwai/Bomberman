import { GameTime, Tile } from "@arcade/realtime-core";
import {
  BlockSnapshot,
  BLOCK_DESTRUCTION_DURATION_MS,
  DestructionAnimationBlock,
} from "../entities/DestructionAnimationBlock";
import {
  CollisionTile,
  MapTile,
  playerStartCoords,
  PowerupType,
} from "../constants/levelData";
import type { EmitGameEvent, StageData } from "../types";
import type { DeterministicRng } from "../utils/determinism";

interface BlockEntry {
  cell: Tile;
  entity?: DestructionAnimationBlock;
  powerup?: PowerupType;
}

export interface BlocksSnapshot {
  blocks: {
    cell: Tile;
    powerup?: PowerupType;
    entity?: BlockSnapshot;
  }[];
}

export interface BlockSystemOptions {
  mapRng: DeterministicRng;
  powerupRng: DeterministicRng;
}

export class BlockSystem {
  private blocks: BlockEntry[] = [];
  /** Cells that began life as blocks but have since been fully destroyed. */
  private destroyedCells: Tile[] = [];

  constructor(
    private updateStageMapAt: (cell: Tile, tile: MapTile) => void,
    private getStageCollisionTileAt: (cell: Tile) => CollisionTile,
    private addPowerup: (cell: Tile, type: PowerupType) => void,
    private emit: EmitGameEvent,
    private stageData: StageData,
    private options: BlockSystemOptions
  ) {
    this.initializeBlocks();
    this.assignPowerupsToBlocks();
  }

  private initializeBlocks() {
    const candidates = this.shuffle(
      this.getBlockCandidates(),
      this.options.mapRng
    );
    for (const cell of candidates.slice(0, this.stageData.maxBlocks)) {
      this.updateStageMapAt(cell, MapTile.BLOCK);
      this.blocks.push({ cell });
    }
  }

  private getBlockCandidates(): Tile[] {
    const candidates: Tile[] = [];
    for (let row = 0; row < this.stageData.tiles.length - 2; row++) {
      for (
        let column = 0;
        column < this.stageData.tiles[row].length - 2;
        column++
      ) {
        const cell = { row, column };
        if (this.isPlacementAllowed(cell)) candidates.push(cell);
      }
    }
    return candidates;
  }

  private isPlacementAllowed(cell: Tile) {
    const isInStartZone = playerStartCoords.some(
      ([startRow, startColumn]) =>
        startRow === cell.row && startColumn === cell.column
    );

    const isEmpty = this.getStageCollisionTileAt(cell) === CollisionTile.EMPTY;

    return !isInStartZone && isEmpty;
  }

  private shuffle<T>(items: readonly T[], rng: DeterministicRng): T[] {
    const shuffled = [...items];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = rng.nextInt(i + 1);
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  private assignPowerupsToBlocks(): void {
    for (const [type, amount] of Object.entries(this.stageData.powerups)) {
      const powerUpType = Number(type) as PowerupType;
      for (let i = 0; i < amount; i++) {
        const availableBlocks = this.blocks.filter((block) => !block.powerup);
        if (availableBlocks.length === 0) break;

        const randomIndex = this.options.powerupRng.nextInt(
          availableBlocks.length
        );
        availableBlocks[randomIndex].powerup = powerUpType;
      }
    }
  }

  public addBlock = (cell: Tile, time: GameTime) => {
    const blockEntry = this.blocks.find(
      (block) =>
        block.cell.row === cell.row && block.cell.column === cell.column
    );

    if (blockEntry && !blockEntry.entity) {
      blockEntry.entity = new DestructionAnimationBlock(
        cell,
        time,
        this.removeBlock
      );
      this.emit({
        kind: "block:destroyed",
        cell,
        destroyedAt: time.previous,
        durationMs: BLOCK_DESTRUCTION_DURATION_MS,
      });
    }
  };

  private spawnPowerUp(index: number): void {
    const { powerup, cell } = this.blocks[index];
    if (powerup) {
      this.addPowerup(cell, powerup);
    }
  }

  public removeBlock = (destroyedBlock: DestructionAnimationBlock) => {
    const index = this.blocks.findIndex(
      (block) =>
        block.cell.row === destroyedBlock.cell.row &&
        block.cell.column === destroyedBlock.cell.column
    );
    if (index < 0) return;

    this.updateStageMapAt(destroyedBlock.cell, MapTile.FLOOR);
    this.spawnPowerUp(index);
    this.destroyedCells.push(destroyedBlock.cell);
    this.blocks.splice(index, 1);
  };

  public update(time: GameTime) {
    this.blocks.forEach((block) => block.entity?.update(time));
  }

  public getDestroyedCells(): Tile[] {
    return this.destroyedCells.map((c) => ({ ...c }));
  }

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
