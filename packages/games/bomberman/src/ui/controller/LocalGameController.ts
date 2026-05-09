import type { BotDifficulty } from "@arcade/protocol";
import { InputHandler, KeyTracker, Ticker } from "@arcade/realtime-core";
import { BattleScene } from "../../sim/scenes/BattleScene";
import { GameState, SceneSnapshot } from "../../sim/types";
import { MAX_WINS, SERVER_TICK_MS } from "../../sim/constants";
import { KEY_BINDINGS } from "../../sim/config/bindings";
import {
  createRoundSeeds,
  deriveSeed,
  createRuntimeSeed,
} from "../../sim/utils/determinism";
import {
  BombermanBotRuntime,
  NULL_INPUT_HANDLER,
} from "../../room/BombermanBotRuntime";
import {
  BaseGameController,
  GameControllerConfig,
  RenderInput,
} from "./BaseGameController";

export type LocalActor =
  | { kind: "human-local"; inputIndex: number; name: string }
  | {
      kind: "bot";
      difficulty: BotDifficulty;
      name: string;
      seed: number;
    };

export const DEFAULT_LOCAL_ACTORS: LocalActor[] = [
  { kind: "human-local", inputIndex: 0, name: "Player 1" },
  {
    kind: "bot",
    difficulty: "normal",
    name: "CPU 2",
    seed: 0x10ca1b07,
  },
];

export const TWO_PLAYER_LOCAL_ACTORS: LocalActor[] = [
  { kind: "human-local", inputIndex: 0, name: "Player 1" },
  { kind: "human-local", inputIndex: 1, name: "Player 2" },
];

export interface LocalGameControllerConfig extends GameControllerConfig {
  actors?: LocalActor[];
}

export class LocalGameController extends BaseGameController {
  private scene: BattleScene;
  private gameState: GameState;
  private animationFrameId: number | null = null;
  private readonly keyTracker = new KeyTracker(KEY_BINDINGS);
  private readonly ticker: Ticker;
  private readonly matchSeed = createRuntimeSeed();
  private readonly actors: LocalActor[];
  private readonly botRuntime = new BombermanBotRuntime();
  private nextRoundIndex = 1;

  constructor(config: LocalGameControllerConfig) {
    super(config);
    this.actors = config.actors ?? DEFAULT_LOCAL_ACTORS;
    this.gameState = {
      wins: new Array(this.actors.length).fill(0),
      maxWins: MAX_WINS,
      tournamentMode: false,
    };
    this.ticker = new Ticker(SERVER_TICK_MS, (secondsPassed, now) => {
      this.step(secondsPassed, now);
    });
    this.scene = this.createBattleScene(-1);
    this.setRoundData(this.scene.getRoundStart());
  }

  private handleKeyDown = (event: KeyboardEvent) => {
    if (this.keyTracker.handleKeyDown(event.code)) event.preventDefault();
  };

  private handleKeyUp = (event: KeyboardEvent) => {
    if (this.keyTracker.handleKeyUp(event.code)) event.preventDefault();
  };

  private frame = () => {
    this.animationFrameId = window.requestAnimationFrame(this.frame);
    this.ticker.tick();
    // Local play ignores the emitted event stream — the scene is already
    // the source of truth for every piece of state we render.
    this.scene.drainEvents();
    this.update(this.buildRenderInput());
  };

  private step(secondsPassed: number, now: number) {
    this.botRuntime.beforeSceneUpdate({
      scene: this.scene,
      tick: this.scene.getTick(),
    });
    this.scene.update({ previous: now, secondsPassed });
    this.botRuntime.afterSceneUpdate();
  }

  private buildRenderInput(): RenderInput {
    const scene: SceneSnapshot = this.scene.serialize();
    const { destroyedBlockCells } = this.scene.getResyncSnapshot();
    return {
      snapshot: {
        tick: scene.tick,
        timestamp: scene.timestamp,
        hud: scene.hud,
        players: scene.players,
        bombs: scene.bombs,
      },
      destroyedCells: destroyedBlockCells,
      blockDestructions: scene.blocks
        .map((b) => b.entity)
        .filter((e): e is NonNullable<typeof e> => typeof e !== "undefined")
        .map((e) => ({ cell: e.cell, destroyedAt: e.destroyedAt })),
      bombs: scene.bombs.map((b) => ({ cell: b.cell, placedAt: b.placedAt })),
      explosions: scene.explosions.map((e) => ({
        cell: e.cell,
        startedAt: e.startedAt,
        flameCells: e.flameCells,
      })),
      powerups: {
        powerups: scene.powerups.powerups.map((p) => ({
          cell: p.cell,
          type: p.type,
        })),
      },
    };
  }

  private createBattleScene = (winnerId: number) => {
    if (winnerId >= 0) {
      this.gameState.wins[winnerId]++;
    }
    const roundSeeds = createRoundSeeds(this.matchSeed, this.nextRoundIndex++);
    this.botRuntime.initializeForRound(
      this.actors.map((actor, index) => ({
        index,
        ready: true,
        actor:
          actor.kind === "bot"
            ? {
                kind: "bot",
                bot: {
                  id: `local-bot:${index}`,
                  name: actor.name,
                  difficulty: actor.difficulty,
                  seed: actor.seed ^ deriveSeed(roundSeeds.matchSeed, index),
                  createdByUserId: "local",
                },
              }
            : null,
      })),
      roundSeeds.botSeedBase
    );
    const scene = new BattleScene(
      this.gameState,
      (nextWinner) => {
        this.scene = this.createBattleScene(nextWinner);
        this.setRoundData(this.scene.getRoundStart());
      },
      this.createInputHandlers(),
      { roundSeeds }
    );
    return scene;
  };

  private createInputHandlers(): InputHandler[] {
    return this.actors.map((actor, index) => {
      if (actor.kind === "human-local") {
        return this.keyTracker.createInputHandler(actor.inputIndex);
      }
      return this.botRuntime.getInputHandler(index) ?? NULL_INPUT_HANDLER;
    });
  }

  public start() {
    window.addEventListener("keydown", this.handleKeyDown);
    window.addEventListener("keyup", this.handleKeyUp);
    this.ticker.reset();
    this.animationFrameId ??= window.requestAnimationFrame(this.frame);
  }

  public stop() {
    window.removeEventListener("keydown", this.handleKeyDown);
    window.removeEventListener("keyup", this.handleKeyUp);
    this.keyTracker.reset();
    if (this.animationFrameId !== null) {
      window.cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    this.cleanup();
  }
}
