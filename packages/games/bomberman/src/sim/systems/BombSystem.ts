import { GameTime, Tile } from "@arcade/realtime-core";
import { Bomb, BombSnapshot, Explosion, ExplosionSnapshot } from "../entities";
import {
  CollisionTile,
  BOMB_EXPLODE_DELAY,
  FlameDirectionLookup,
} from "../constants";
import { EmitGameEvent, FlameCell } from "../types";

export interface BombSystemSnapshot {
  bombs: BombSnapshot[];
  explosions: ExplosionSnapshot[];
}

/**
 * BombSystem manages all bomb-related activities within the game stage,
 * including bomb placement, explosion handling, and collision interactions.
 */
export class BombSystem {
  /** Array holding active Bombs and BombExplosions */
  private bombs: (Bomb | Explosion)[] = [];
  private nextId = 0;

  constructor(
    private collisionMap: CollisionTile[][],
    private onBlockDestroyed: (cell: Tile, time: GameTime) => void,
    private emit: EmitGameEvent
  ) {}

  /**
   * Adds a new Bomb to the system.
   */
  public addBomb = (
    ownerId: number,
    cell: Tile,
    strength: number,
    fuseMs: number,
    time: GameTime,
    onBombExploded: (bomb: Bomb) => void
  ) => {
    const id = this.nextId++;
    const bomb = new Bomb(id, cell, ownerId, strength, time, (b, explodedAt) => {
      onBombExploded(b);
      this.handleBombExploded(b, strength, explodedAt);
    }, fuseMs);
    this.bombs.push(bomb);
    this.collisionMap[cell.row][cell.column] = CollisionTile.BOMB;

    this.emit({
      kind: "bomb:placed",
      id,
      ownerId,
      cell,
      placedAt: bomb.placedAt,
      fuseMs: bomb.fuseMs,
      strength,
    });
  };

  /**
   * Removes a BombExplosion from the system.
   */
  private removeBombExplosion = (bombExplosion: Explosion) => {
    const index = this.bombs.indexOf(bombExplosion);
    if (index === -1) return;

    this.collisionMap[bombExplosion.cell.row][bombExplosion.cell.column] =
      CollisionTile.EMPTY;

    bombExplosion.flameCells.forEach((flameCell) => {
      this.collisionMap[flameCell.cell.row][flameCell.cell.column] =
        CollisionTile.EMPTY;
    });

    this.bombs.splice(index, 1);
  };

  private handleBombExploded(bomb: Bomb, strength: number, time: GameTime) {
    const bombIndex = this.bombs.indexOf(bomb);
    if (bombIndex === -1) return;

    const flameCells = this.calculateFlameCells(bomb.cell, strength, time);

    const explosion = new Explosion(
      bomb.id,
      bomb.cell,
      flameCells,
      time,
      this.removeBombExplosion
    );
    this.bombs[bombIndex] = explosion;

    this.collisionMap[bomb.cell.row][bomb.cell.column] = CollisionTile.FLAME;
    flameCells.forEach(
      (flameCell) =>
        (this.collisionMap[flameCell.cell.row][flameCell.cell.column] =
          CollisionTile.FLAME)
    );

    this.emit({
      kind: "bomb:exploded",
      id: explosion.id,
      cell: explosion.cell,
      flameCells: explosion.flameCells,
      startedAt: explosion.startedAt,
      durationMs: explosion.durationMs,
    });
  }

  private calculateFlameCells(
    startCell: Tile,
    length: number,
    time: GameTime
  ): FlameCell[] {
    const allFlameCells: FlameCell[] = [];

    for (const [rowOffset, columnOffset] of FlameDirectionLookup) {
      const { cells, endCell } = this.calculateFlameCellsinDirection(
        rowOffset,
        columnOffset,
        startCell,
        length
      );

      allFlameCells.push(...cells);
      this.processFlameEndResult(endCell, time);
    }

    return allFlameCells;
  }

  private calculateFlameCellsinDirection(
    rowOffset: number,
    columnOffset: number,
    startCell: Tile,
    length: number
  ) {
    const flameCells: FlameCell[] = [];
    const endCell = { ...startCell };

    for (let position = 1; position <= length; position++) {
      endCell.row += rowOffset;
      endCell.column += columnOffset;

      if (
        this.collisionMap[endCell.row][endCell.column] !== CollisionTile.EMPTY
      ) {
        break;
      }

      flameCells.push({
        cell: { ...endCell },
        isVertical: rowOffset !== 0,
        isLast: position === length,
      });
    }

    return { cells: flameCells, endCell };
  }

  private processFlameEndResult(endCell: Tile, time: GameTime) {
    const endResult = this.collisionMap[endCell.row][endCell.column];

    switch (endResult) {
      case CollisionTile.BLOCK:
        this.onBlockDestroyed(endCell, time);
        break;
      case CollisionTile.BOMB:
        this.triggerBombExplosion(endCell, time);
        break;
      default:
        break;
    }
  }

  private triggerBombExplosion(cell: Tile, time: GameTime): void {
    const bomb = this.bombs.find(
      (b) =>
        b instanceof Bomb &&
        b.cell.row === cell.row &&
        b.cell.column === cell.column
    ) as Bomb | undefined;

    if (bomb) {
      bomb.fuseExpiration = time.previous + BOMB_EXPLODE_DELAY;
    }
  }

  public update(time: GameTime) {
    this.bombs.forEach((bomb) => bomb.update(time));
  }

  /** Live explosions only — used to hydrate a resyncing client. */
  public getActiveExplosions(): ExplosionSnapshot[] {
    const out: ExplosionSnapshot[] = [];
    for (const b of this.bombs) {
      if (b instanceof Explosion) out.push(b.serialize());
    }
    return out;
  }

  public serialize(): BombSystemSnapshot {
    const bombs: BombSnapshot[] = [];
    const explosions: ExplosionSnapshot[] = [];

    for (const bomb of this.bombs) {
      if (bomb instanceof Explosion) {
        explosions.push(bomb.serialize());
      } else {
        bombs.push(bomb.serialize());
      }
    }

    return { bombs, explosions };
  }
}
