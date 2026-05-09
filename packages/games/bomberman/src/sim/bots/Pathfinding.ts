import type { Tile } from "@arcade/realtime-core";
import type { BotDifficultyConfig, BotRng } from "./BotTypes";
import type { DangerMap } from "./DangerMap";
import {
  BOT_DIRECTIONS,
  directionBetween,
  getPlayerCell,
  isPassable,
  manhattan,
  neighborForDirection,
  sameTile,
  tileKey,
  type BotWorldView,
} from "./BotWorldView";

export const TILE_TRAVEL_MS = 360;

export interface PathOptions {
  danger: DangerMap;
  now: number;
  config: BotDifficultyConfig;
  allowUnsafeGoal?: boolean;
  safeDwellMs?: number;
  stepDwellMs?: number;
}

export const findPath = (view: BotWorldView, start: Tile, goal: Tile, options: PathOptions) => findPathToAny(view, start, (cell) => sameTile(cell, goal), options);

export const findNearestSafePath = (view: BotWorldView, start: Tile, options: PathOptions) => findPathToAny(view, start, () => true, options);

export const findExplorePath = (view: BotWorldView, start: Tile, options: PathOptions & { rng: BotRng; occupiedTargets?: Set<string> }) => {
  const picked = options.rng.pick(
    collectReachableSafeCells(view, start, options)
      .filter((cell) => !options.occupiedTargets?.has(tileKey(cell)))
      .map((cell) => ({
        cell,
        score: scoreExploreCell(view, start, cell) + options.rng.next() * 0.5,
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 8)
  );
  return picked ? findPath(view, start, picked.cell, options) : undefined;
}

export function getNextDirection(path: Tile[], current: Tile) {
  const index = path.findIndex((cell) => sameTile(cell, current));
  const next = path[index >= 0 ? index + 1 : 0];
  return next ? directionBetween(current, next) : undefined;
}

function findPathToAny(
  view: BotWorldView,
  start: Tile,
  isGoal: (cell: Tile, depth: number) => boolean,
  options: PathOptions
) {
  const queue = [{ cell: start, depth: 0 }];
  const visited = new Set([tileKey(start)]);
  const previous = new Map<string, Tile>();

  while (queue.length > 0) {
    const { cell, depth } = queue.shift()!;
    const currentArrivalTime = options.now + depth * TILE_TRAVEL_MS;

    if (
      depth > 0 &&
      isGoal(cell, depth) &&
      (options.allowUnsafeGoal ||
        !options.danger.isDangerousAt(
          cell,
          currentArrivalTime,
          options.safeDwellMs ?? options.config.dangerLookaheadMs
        ))
    ) {
      return reconstructPath(previous, start, cell);
    }

    if (depth >= options.config.maxSearchDepth) continue;

    for (const direction of BOT_DIRECTIONS) {
      const next = neighborForDirection(cell, direction);
      const key = tileKey(next);
      if (visited.has(key)) continue;
      if (!isPassable(view, next, { allowStart: start })) continue;

      const nextDepth = depth + 1;
      const arrivalTime = options.now + nextDepth * TILE_TRAVEL_MS;
      if (
        !options.allowUnsafeGoal &&
        options.danger.isDangerousAt(next, arrivalTime, options.stepDwellMs ?? TILE_TRAVEL_MS)
      ) {
        continue;
      }

      visited.add(key);
      previous.set(key, cell);
      queue.push({ cell: next, depth: nextDepth });
    }
  }

  return undefined;
}

export function collectReachableSafeCells(view: BotWorldView, start: Tile, options: PathOptions) {
  const queue = [{ cell: start, depth: 0 }];
  const visited = new Set([tileKey(start)]);
  const cells: Tile[] = [];

  while (queue.length > 0) {
    const { cell, depth } = queue.shift()!;
    if (depth > 0) cells.push(cell);
    if (depth >= options.config.maxSearchDepth) continue;

    for (const direction of BOT_DIRECTIONS) {
      const next = neighborForDirection(cell, direction);
      const key = tileKey(next);
      if (visited.has(key)) continue;
      if (!isPassable(view, next, { allowStart: start })) continue;

      const nextDepth = depth + 1;
      const arrivalTime = options.now + nextDepth * TILE_TRAVEL_MS;
      if (options.danger.isDangerousAt(next, arrivalTime, options.stepDwellMs ?? TILE_TRAVEL_MS)) {
        continue;
      }

      visited.add(key);
      queue.push({ cell: next, depth: nextDepth });
    }
  }

  return cells;
}

function scoreExploreCell(view: BotWorldView, start: Tile, candidate: Tile) {
  const distance = manhattan(start, candidate);
  const nearestBlock = nearestDistance(candidate, view.blockCells);
  const nearestPowerup = nearestDistance(
    candidate,
    view.powerups.map((powerup) => powerup.cell)
  );
  const nearestPlayer = nearestDistance(candidate, view.players.map(getPlayerCell));

  return (
    Math.min(distance, 8) * 0.15 +
    (nearestBlock === undefined ? 0 : Math.max(0, 8 - nearestBlock) * 0.35) +
    (nearestPowerup === undefined ? 0 : Math.max(0, 10 - nearestPowerup) * 0.8) +
    (nearestPlayer === undefined ? 0 : Math.max(0, 8 - nearestPlayer) * 0.25) +
    getLocalSpaceScore(view, candidate) * 0.2
  );
}

const nearestDistance = (from: Tile, cells: Tile[]) => cells.length ? Math.min(...cells.map((cell) => manhattan(from, cell))) : undefined;

export const getPassableNeighborCount = (view: BotWorldView, cell: Tile) =>
  BOT_DIRECTIONS.filter((direction) =>
    isPassable(view, neighborForDirection(cell, direction), { allowStart: cell })
  ).length;

const getLocalSpaceScore = (view: BotWorldView, cell: Tile) =>
  Math.min(getPassableNeighborCount(view, cell), 4);

function reconstructPath(previous: Map<string, Tile>, start: Tile, goal: Tile) {
  const path = [goal];
  let current = goal;

  while (!sameTile(current, start)) {
    const prev = previous.get(tileKey(current));
    if (!prev) break;
    path.push(prev);
    current = prev;
  }

  return path.reverse();
}
