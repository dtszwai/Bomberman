import { GameTime, Tile } from "../engine/types";
import { Bomb, Explosion } from "../entities";
import {
  CollisionTile,
  BOMB_EXPLODE_DELAY,
  FlameDirectionLookup,
} from "../constants";
import { FlameCell } from "../types";

/**
 * BombSystem manages all bomb-related activities within the game stage,
 * including bomb placement, explosion handling, and collision interactions.
 */
export class BombSystem {
  /** Array holding active Bombs and BombExplosions */
  private bombs: (Bomb | Explosion)[] = [];

  /**
   * Creates an instance of BombSystem.
   *
   * @param collisionMap - Initial collision map of the stage.
   * @param onBlockDestroyed - Callback invoked when a block is destroyed by a bomb.
   */
  constructor(
    private collisionMap: CollisionTile[][],
    private onBlockDestroyed: (cell: Tile) => void
  ) {}

  /**
   * Adds a new Bomb to the system.
   *
   * @param cell - The tile where the bomb is placed.
   * @param strength - The strength of the bomb's explosion.
   * @param time - The current game time.
   * @param onBombExploded - Callback invoked when the bomb explodes.
   */
  public addBomb = (
    cell: Tile,
    strength: number,
    time: GameTime,
    onBombExploded: (bomb: Bomb) => void
  ) => {
    this.bombs.push(
      new Bomb(cell, time, (bomb) => {
        onBombExploded(bomb);
        this.handleBombExploded(bomb, strength, time);
      })
    );

    this.collisionMap[cell.row][cell.column] = CollisionTile.BOMB;
  };

  /**
   * Removes a BombExplosion from the system.
   *
   * @param bombExplosion - The BombExplosion to be removed.
   */
  private removeBombExplosion(bombExplosion: Explosion) {
    const index = this.bombs.indexOf(bombExplosion);
    if (index === -1) return;

    // Clear the collision state of the explosion center
    this.collisionMap[bombExplosion.cell.row][bombExplosion.cell.column] =
      CollisionTile.EMPTY;

    // Clear the collision state of all flame cells
    bombExplosion.flameCells.forEach((flameCell) => {
      this.collisionMap[flameCell.cell.row][flameCell.cell.column] =
        CollisionTile.EMPTY;
    });

    this.bombs.splice(index, 1);
  }

  /**
   * Handles the explosion of a bomb by creating a BombExplosion entity
   * and updating the collision map accordingly.
   *
   * @param bomb - The bomb that has exploded.
   * @param strength - The strength of the explosion.
   * @param time - The current game time.
   */
  private handleBombExploded(bomb: Bomb, strength: number, time: GameTime) {
    const bombIndex = this.bombs.indexOf(bomb);
    if (bombIndex === -1) return;

    const flameCells = this.calculateFlameCells(bomb.cell, strength, time);

    // Replace the Bomb with BombExplosion in the bombs array
    this.bombs[bombIndex] = new Explosion(
      bomb.cell,
      flameCells,
      this.removeBombExplosion.bind(this)
    );

    // Update collision map for the explosion center
    this.collisionMap[bomb.cell.row][bomb.cell.column] = CollisionTile.FLAME;

    // Update collision map for all flame cells
    flameCells.forEach(
      (flameCell) =>
        (this.collisionMap[flameCell.cell.row][flameCell.cell.column] =
          CollisionTile.FLAME)
    );
  }

  /**
   * Calculates all flame cells resulting from a bomb explosion in all directions.
   *
   * @param startCell - The starting cell where the bomb exploded.
   * @param strength - The range of the explosion.
   * @param time - The current game time.
   * @returns An array of FlameCells affected by the explosion.
   */
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

  /**
   * Calculates flame cells in a specific direction until the explosion strength is reached
   * or an obstruction is encountered.
   *
   * @param rowOffset - Row direction offset.
   * @param columnOffset - Column direction offset.
   * @param startCell - The starting cell of the explosion.
   * @param length - The range of the explosion.
   * @returns An object containing the flame cells and the end cell in the direction.
   */
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

  /**
   * Processes the end result of a flame reaching its final cell,
   * such as destroying blocks or triggering other bombs.
   *
   * @param endCell - The cell where the flame ends.
   * @param time - The current game time.
   */
  private processFlameEndResult(endCell: Tile, time: GameTime) {
    const endResult = this.collisionMap[endCell.row][endCell.column];

    switch (endResult) {
      case CollisionTile.BLOCK:
        this.onBlockDestroyed(endCell);
        break;
      case CollisionTile.BOMB:
        this.triggerBombExplosion(endCell, time);
        break;
      default:
        // No action needed for other collision types
        break;
    }
  }

  /**
   * Triggers the explosion of a bomb located at the specified cell.
   *
   * @param cell - The cell where the bomb is located.
   * @param time - The current game time.
   */
  private triggerBombExplosion(cell: Tile, time: GameTime): void {
    const bomb = this.bombs.find(
      (b) =>
        b instanceof Bomb &&
        b.cell.row === cell.row &&
        b.cell.column === cell.column
    ) as Bomb | undefined;

    if (bomb) {
      // Reset the fuse timer to trigger immediate explosion
      bomb.fuseExpiration = time.previous + BOMB_EXPLODE_DELAY;
    }
  }

  /**
   * Updates all active bombs and bomb explosions.
   */
  public update(time: GameTime) {
    this.bombs.forEach((bomb) => bomb.update(time));
  }

  /**
   * Serializes the current state of all active bombs
   * and bomb explosions in the system.
   */
  public serialize() {
    const bombs = [];
    const bombExplosions = [];

    for (const bomb of this.bombs) {
      const serialized = bomb.serialize();
      if ("fuseExpiration" in serialized) {
        bombs.push(serialized);
      } else if ("flameCells" in serialized) {
        bombExplosions.push(serialized);
      }
    }

    return { bombs, bombExplosions };
  }
}
