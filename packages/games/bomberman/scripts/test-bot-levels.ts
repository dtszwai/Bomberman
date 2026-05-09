import type { Seat, BotDifficulty } from "@arcade/protocol";
import type { InputHandler } from "@arcade/realtime-core";
import { BombermanBotRuntime, NULL_INPUT_HANDLER } from "../src/room/index.ts";
import { SERVER_TICK_MS } from "../src/sim/constants/index.ts";
import { BattleScene } from "../src/sim/scenes/BattleScene.ts";
import type { GameEvent, RoundSeeds } from "../src/sim/types.ts";
import {
  createRoundSeeds,
  deriveSeed,
} from "../src/sim/utils/determinism.ts";

interface Options {
  runs: number;
  maxTicks: number;
  seed: number;
  rotateSeats: boolean;
  json: boolean;
}

interface RunResult {
  runIndex: number;
  roundSeeds: RoundSeeds;
  winnerSeatIndex: number | null;
  timedOut: boolean;
  ticks: number;
  finishBySeat: Map<number, number>;
  deathOrder: number[];
  bombsBySeat: Map<number, number>;
  powerupsBySeat: Map<number, number>;
  blockDestroyedEvents: number;
}

interface DifficultyStats {
  difficulty: BotDifficulty;
  runs: number;
  wins: number;
  deaths: number;
  aliveDraws: number;
  finishSum: number;
  scoreSum: number;
  bombsPlaced: number;
  powerupsCollected: number;
}

const DIFFICULTIES: BotDifficulty[] = ["easy", "normal", "hard", "hell"];
const DEFAULT_RUNS = 100;
const DEFAULT_MAX_TICKS = 30 * 180;
const DEFAULT_SEED = 0x5eedb0b1;

const usage = () => `
Usage:
  pnpm test:bot-levels -- --runs=200
  pnpm test:bot-levels -- 200 --json

Options:
  --runs=N       Number of 4-bot rounds to simulate. Default: ${DEFAULT_RUNS}
  --ticks=N      Max ticks per round. Default: ${DEFAULT_MAX_TICKS}
  --seed=N       Base seed. Decimal or 0x hex. Default: 0x${DEFAULT_SEED.toString(16)}
  --no-rotate    Do not rotate difficulties across spawn seats.
  --json         Print machine-readable JSON.
`;

const parseNumber = (value: string, name: string): number => {
  const parsed = value.startsWith("0x")
    ? Number.parseInt(value, 16)
    : Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new Error(`${name} must be a positive number`);
  }
  return parsed;
};

const parseSeed = (value: string): number => {
  const parsed = value.startsWith("0x")
    ? Number.parseInt(value, 16)
    : Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed < 0) {
    throw new Error("seed must be a non-negative number");
  }
  return parsed;
};

const readArgValue = (args: string[], name: string): string | undefined => {
  const prefix = `--${name}=`;
  const withEquals = args.find((arg) => arg.startsWith(prefix));
  if (withEquals) return withEquals.slice(prefix.length);

  const index = args.indexOf(`--${name}`);
  return index >= 0 ? args[index + 1] : undefined;
};

function parseOptions(): Options {
  const args = process.argv.slice(2);
  if (args.includes("--help") || args.includes("-h")) {
    console.log(usage().trim());
    process.exit(0);
  }

  const positionalRuns = args.find((arg) => /^\d+$/.test(arg));
  return {
    runs: parseNumber(
      readArgValue(args, "runs") ?? positionalRuns ?? String(DEFAULT_RUNS),
      "runs"
    ),
    maxTicks: parseNumber(
      readArgValue(args, "ticks") ?? String(DEFAULT_MAX_TICKS),
      "ticks"
    ),
    seed: parseSeed(readArgValue(args, "seed") ?? String(DEFAULT_SEED)),
    rotateSeats: !args.includes("--no-rotate"),
    json: args.includes("--json"),
  };
}

const createStats = (difficulty: BotDifficulty): DifficultyStats => ({
  difficulty,
  runs: 0,
  wins: 0,
  deaths: 0,
  aliveDraws: 0,
  finishSum: 0,
  scoreSum: 0,
  bombsPlaced: 0,
  powerupsCollected: 0,
});

const createCounterMap = () =>
  new Map<number, number>([0, 1, 2, 3].map((seatIndex) => [seatIndex, 0]));

const increment = (counts: Map<number, number>, seatIndex: number) => {
  counts.set(seatIndex, (counts.get(seatIndex) ?? 0) + 1);
};

const getDifficultyForSeat = (
  seatIndex: number,
  runIndex: number,
  rotateSeats: boolean
) =>
  DIFFICULTIES[
    rotateSeats
      ? (seatIndex + runIndex) % DIFFICULTIES.length
      : seatIndex
  ];

const createSeats = (runIndex: number, options: Options): Seat[] =>
  DIFFICULTIES.map((_, seatIndex) => {
    const difficulty = getDifficultyForSeat(
      seatIndex,
      runIndex,
      options.rotateSeats
    );
    return {
      index: seatIndex,
      ready: true,
      actor: {
        kind: "bot",
        bot: {
          id: `level-test-${runIndex}-${seatIndex}`,
          name: `Level ${difficulty}`,
          difficulty,
          seed: deriveSeed(options.seed, "bot", runIndex, seatIndex),
          createdByUserId: "bot-level-test",
        },
      },
    };
  });

const createHandlers = (
  seats: Seat[],
  botRuntime: BombermanBotRuntime
): InputHandler[] =>
  seats.map((seat) => botRuntime.getInputHandler(seat.index) ?? NULL_INPUT_HANDLER);

function applyEventMetrics(
  event: GameEvent,
  aliveSeats: Set<number>,
  result: Pick<
    RunResult,
    "finishBySeat" | "deathOrder" | "bombsBySeat" | "powerupsBySeat"
  > & { blockDestroyedEvents: number }
) {
  switch (event.kind) {
    case "player:died":
      if (aliveSeats.has(event.id)) {
        result.finishBySeat.set(event.id, aliveSeats.size);
        result.deathOrder.push(event.id);
        aliveSeats.delete(event.id);
      }
      break;
    case "bomb:placed":
      increment(result.bombsBySeat, event.ownerId);
      break;
    case "powerup:collected":
      increment(result.powerupsBySeat, event.playerId);
      break;
    case "block:destroyed":
      result.blockDestroyedEvents += 1;
      break;
    default:
      break;
  }
}

function assignRemainingFinishes(
  aliveSeats: Set<number>,
  finishBySeat: Map<number, number>
) {
  if (aliveSeats.size === 0) return;

  const sharedFinish = (aliveSeats.size + 1) / 2;
  for (const seatIndex of aliveSeats) {
    finishBySeat.set(seatIndex, sharedFinish);
  }
}

function runRound(runIndex: number, options: Options): RunResult {
  const seats = createSeats(runIndex, options);
  const roundSeeds = createRoundSeeds(options.seed, runIndex + 1);
  const botRuntime = new BombermanBotRuntime();
  botRuntime.initializeForRound(seats, roundSeeds.botSeedBase);

  const aliveSeats = new Set(seats.map((seat) => seat.index));
  let winnerSeatIndex: number | null | undefined;
  const handlers = createHandlers(seats, botRuntime);
  const scene = new BattleScene(
    { wins: seats.map(() => 0), maxWins: 1, tournamentMode: false },
    (winnerId) => {
      if (winnerSeatIndex !== undefined) return;
      winnerSeatIndex = winnerId >= 0 ? winnerId : null;
    },
    handlers,
    { roundSeeds }
  );

  const result: RunResult = {
    runIndex,
    roundSeeds,
    winnerSeatIndex: null,
    timedOut: false,
    ticks: 0,
    finishBySeat: new Map(),
    deathOrder: [],
    bombsBySeat: createCounterMap(),
    powerupsBySeat: createCounterMap(),
    blockDestroyedEvents: 0,
  };

  for (let tick = 1; tick <= options.maxTicks; tick++) {
    const now = tick * SERVER_TICK_MS;
    botRuntime.beforeSceneUpdate({ scene, tick: scene.getTick() });
    scene.update({ previous: now, secondsPassed: SERVER_TICK_MS / 1000 });
    botRuntime.afterSceneUpdate();

    for (const event of scene.drainEvents()) {
      applyEventMetrics(event, aliveSeats, result);
    }

    result.ticks = tick;
    if (winnerSeatIndex !== undefined) break;
  }

  result.timedOut = winnerSeatIndex === undefined;
  result.winnerSeatIndex = winnerSeatIndex ?? null;
  if (winnerSeatIndex !== undefined && winnerSeatIndex !== null) {
    result.finishBySeat.set(winnerSeatIndex, 1);
    aliveSeats.delete(winnerSeatIndex);
  }
  assignRemainingFinishes(aliveSeats, result.finishBySeat);

  return result;
}

const scoreForFinish = (finish: number) => Math.max(0, 4 - finish);

const ratingFor = (entry: DifficultyStats) =>
  entry.scoreSum / entry.runs +
  (entry.wins / entry.runs) * 4 -
  (entry.aliveDraws / entry.runs) * 0.5;

function aggregate(results: RunResult[], options: Options) {
  const stats = new Map(
    DIFFICULTIES.map((difficulty) => [difficulty, createStats(difficulty)])
  );

  for (const result of results) {
    for (let seatIndex = 0; seatIndex < DIFFICULTIES.length; seatIndex++) {
      const difficulty = getDifficultyForSeat(
        seatIndex,
        result.runIndex,
        options.rotateSeats
      );
      const entry = stats.get(difficulty)!;
      const finish = result.finishBySeat.get(seatIndex) ?? 4;

      entry.runs += 1;
      entry.finishSum += finish;
      entry.scoreSum += scoreForFinish(finish);
      entry.bombsPlaced += result.bombsBySeat.get(seatIndex) ?? 0;
      entry.powerupsCollected += result.powerupsBySeat.get(seatIndex) ?? 0;

      if (result.winnerSeatIndex === seatIndex) entry.wins += 1;
      if (result.deathOrder.includes(seatIndex)) entry.deaths += 1;
      if (result.timedOut && !result.deathOrder.includes(seatIndex)) {
        entry.aliveDraws += 1;
      }
    }
  }

  return stats;
}

function formatPercent(value: number) {
  return `${(value * 100).toFixed(1)}%`;
}

function formatNumber(value: number) {
  return value.toFixed(2).padStart(8);
}

function printTable(stats: Map<BotDifficulty, DifficultyStats>) {
  console.log(
    [
      "difficulty".padEnd(10),
      "wins".padStart(6),
      "win%".padStart(8),
      "avgPlace".padStart(10),
      "avgScore".padStart(10),
      "rating".padStart(10),
      "deaths".padStart(8),
      "draws".padStart(8),
      "bombs".padStart(8),
      "powerups".padStart(10),
    ].join(" ")
  );

  for (const difficulty of DIFFICULTIES) {
    const entry = stats.get(difficulty)!;
    console.log(
      [
        difficulty.padEnd(10),
        String(entry.wins).padStart(6),
        formatPercent(entry.wins / entry.runs).padStart(8),
        formatNumber(entry.finishSum / entry.runs),
        formatNumber(entry.scoreSum / entry.runs),
        formatNumber(ratingFor(entry)),
        String(entry.deaths).padStart(8),
        String(entry.aliveDraws).padStart(8),
        String(entry.bombsPlaced).padStart(8),
        String(entry.powerupsCollected).padStart(10),
      ].join(" ")
    );
  }
}

function getPairwiseAccuracy(stats: Map<BotDifficulty, DifficultyStats>) {
  const comparisons: {
    easier: BotDifficulty;
    harder: BotDifficulty;
    easierScore: number;
    harderScore: number;
    passed: boolean;
  }[] = [];

  for (let easierIndex = 0; easierIndex < DIFFICULTIES.length; easierIndex++) {
    for (
      let harderIndex = easierIndex + 1;
      harderIndex < DIFFICULTIES.length;
      harderIndex++
    ) {
      const easier = DIFFICULTIES[easierIndex];
      const harder = DIFFICULTIES[harderIndex];
      const easierScore = ratingFor(stats.get(easier)!);
      const harderScore = ratingFor(stats.get(harder)!);

      comparisons.push({
        easier,
        harder,
        easierScore,
        harderScore,
        passed: harderScore > easierScore,
      });
    }
  }

  const passed = comparisons.filter((comparison) => comparison.passed).length;
  return {
    comparisons,
    passed,
    total: comparisons.length,
    ratio: passed / comparisons.length,
  };
}

function toJsonSafe(results: RunResult[], stats: Map<BotDifficulty, DifficultyStats>) {
  const accuracy = getPairwiseAccuracy(stats);
  return {
    stats: DIFFICULTIES.map((difficulty) => {
      const entry = stats.get(difficulty)!;
      return {
        ...entry,
        winRate: entry.wins / entry.runs,
        averageFinish: entry.finishSum / entry.runs,
        averageScore: entry.scoreSum / entry.runs,
        rating: ratingFor(entry),
      };
    }),
    accuracy,
    rounds: results.map((result) => ({
      runIndex: result.runIndex,
      winnerSeatIndex: result.winnerSeatIndex,
      timedOut: result.timedOut,
      ticks: result.ticks,
      finishBySeat: Object.fromEntries(result.finishBySeat),
      deathOrder: result.deathOrder,
      bombsBySeat: Object.fromEntries(result.bombsBySeat),
      powerupsBySeat: Object.fromEntries(result.powerupsBySeat),
      blockDestroyedEvents: result.blockDestroyedEvents,
    })),
  };
}

function main() {
  const options = parseOptions();
  const results = Array.from({ length: options.runs }, (_, runIndex) =>
    runRound(runIndex, options)
  );
  const stats = aggregate(results, options);
  const accuracy = getPairwiseAccuracy(stats);
  const timeouts = results.filter((result) => result.timedOut).length;
  const totalBlocksDestroyed = results.reduce(
    (sum, result) => sum + result.blockDestroyedEvents,
    0
  );

  if (options.json) {
    console.log(JSON.stringify(toJsonSafe(results, stats), null, 2));
    return;
  }

  console.log("Bomberman bot level simulation");
  console.log(
    `Runs: ${options.runs} | max ticks: ${options.maxTicks} | seed: ${options.seed} | rotate seats: ${options.rotateSeats}`
  );
  console.log(
    `Completed rounds: ${options.runs - timeouts}/${options.runs} | timeouts: ${timeouts} | blocks destroyed: ${totalBlocksDestroyed}`
  );
  console.log("");
  printTable(stats);
  console.log("");
  console.log(
    `Difficulty order accuracy: ${accuracy.passed}/${accuracy.total} (${formatPercent(
      accuracy.ratio
    )})`
  );
  for (const comparison of accuracy.comparisons) {
    const verdict = comparison.passed ? "PASS" : "FAIL";
    console.log(
      `${verdict} ${comparison.harder} (${comparison.harderScore.toFixed(
        2
      )}) > ${comparison.easier} (${comparison.easierScore.toFixed(2)})`
    );
  }
}

main();
