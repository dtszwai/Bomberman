import type { BotDifficulty } from "@arcade/protocol";
import type { Tile } from "@arcade/realtime-core";

export interface BotCommand {
  left: boolean;
  right: boolean;
  up: boolean;
  down: boolean;
  action: boolean;
}

export const EMPTY_BOT_COMMAND: BotCommand = {
  left: false,
  right: false,
  up: false,
  down: false,
  action: false,
};

export interface BotDifficultyConfig {
  decisionIntervalTicks: number;
  dangerLookaheadMs: number;
  maxSearchDepth: number;
  bombCooldownTicks: number;
  aggression: number;
  randomMoveChance: number;
  powerupBias: number;
  blockBias: number;
}

export const BOT_DIFFICULTY_CONFIG: Record<
  BotDifficulty,
  BotDifficultyConfig
> = {
  easy: {
    decisionIntervalTicks: 18,
    dangerLookaheadMs: 2800,
    maxSearchDepth: 16,
    bombCooldownTicks: 95,
    aggression: 0.25,
    randomMoveChance: 0.35,
    powerupBias: 1.4,
    blockBias: 1.0,
  },
  normal: {
    decisionIntervalTicks: 10,
    dangerLookaheadMs: 3600,
    maxSearchDepth: 26,
    bombCooldownTicks: 65,
    aggression: 0.55,
    randomMoveChance: 0.16,
    powerupBias: 1.8,
    blockBias: 1.35,
  },
  hard: {
    decisionIntervalTicks: 5,
    dangerLookaheadMs: 4400,
    maxSearchDepth: 36,
    bombCooldownTicks: 42,
    aggression: 0.8,
    randomMoveChance: 0.06,
    powerupBias: 2.2,
    blockBias: 1.55,
  },
  hell: {
    decisionIntervalTicks: 2,
    dangerLookaheadMs: 5200,
    maxSearchDepth: 48,
    bombCooldownTicks: 24,
    aggression: 0.96,
    randomMoveChance: 0.015,
    powerupBias: 2.8,
    blockBias: 1.9,
  },
};

export interface BotRng {
  next(): number;
  nextInt(maxExclusive: number): number;
  pick<T>(items: readonly T[]): T | undefined;
}

export interface BotMemory {
  path: Tile[];
  bombCooldownUntilTick: number;
  lastDecisionTick: number;
}
