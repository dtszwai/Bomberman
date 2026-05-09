import {
  GameStatusType,
  type PublicSeatActor,
  type RoomSettings,
} from "@arcade/protocol";
import type { InputHandler } from "@arcade/realtime-core";
import {
  EventBroadcaster,
  RealtimeGameRoom,
  createPublicSeatActor,
  toStoredMatchSeat,
  User,
  type BaseGameSettings,
  type Storage,
} from "@arcade/lobby";
import { BattleScene } from "../sim/scenes/BattleScene";
import type { GameState, RoundSeeds } from "../sim/types";
import {
  BOMBERMAN_MAPS,
  MAX_WINS,
  POWERUP_PRESETS,
  SERVER_TICK_MS,
  getStageData,
} from "../sim/constants";
import { KEY_BINDINGS } from "../sim/config/bindings";
import {
  createRoundSeeds as deriveRoundSeeds,
  createRuntimeSeed,
} from "../sim/utils/determinism";
import {
  BombermanBotRuntime,
  NULL_INPUT_HANDLER,
} from "./BombermanBotRuntime";

/**
 * Bomberman-specific game room. Owns BattleScene lifecycle, per-round
 * bookkeeping (wins[], scoreboard), and the bomberman-flavoured
 * resync payload. Pure delta from `RealtimeGameRoom<GameState>`.
 *
 * Moves to `packages/games/bomberman/room` in step 9.
 */
export class BombermanRoom extends RealtimeGameRoom<GameState> {
  private static readonly DEFAULT_SETTINGS: BaseGameSettings = {
    tickRate: SERVER_TICK_MS,
    maxWins: MAX_WINS,
    roundStartDelay: 5000,
    gameTerminationDelay: 10000,
  };

  private battleScene?: BattleScene;
  private matchId?: string;
  private matchSeed?: number;
  private eventSeq = 0;
  private readonly botRuntime = new BombermanBotRuntime();
  private roundActors: (PublicSeatActor | null)[] = [];
  private static readonly MAP_IDS = new Set<string>(
    BOMBERMAN_MAPS.map((map) => map.id)
  );
  private static readonly POWERUP_PRESET_IDS = new Set<string>(
    POWERUP_PRESETS.map((preset) => preset.id)
  );

  constructor(host: User, roomName?: string, storage?: Storage) {
    super(
      host,
      roomName,
      { wins: [], maxWins: MAX_WINS, tournamentMode: false },
      { ...BombermanRoom.DEFAULT_SETTINGS },
      storage,
      KEY_BINDINGS
    );
    this.gameState.wins = new Array(this.seats.length);
  }

  protected override onGameStart(): void {
    this.gameState.wins = this.seats.map((seat) => (seat.actor ? 0 : -1));
    this.matchSeed = createRuntimeSeed();
    this.battleScene = this.createBattleScene();
    super.onGameStart();
  }

  protected override onGameStop(): void {
    super.onGameStop();
    this.battleScene = undefined;
    this.matchSeed = undefined;
  }

  protected override onGamePause(): void {
    super.onGamePause();
  }

  protected override onGameResume(): void {
    super.onGameResume();
  }

  protected override step(secondsPassed: number, now: number): void {
    if (this.status.type !== GameStatusType.ACTIVE || !this.battleScene) return;
    this.updatedAt = now;
    this.botRuntime.beforeSceneUpdate({
      scene: this.battleScene,
      tick: this.battleScene.getTick(),
    });
    this.battleScene.update({ previous: now, secondsPassed });
    this.botRuntime.afterSceneUpdate();
    this.drainAndBroadcastEvents();
    this.broadcastGameSnapshot();
  }

  private drainAndBroadcastEvents() {
    if (!this.battleScene) return;
    const events = this.battleScene.drainEvents();
    if (events.length === 0) return;

    // Persist before broadcast — replay log is the authoritative record.
    if (this.storage && this.matchId) {
      const now = Date.now();
      const matchId = this.matchId;
      this.storage.appendEvents(
        events.map((ev, i) => ({
          matchId,
          seq: this.eventSeq + i,
          timestampMs: now,
          type: ev.kind,
          payload: ev,
        }))
      );
      this.eventSeq += events.length;
    }

    const emitter = EventBroadcaster.getInstance();
    for (const ev of events) {
      emitter.toRoom(this.id, ev.kind, ev);
    }
  }

  private createBattleScene = (): BattleScene => {
    const roundSeeds = this.createRoundSeeds();
    this.roundActors = this.seats.map((seat) =>
      seat.actor ? createPublicSeatActor(seat.actor, this.hostId) : null
    );
    this.botRuntime.initializeForRound(this.seats, roundSeeds.botSeedBase);
    const scene = new BattleScene(
      this.gameState,
      this.handleRoundEnd,
      this.createRoundInputHandlers(),
      {
        roundSeeds,
        stageData: getStageData(this.settings.mapId, this.settings.powerupPreset),
        roundTimeSeconds: this.settings.roundTimeSeconds,
      }
    );
    this.matchId = crypto.randomUUID();
    this.eventSeq = 0;
    this.storage?.startMatch({
      id: this.matchId,
      gameType: "bomberman",
      roomId: this.id,
      startedAt: new Date(),
      seats: this.seats.map(toStoredMatchSeat),
      mapSeed: roundSeeds.mapSeed,
      settings: {
        room: this.settings,
        game: this.gameSettings,
        roundSeeds,
      },
    });
    EventBroadcaster.getInstance().roundStarted(this, {
      ...scene.getRoundStart(),
      roundActors: this.roundActors,
    });
    return scene;
  };

  private createRoundSeeds(): RoundSeeds {
    this.matchSeed ??= createRuntimeSeed();
    return deriveRoundSeeds(this.matchSeed, this.roundNumber);
  }

  private createRoundInputHandlers(): InputHandler[] {
    return this.seats.map((seat) => {
      if (!seat.actor) return NULL_INPUT_HANDLER;
      if (seat.actor.kind === "human") {
        return this.inputHandlers[seat.index] ?? NULL_INPUT_HANDLER;
      }
      return this.botRuntime.getInputHandler(seat.index) ?? NULL_INPUT_HANDLER;
    });
  }

  private handleRoundEnd = (seatIndex: number) => {
    const now = Date.now();
    const winnerSeatIndex =
      seatIndex >= 0 && seatIndex < this.gameState.wins.length
        ? seatIndex
        : null;
    const winner =
      winnerSeatIndex === null
        ? null
        : this.roundActors[winnerSeatIndex] ?? null;

    if (winnerSeatIndex !== null) {
      this.gameState.wins[winnerSeatIndex]++;
    }

    if (this.storage && this.matchId) {
      this.storage.endMatch(this.matchId, winnerSeatIndex);
    }

    const isGameEnd =
      winnerSeatIndex !== null &&
      this.gameState.wins[winnerSeatIndex] >= this.gameSettings.maxWins;

    this.setStatus({
      type: GameStatusType.ROUND_ENDED,
      timestamp: now,
      roundNumber: this.roundNumber++,
      roundEndTime: now,
      winner,
      winnerSeatIndex,
      state: isGameEnd
        ? {
            isGameOver: true,
            scoreboard: this.gameState.wins
              .map((wins, index) => ({
                actor: this.roundActors[index],
                wins,
              }))
              .filter(
                (entry): entry is { actor: PublicSeatActor; wins: number } =>
                  entry.wins >= 0 && entry.actor !== null
              ),
            terminationTime: now + this.gameSettings.gameTerminationDelay,
          }
        : {
            isGameOver: false,
            nextRoundStartTime: now + this.gameSettings.roundStartDelay,
          },
    });

    EventBroadcaster.getInstance().room(this);
    if (isGameEnd) {
      setTimeout(() => this.stopGame(), this.gameSettings.gameTerminationDelay);
    } else {
      this.startNextRound(now);
    }
  };

  private startNextRound(time: number) {
    setTimeout(() => {
      this.battleScene = this.createBattleScene();
      this.setStatus({
        type: GameStatusType.ACTIVE,
        timestamp: time + this.gameSettings.roundStartDelay,
        roundNumber: this.roundNumber,
        roundStartTime: time + this.gameSettings.roundStartDelay,
      });
      EventBroadcaster.getInstance().room(this);
    }, this.gameSettings.roundStartDelay);
  }

  private broadcastGameSnapshot(): void {
    if (!this.battleScene) return;
    const snapshot = {
      ...this.battleScene.toWireSnapshot(),
      status: this.status,
    };
    EventBroadcaster.getInstance().gameSnapshot(this, snapshot);
  }

  /**
   * Current round's static + latest dynamic state, bundled for a
   * resync on (re)connect. Returns undefined if no round is active.
   */
  public getResyncPayload() {
    if (!this.battleScene || this.status.type !== GameStatusType.ACTIVE) {
      return undefined;
    }
    return {
      roundStart: this.battleScene.getRoundStart(),
      roundActors: this.roundActors,
      snapshot: { ...this.battleScene.toWireSnapshot(), status: this.status },
      ...this.battleScene.getResyncSnapshot(),
    };
  }

  public static create(
    host: User,
    roomName?: string,
    settings: Partial<RoomSettings> = {},
    storage?: Storage
  ): BombermanRoom {
    try {
      const room = new BombermanRoom(host, roomName, storage);
      room.updateSettings(settings);
      return room;
    } catch (error) {
      host.setPosition(undefined);
      throw error;
    }
  }

  public override updateSettings(newSettings: Partial<RoomSettings>) {
    if (this.status.type !== GameStatusType.WAITING) {
      throw new Error("Room settings can only be changed before the game starts");
    }
    const normalized = this.normalizeSettings(newSettings);
    super.updateSettings(normalized);
    this.gameSettings.maxWins = this.settings.maxWins;
    this.gameState.maxWins = this.settings.maxWins;
    this.gameState.tournamentMode = this.settings.tournamentMode;
    this.gameState.wins = new Array(this.seats.length).fill(0);
  }

  private normalizeSettings(
    newSettings: Partial<RoomSettings>
  ): Partial<RoomSettings> {
    const normalized = { ...newSettings };

    if (normalized.maxWins !== undefined) {
      normalized.maxWins = this.assertIntegerInRange(
        normalized.maxWins,
        1,
        7,
        "Max wins"
      );
    }

    if (normalized.roundTimeSeconds !== undefined) {
      normalized.roundTimeSeconds = this.assertIntegerInRange(
        normalized.roundTimeSeconds,
        60,
        600,
        "Round time"
      );
    }

    if (
      normalized.mapId !== undefined &&
      !BombermanRoom.MAP_IDS.has(normalized.mapId)
    ) {
      throw new Error("Invalid map");
    }

    if (
      normalized.powerupPreset !== undefined &&
      !BombermanRoom.POWERUP_PRESET_IDS.has(normalized.powerupPreset)
    ) {
      throw new Error("Invalid power-up preset");
    }

    if (normalized.tournamentMode) {
      normalized.maxWins = Math.max(
        normalized.maxWins ?? this.settings.maxWins,
        3
      );
    }

    return normalized;
  }

  private assertIntegerInRange(
    value: number,
    min: number,
    max: number,
    label: string
  ): number {
    const normalized = Math.floor(value);
    if (normalized < min || normalized > max) {
      throw new Error(`${label} must be between ${min} and ${max}`);
    }
    return normalized;
  }
}
