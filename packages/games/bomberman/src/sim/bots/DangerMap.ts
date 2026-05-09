import type { Tile } from "@arcade/realtime-core";
import {
  BOMB_EXPLODE_DELAY,
  CollisionTile,
  FlameDirectionLookup,
  FUSE_TIMER,
} from "../constants";
import { EXPLOSION_DURATION_MS } from "../entities/Explosion";
import type { BotWorldView } from "./BotWorldView";
import { getCollision, isInside, sameTile, tileKey } from "./BotWorldView";

export interface DangerInterval {
  start: number;
  end: number;
}

export interface HypotheticalBomb {
  cell: Tile;
  placedAt: number;
  fuseMs?: number;
  strength: number;
}

const stopsBlast = (collision: CollisionTile) =>
  collision === CollisionTile.WALL ||
  collision === CollisionTile.BLOCK ||
  collision === CollisionTile.BOMB;

export class DangerMap {
  private intervals = new Map<string, DangerInterval[]>();

  public add(cell: Tile, interval: DangerInterval) {
    const key = tileKey(cell);
    const intervals = this.intervals.get(key) ?? [];
    intervals.push(interval);
    this.intervals.set(key, intervals);
  }

  public isDangerousAt(cell: Tile, at: number, lingerMs = 180) {
    const intervals = this.intervals.get(tileKey(cell));
    if (!intervals) return false;

    return intervals.some(
      (interval) => at <= interval.end && at + lingerMs >= interval.start
    );
  }

  public isDangerousSoon(cell: Tile, now: number, lookaheadMs: number) {
    return this.isDangerousAt(cell, now, lookaheadMs);
  }
}

export function createDangerMap(view: BotWorldView, hypotheticalBombs: HypotheticalBomb[] = []) {
  const danger = new DangerMap();

  for (const explosion of view.explosions) {
    const interval = {
      start: explosion.startedAt,
      end: explosion.startedAt + explosion.durationMs,
    };
    danger.add(explosion.cell, interval);
    for (const flameCell of explosion.flameCells) {
      danger.add(flameCell.cell, interval);
    }
  }

  const bombs = [
    ...view.bombs.map((bomb) => ({
      id: `live:${bomb.id}`,
      cell: bomb.cell,
      strength: bomb.strength,
      detonationTime: bomb.placedAt + bomb.fuseMs,
    })),
    ...hypotheticalBombs.map((bomb, index) => ({
      id: `hypothetical:${index}`,
      cell: bomb.cell,
      strength: bomb.strength,
      detonationTime: bomb.placedAt + (bomb.fuseMs ?? FUSE_TIMER),
    })),
  ];

  const detonationTimes = computeChainDetonations(view, bombs);

  for (const bomb of bombs) {
    const detonationTime = detonationTimes.get(bomb.id) ?? bomb.detonationTime;
    addBombDanger(view, danger, {
      cell: bomb.cell,
      strength: bomb.strength,
      start: detonationTime,
      end: detonationTime + EXPLOSION_DURATION_MS + BOMB_EXPLODE_DELAY,
    });
  }

  return danger;
}

function computeChainDetonations(
  view: BotWorldView,
  bombs: {
    id: string;
    cell: Tile;
    strength: number;
    detonationTime: number;
  }[]
) {
  const detonationTimes = new Map(
    bombs.map((bomb) => [bomb.id, bomb.detonationTime])
  );
  let changed = true;

  while (changed) {
    changed = false;

    for (const bomb of bombs) {
      const bombTime = detonationTimes.get(bomb.id) ?? bomb.detonationTime;
      const blastCells = getBlastCells(view, bomb.cell, bomb.strength);

      for (const other of bombs) {
        if (other.id === bomb.id) continue;
        const otherTime =
          detonationTimes.get(other.id) ?? other.detonationTime;
        if (bombTime < otherTime && blastCells.some((cell) => sameTile(cell, other.cell))) {
          detonationTimes.set(other.id, bombTime);
          changed = true;
        }
      }
    }
  }

  return detonationTimes;
}

function getBlastCells(
  view: BotWorldView,
  start: Tile,
  strength: number
) {
  const cells = [start];

  for (const [rowOffset, columnOffset] of FlameDirectionLookup) {
    for (let distance = 1; distance <= strength; distance++) {
      const cell = {
        row: start.row + rowOffset * distance,
        column: start.column + columnOffset * distance,
      };
      if (!isInside(view, cell)) break;

      cells.push(cell);

      const collision = getCollision(view, cell);
      if (stopsBlast(collision)) break;
    }
  }

  return cells;
}

function addBombDanger(
  view: BotWorldView,
  danger: DangerMap,
  bomb: { cell: Tile; strength: number; start: number; end: number }
) {
  const interval = { start: bomb.start, end: bomb.end };
  for (const cell of getBlastCells(view, bomb.cell, bomb.strength)) {
    danger.add(cell, interval);
  }
}
