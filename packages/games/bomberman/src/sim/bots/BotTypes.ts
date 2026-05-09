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
    dangerLookaheadMs: 300,
    maxSearchDepth: 6,
    bombCooldownTicks: 140,
    aggression: 0.08,
    randomMoveChance: 0.8,
    powerupBias: 0.05,
    blockBias: 1.0,
  },
  normal: {
    decisionIntervalTicks: 10,
    dangerLookaheadMs: 3200,
    maxSearchDepth: 24,
    bombCooldownTicks: 84,
    aggression: 0.4,
    randomMoveChance: 0.26,
    powerupBias: 1.4,
    blockBias: 1.35,
  },
  hard: {
    decisionIntervalTicks: 5,
    dangerLookaheadMs: 5400,
    maxSearchDepth: 48,
    bombCooldownTicks: 16,
    aggression: 1,
    randomMoveChance: 0,
    powerupBias: 2.6,
    blockBias: 1.75,
  },
  hell: {
    decisionIntervalTicks: 2,
    dangerLookaheadMs: 6200,
    maxSearchDepth: 56,
    bombCooldownTicks: 8,
    aggression: 1,
    randomMoveChance: 0,
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
  planIntent?: string;
  bombCooldownUntilTick: number;
  lastDecisionTick: number;
}
