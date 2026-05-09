import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import type { Seat } from "@arcade/protocol";
import type { InputHandler } from "@arcade/realtime-core";
import { BombermanBotRuntime, NULL_INPUT_HANDLER } from "../src/room/index.ts";
import {
  BombermanStateType,
  CollisionTile,
  Direction,
  HALF_TILE_SIZE,
  SERVER_TICK_MS,
  TILE_SIZE,
} from "../src/sim/constants/index.ts";
import {
  BOT_DIFFICULTY_CONFIG,
  createBotPlan,
  type BotRng,
  type BotWorldView,
} from "../src/sim/bots/index.ts";
import { BattleScene } from "../src/sim/scenes/BattleScene.ts";
import type { RoundSeeds } from "../src/sim/types.ts";
import {
  createRoundSeeds,
  deriveSeed,
} from "../src/sim/utils/determinism.ts";

type JsonValue =
  | null
  | boolean
  | number
  | string
  | JsonValue[]
  | { [key: string]: JsonValue | undefined };

interface ScenarioResult {
  hash: string;
  mapHash: string;
  winnerSeatIndex: number | null;
  movedDistances: number[];
  bombEvents: number;
  deathEvents: number;
}

const TICKS_TO_RUN = 360;
const MATCH_SEED = 0x5eedb0b1;

const seats: Seat[] = Array.from({ length: 4 }, (_, index) => ({
  index,
  ready: true,
  actor: {
    kind: "bot",
    bot: {
      id: `verify-bot-${index}`,
      name: `Verify CPU ${index + 1}`,
      difficulty: "hard",
      seed: deriveSeed(MATCH_SEED, "seat", index),
      createdByUserId: "verify",
    },
  },
}));

const stableStringify = (value: unknown): string => {
  if (value === null || typeof value !== "object") {
    return JSON.stringify(value);
  }

  if (Array.isArray(value)) {
    return `[${value.map(stableStringify).join(",")}]`;
  }

  return `{${Object.entries(value)
    .filter(([, entryValue]) => entryValue !== undefined)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(
      ([key, entryValue]) =>
        `${JSON.stringify(key)}:${stableStringify(entryValue)}`
    )
    .join(",")}}`;
};

const hashJson = (value: JsonValue): string =>
  createHash("sha256").update(stableStringify(value)).digest("hex");

const cloneJson = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

const createHandlers = (
  botRuntime: BombermanBotRuntime
): InputHandler[] =>
  seats.map((seat) => botRuntime.getInputHandler(seat.index) ?? NULL_INPUT_HANDLER);

const runScenario = (roundSeeds: RoundSeeds): ScenarioResult => {
  const botRuntime = new BombermanBotRuntime();
  botRuntime.initializeForRound(seats, roundSeeds.botSeedBase);

  let winnerSeatIndex: number | null = null;
  const scene = new BattleScene(
    { wins: seats.map(() => 0), maxWins: 2, tournamentMode: false },
    (winnerId) => {
      winnerSeatIndex = winnerId >= 0 ? winnerId : null;
    },
    createHandlers(botRuntime),
    { roundSeeds }
  );

  const roundStart = scene.getRoundStart();
  const initialPlayers = cloneJson(scene.serialize().players);
  const frames: JsonValue[] = [];
  let finalPlayers = initialPlayers;
  let bombEvents = 0;
  let deathEvents = 0;

  for (let tick = 1; tick <= TICKS_TO_RUN; tick++) {
    const now = tick * SERVER_TICK_MS;
    botRuntime.beforeSceneUpdate({ scene, tick: scene.getTick() });
    scene.update({ previous: now, secondsPassed: SERVER_TICK_MS / 1000 });
    botRuntime.afterSceneUpdate();

    const events = scene.drainEvents();
    const snapshot = scene.serialize();
    const resync = scene.getResyncSnapshot();
    finalPlayers = cloneJson(snapshot.players);
    bombEvents += events.filter((event) => event.kind === "bomb:placed").length;
    deathEvents += events.filter((event) => event.kind === "player:died").length;

    frames.push({
      tick: snapshot.tick,
      timestamp: snapshot.timestamp,
      players: snapshot.players.map((player) => ({
        id: player.id,
        position: { ...player.position },
        state: player.currentState,
        direction: player.direction,
        velocity: { ...player.velocity },
        bombAmount: player.bombAmount,
        bombStrength: player.bombStrength,
        availableBombs: player.availableBombs,
        speedMultiplier: player.speedMultiplier,
      })),
      bombs: cloneJson(snapshot.bombs),
      explosions: cloneJson(snapshot.explosions),
      blocks: snapshot.blocks.map((block) => ({
        cell: { ...block.cell },
        powerup: block.powerup,
        destroyedAt: block.entity?.destroyedAt,
      })),
      powerups: cloneJson(snapshot.powerups.powerups),
      destroyedBlockCells: cloneJson(resync.destroyedBlockCells),
      deadPlayerIds: [...resync.deadPlayerIds],
      events: cloneJson(events),
      winnerSeatIndex,
    });

    if (winnerSeatIndex !== null) break;
  }

  return {
    hash: hashJson({ roundStart, frames, winnerSeatIndex }),
    mapHash: hashJson({
      tileMap: roundStart.tileMap,
      initialBlocks: roundStart.initialBlocks,
    }),
    winnerSeatIndex,
    movedDistances: initialPlayers.map((initialPlayer) => {
      const finalPlayer = finalPlayers.find(
        (player) => player.id === initialPlayer.id
      );
      if (!finalPlayer) return 0;
      const dx = finalPlayer.position.x - initialPlayer.position.x;
      const dy = finalPlayer.position.y - initialPlayer.position.y;
      return Math.round(Math.hypot(dx, dy) * 10) / 10;
    }),
    bombEvents,
    deathEvents,
  };
};

const baseSeeds = createRoundSeeds(MATCH_SEED, 1);

if (process.env.VERIFY_BOTS_CHILD === "1") {
  process.stdout.write(`${runScenario(baseSeeds).hash}\n`);
  process.exit(0);
}

const assert = (condition: boolean, message: string) => {
  if (!condition) throw new Error(message);
};

const fixedRng: BotRng = {
  next: () => 0,
  nextInt: () => 0,
  pick: (items) => items[0],
};

const positionFor = (cell: { row: number; column: number }) => ({
  x: cell.column * TILE_SIZE + HALF_TILE_SIZE,
  y: cell.row * TILE_SIZE + HALF_TILE_SIZE,
});

const playerAt = (
  id: number,
  cell: { row: number; column: number },
  bombStrength = 2
) => ({
  id,
  position: positionFor(cell),
  currentState: BombermanStateType.IDLE,
  velocity: { x: 0, y: 0 },
  direction: Direction.DOWN,
  bombAmount: 1,
  bombStrength,
  availableBombs: 1,
  speedMultiplier: 1.2,
  stateChangedAt: 0,
});

const fixtureView = (
  rows: string[],
  players: ReturnType<typeof playerAt>[]
): BotWorldView => {
  const blockCells: { row: number; column: number }[] = [];
  const collisionMap = rows.map((row, rowIndex) =>
    [...row].map((cell, columnIndex) => {
      if (cell === "#") return CollisionTile.WALL;
      if (cell === "x") {
        blockCells.push({ row: rowIndex, column: columnIndex });
        return CollisionTile.BLOCK;
      }
      return CollisionTile.EMPTY;
    })
  );

  return {
    tick: 0,
    timestamp: 0,
    width: rows[0]?.length ?? 0,
    height: rows.length,
    collisionMap,
    players,
    bombs: [],
    explosions: [],
    powerups: [],
    blockCells,
  };
};

const hardPlanFor = (view: BotWorldView) =>
  createBotPlan({
    seatIndex: 0,
    tick: 120,
    view,
    config: BOT_DIFFICULTY_CONFIG.hard,
    rng: fixedRng,
    bombCooldownUntilTick: 0,
  });

const assertHardPolicyFixtures = () => {
  const selfTrap = hardPlanFor(
    fixtureView(
      [
        "#####",
        "#.###",
        "#.###",
        "#.###",
        "#####",
      ],
      [playerAt(0, { row: 3, column: 1 }), playerAt(1, { row: 1, column: 1 })]
    )
  );
  assert(!selfTrap.action, "hard bot accepted a bomb with no self escape");

  const corridorTrap = hardPlanFor(
    fixtureView(
      [
        "#######",
        "#.#####",
        "#.#####",
        "#.....#",
        "#######",
      ],
      [playerAt(0, { row: 3, column: 1 }), playerAt(1, { row: 1, column: 1 })]
    )
  );
  assert(corridorTrap.action, "hard bot refused a safe corridor trap bomb");

  const openField = hardPlanFor(
    fixtureView(
      [
        "#######",
        "#.....#",
        "#.....#",
        "#.....#",
        "#.....#",
        "#.....#",
        "#######",
      ],
      [playerAt(0, { row: 3, column: 1 }), playerAt(1, { row: 3, column: 3 })]
    )
  );
  assert(!openField.action, "hard bot accepted a low-value open-field bomb");
};

const first = runScenario(baseSeeds);
const second = runScenario(baseSeeds);
assert(first.hash === second.hash, "same seed/input produced different hashes");
assert(first.deathEvents === 0, "hard-bot smoke produced an early death");
assert(first.bombEvents > 0, "hard-bot smoke did not place any bombs");
assert(
  first.movedDistances.every((distance) => distance > 0),
  `hard-bot smoke had an immobile bot: ${first.movedDistances.join(", ")}`
);
assertHardPolicyFixtures();

const changedMap = runScenario({
  ...baseSeeds,
  mapSeed: deriveSeed(MATCH_SEED, 1, "different-map"),
});
assert(
  first.mapHash !== changedMap.mapHash,
  "changing mapSeed did not change the initial map hash"
);

const changedBotSeed = runScenario({
  ...baseSeeds,
  botSeedBase: deriveSeed(MATCH_SEED, 1, "different-bots"),
});
assert(
  typeof changedBotSeed.hash === "string" && changedBotSeed.hash.length > 0,
  "changed bot seed scenario did not produce a valid hash"
);

const child = spawnSync(
  process.execPath,
  [...process.execArgv, process.argv[1]],
  {
    cwd: process.cwd(),
    env: { ...process.env, VERIFY_BOTS_CHILD: "1" },
    encoding: "utf8",
  }
);
assert(child.status === 0, child.stderr || "child replay process failed");
assert(
  child.stdout.trim() === first.hash,
  "same seed/input produced different hash after process restart"
);

console.log(
  JSON.stringify(
    {
      sameProcessDeterministic: true,
      childProcessDeterministic: true,
      mapSeedChangesMap: true,
      changedBotSeedValid: true,
      hardPolicyFixtures: true,
      hash: first.hash,
      mapHash: first.mapHash,
      winnerSeatIndex: first.winnerSeatIndex,
      movedDistances: first.movedDistances,
      bombEvents: first.bombEvents,
      deathEvents: first.deathEvents,
    },
    null,
    2
  )
);
