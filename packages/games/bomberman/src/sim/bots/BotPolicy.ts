import type { Tile } from "@arcade/realtime-core";
import {
  BOMB_EXPLODE_DELAY,
  CollisionTile,
  Direction,
  FUSE_TIMER,
} from "../constants";
import { EXPLOSION_DURATION_MS } from "../entities/Explosion";
import {
  BOT_DIRECTIONS,
  getCollision,
  getPlayerCell,
  isInside,
  manhattan,
  neighborForDirection,
  sameTile,
  tileKey,
  type BotWorldView,
} from "./BotWorldView";
import { createDangerMap, type DangerMap } from "./DangerMap";
import {
  collectReachableSafeCells,
  findExplorePath,
  findNearestSafePath,
  findPath,
  getPassableNeighborCount,
  TILE_TRAVEL_MS,
  type PathOptions,
} from "./Pathfinding";
import type { BotDifficultyConfig, BotRng } from "./BotTypes";

export interface BotPlan {
  path: Tile[];
  action: boolean;
  cooldownUntilTick?: number;
}

export interface BotPolicyContext {
  seatIndex: number;
  tick: number;
  view: BotWorldView;
  config: BotDifficultyConfig;
  rng: BotRng;
  bombCooldownUntilTick: number;
}

interface EscapeEvaluation {
  path: Tile[];
  safeCellCount: number;
  passableExits: number;
  counterTrapRisk: boolean;
}

interface AttackEvaluation {
  score: number;
  safeCellCount: number;
  trapGeometryScore: number;
}

const ESCAPE_DWELL_MS =
  FUSE_TIMER + EXPLOSION_DURATION_MS + BOMB_EXPLODE_DELAY + 250;

export function createBotPlan(ctx: BotPolicyContext): BotPlan {
  const self = ctx.view.players.find((player) => player.id === ctx.seatIndex);
  if (!self) return { path: [], action: false };

  const start = getPlayerCell(self);
  const danger = createDangerMap(ctx.view);
  const options: PathOptions = { danger, now: ctx.view.timestamp, config: ctx.config };

  if (danger.isDangerousSoon(start, ctx.view.timestamp, ctx.config.dangerLookaheadMs)) {
    return { path: findNearestSafePath(ctx.view, start, options) ?? [], action: false };
  }

  const powerupPath = ctx.view.powerups
    .map((powerup) => findPath(ctx.view, start, powerup.cell, options))
    .filter((path) => path !== undefined)
    .sort((a, b) => a.length - b.length)[0];
  if (powerupPath) return { path: powerupPath, action: false };

  const bombPlan = createBombPlan(ctx, start, danger);
  if (bombPlan) return bombPlan;

  const occupiedTargets = new Set(
    ctx.view.players
      .filter((player) => player.id !== ctx.seatIndex)
      .map((player) => tileKey(getPlayerCell(player)))
  );
  return {
    path:
      findExplorePath(ctx.view, start, {
        ...options,
        rng: ctx.rng,
        occupiedTargets,
      }) ?? [],
    action: false,
  };
}

function createBombPlan(ctx: BotPolicyContext, start: Tile, danger: DangerMap): BotPlan | undefined {
  const self = ctx.view.players.find((player) => player.id === ctx.seatIndex);
  if (
    !self ||
    self.availableBombs <= 0 ||
    ctx.tick < ctx.bombCooldownUntilTick ||
    danger.isDangerousSoon(start, ctx.view.timestamp, 500)
  ) {
    return undefined;
  }

  const hypotheticalDanger = createDangerMap(ctx.view, [
    {
      cell: start,
      placedAt: ctx.view.timestamp,
      strength: self.bombStrength,
    },
  ]);
  const escape = evaluateSelfEscape(ctx, start, hypotheticalDanger);
  if (!escape) return undefined;

  const hardMode = isHardMode(ctx.config);
  const attack = getBestAttack(ctx, start, self.bombStrength, hypotheticalDanger);
  const attackPlan =
    attack &&
    ctx.rng.next() <= ctx.config.aggression &&
    (!hardMode || shouldTakeHardAttack(attack, escape))
      ? createPlan(ctx, escape)
      : undefined;
  if (attackPlan) return attackPlan;

  const blockValue = getBlockBombValue(ctx.view, start, self.bombStrength);
  return blockValue > 0 &&
    ctx.rng.next() > ctx.config.randomMoveChance &&
    (!hardMode || shouldTakeHardBlockBomb(ctx, escape, blockValue))
    ? createPlan(ctx, escape)
    : undefined;
}

function createPlan(ctx: BotPolicyContext, escape: EscapeEvaluation): BotPlan {
  return {
    path: escape.path,
    action: true,
    cooldownUntilTick: ctx.tick + ctx.config.bombCooldownTicks,
  };
}

function evaluateSelfEscape(
  ctx: BotPolicyContext,
  start: Tile,
  danger: DangerMap
): EscapeEvaluation | undefined {
  const path = findNearestSafePath(ctx.view, start, {
    danger,
    now: ctx.view.timestamp,
    config: ctx.config,
    safeDwellMs: ESCAPE_DWELL_MS,
  });

  if (!path || path.length < 2) return undefined;

  const destination = path[path.length - 1];
  const safeCells = collectReachableSafeCells(ctx.view, start, {
    danger,
    now: ctx.view.timestamp,
    config: ctx.config,
    safeDwellMs: ESCAPE_DWELL_MS,
  });

  return {
    path,
    safeCellCount: safeCells.length,
    passableExits: getPassableNeighborCount(ctx.view, destination),
    counterTrapRisk: hasCounterTrapRisk(ctx, path),
  };
}

function getBestAttack(
  ctx: BotPolicyContext,
  start: Tile,
  strength: number,
  danger: DangerMap
): AttackEvaluation | undefined {
  return ctx.view.players
    .filter((player) => player.id !== ctx.seatIndex)
    .map((player) => evaluateAttackTarget(ctx, start, strength, danger, player))
    .filter((attack): attack is AttackEvaluation => attack !== undefined)
    .sort((a, b) => b.score - a.score)[0];
}

function evaluateAttackTarget(
  ctx: BotPolicyContext,
  start: Tile,
  strength: number,
  danger: DangerMap,
  target: BotWorldView["players"][number]
): AttackEvaluation | undefined {
  const targetCell = getPlayerCell(target);
  const direction = getAlignedDirection(start, targetCell);
  if (
    !direction ||
    manhattan(start, targetCell) > strength ||
    !lineIsClear(ctx.view, start, targetCell, direction)
  ) {
    return undefined;
  }

  const targetEscapePath = findNearestSafePath(ctx.view, targetCell, {
    danger,
    now: ctx.view.timestamp,
    config: ctx.config,
    safeDwellMs: ESCAPE_DWELL_MS,
    stepDwellMs: TILE_TRAVEL_MS,
  });
  const safeCells = collectReachableSafeCells(ctx.view, targetCell, {
    danger,
    now: ctx.view.timestamp,
    config: ctx.config,
    safeDwellMs: ESCAPE_DWELL_MS,
    stepDwellMs: TILE_TRAVEL_MS,
  });
  const trapGeometryScore = Math.max(
    0,
    3 - getPassableNeighborCount(ctx.view, targetCell)
  );
  const escapePenalty = Math.min(safeCells.length, 16);
  const score =
    (targetEscapePath ? 24 : 80) +
    trapGeometryScore * 12 +
    Math.max(0, 16 - escapePenalty) * 2 -
    manhattan(start, targetCell);

  return {
    score,
    safeCellCount: safeCells.length,
    trapGeometryScore,
  };
}

function shouldTakeHardAttack(
  attack: AttackEvaluation,
  escape: EscapeEvaluation
) {
  const isStrongTrap =
    attack.safeCellCount <= 2 || attack.trapGeometryScore >= 2;
  if (escape.counterTrapRisk && !isStrongTrap) return false;
  return attack.score >= 42;
}

function shouldTakeHardBlockBomb(
  ctx: BotPolicyContext,
  escape: EscapeEvaluation,
  blockValue: number
) {
  const hasRoomToEscape = escape.safeCellCount >= 5 || escape.passableExits >= 2;
  if (!hasRoomToEscape) return false;
  if (ctx.tick < 90 && blockValue < 2) return false;
  return !escape.counterTrapRisk || blockValue >= 2;
}

function getBlockBombValue(view: BotWorldView, start: Tile, strength: number) {
  let value = 0;
  for (const direction of BOT_DIRECTIONS) {
    let current = start;
    for (let distance = 1; distance <= strength; distance++) {
      current = neighborForDirection(current, direction);
      if (!isInside(view, current)) break;

      const collision = getCollision(view, current);
      if (collision === CollisionTile.WALL || collision === CollisionTile.BOMB) {
        break;
      }
      if (collision === CollisionTile.BLOCK) {
        value += distance === 1 ? 2 : 1;
        break;
      }
    }
  }
  return value;
}

function getAlignedDirection(from: Tile, to: Tile) {
  if (sameTile(from, to)) return undefined;
  if (from.row === to.row) return to.column > from.column ? Direction.RIGHT : Direction.LEFT;
  return from.column === to.column
    ? to.row > from.row
      ? Direction.DOWN
      : Direction.UP
    : undefined;
}

function lineIsClear(view: BotWorldView, start: Tile, target: Tile, direction: Direction) {
  let current = start;
  while (!sameTile(current, target)) {
    current = neighborForDirection(current, direction);
    const collision = getCollision(view, current);
    if (
      !sameTile(current, target) &&
      (collision === CollisionTile.WALL || collision === CollisionTile.BLOCK || collision === CollisionTile.BOMB)
    ) {
      return false;
    }
  }
  return true;
}

function hasCounterTrapRisk(ctx: BotPolicyContext, escapePath: Tile[]) {
  return ctx.view.players.some((player) => {
    if (player.id === ctx.seatIndex || player.availableBombs <= 0) {
      return false;
    }
    const opponentCell = getPlayerCell(player);
    return escapePath.some((escapeCell) => {
      const direction = getAlignedDirection(opponentCell, escapeCell);
      return (
        !!direction &&
        manhattan(opponentCell, escapeCell) <= player.bombStrength + 1 &&
        lineIsClear(ctx.view, opponentCell, escapeCell, direction)
      );
    });
  });
}

function isHardMode(config: BotDifficultyConfig) {
  return config.maxSearchDepth >= 36 && config.bombCooldownTicks <= 42;
}
