import { GameTime, InputHandler } from "@arcade/realtime-core";
import { Stage, Bomberman } from "../entities";
import { BlockSystem, BombSystem, PowerupSystem } from "../systems";
import { BombermanStateType, GAME_TIME, getStageData } from "../constants";
import type {
  GameEvent,
  GameResyncSnapshot,
  GameSnapshot,
  GameState,
  RoundSeeds,
  RoundStartPayload,
  SceneSnapshot,
  StageData,
} from "../types";
import {
  createRoundSeeds,
  createSeededRng,
} from "../utils/determinism";

export interface BattleSceneOptions {
  roundSeeds?: RoundSeeds;
  stageData?: StageData;
  roundTimeSeconds?: number;
}

/**
 * Class representing the battle scene in the game.
 * Manages game entities, systems, and handles game logic specific to the battle.
 *
 * Emits discrete events via {@link drainEvents} for the server to broadcast.
 */
export class BattleScene {
  private stage: Stage;
  private powerupSystem: PowerupSystem;
  private blockSystem: BlockSystem;
  private bombSystem: BombSystem;
  private players: Bomberman[] = [];
  /** Players that have died this round — kept for resync/replay. */
  private deadPlayerIds = new Set<number>();
  private remainingTime: [number, number] = [...GAME_TIME];
  private accumulatedTime: number = 0;
  private tick: number = 0;
  private lastTimestamp: number = 0;
  private roundSeeds: RoundSeeds;
  private stageData: StageData;

  private pendingEvents: GameEvent[] = [];
  private emit = (event: GameEvent) => {
    this.pendingEvents.push(event);
  };

  constructor(
    private state: GameState,
    private onEnd: (winnerId: number) => void,
    private inputHandlers: InputHandler[],
    options: BattleSceneOptions = {}
  ) {
    this.roundSeeds = options.roundSeeds ?? createRoundSeeds(0, 1);
    this.stageData = options.stageData ?? getStageData();
    this.remainingTime = this.toClock(options.roundTimeSeconds);
    this.stage = new Stage(this.stageData);
    this.powerupSystem = new PowerupSystem(this.players, this.emit);
    this.blockSystem = new BlockSystem(
      this.stage.updateMapAt,
      this.stage.getCollisionTileAt,
      this.powerupSystem.addPowerup,
      this.emit,
      this.stageData,
      {
        mapRng: createSeededRng(this.roundSeeds.mapSeed),
        powerupRng: createSeededRng(this.roundSeeds.powerupSeed),
      }
    );
    this.bombSystem = new BombSystem(
      this.stage.collisionMap,
      this.blockSystem.addBlock,
      this.emit
    );

    state.wins.forEach((playerWin, id) => {
      if (playerWin >= 0) {
        this.addPlayer(id);
      }
    });
  }

  private addPlayer(id: number) {
    this.players.push(
      new Bomberman(
        id,
        this.stage.getCollisionTileAt,
        this.bombSystem.addBomb,
        this.onBombermanDeath,
        this.inputHandlers[id]
      )
    );
  }

  private onBombermanDeath = (id: number, at: number) => {
    this.deadPlayerIds.add(id);
    this.emit({ kind: "player:died", id, at });
    this.removePlayer(id);
  };

  private removePlayer = (id: number) => {
    const index = this.players.findIndex((player) => player.id === id);
    if (index >= 0) this.players.splice(index, 1);
  };

  private checkEndGame() {
    if (this.players.length > 1) return;

    const isLastPlayerAlive =
      this.players.length === 1 &&
      this.players[0].currentState.type !== BombermanStateType.DEATH;

    this.onEnd(isLastPlayerAlive ? this.players[0].id : -1);
  }

  public update(time: GameTime) {
    this.tick += 1;
    this.lastTimestamp = time.previous;

    this.accumulatedTime += time.secondsPassed;

    if (this.accumulatedTime >= 1) {
      const secondsToDecrease = Math.floor(this.accumulatedTime);
      this.accumulatedTime -= secondsToDecrease;

      const totalSeconds = this.remainingTime[0] * 60 + this.remainingTime[1];
      const newTotalSeconds = Math.max(0, totalSeconds - secondsToDecrease);

      this.remainingTime = [
        Math.floor(newTotalSeconds / 60),
        Math.floor(newTotalSeconds % 60),
      ];
    }

    this.blockSystem.update(time);
    this.bombSystem.update(time);
    this.powerupSystem.update(time);

    this.players.sort((a, b) => a.position.y - b.position.y);
    this.players.forEach((player) => player.update(time));
    this.checkEndGame();
  }

  /** Full scene state — used by local controller + internal server code.
   *  Server must NOT broadcast this directly; use {@link toWireSnapshot}. */
  public serialize(): SceneSnapshot {
    const bombSystemSnapshot = this.bombSystem.serialize();
    return {
      tick: this.tick,
      timestamp: this.lastTimestamp,
      players: this.players.map((player) => player.serialize()),
      bombs: bombSystemSnapshot.bombs,
      explosions: bombSystemSnapshot.explosions,
      blocks: this.blockSystem.serialize().blocks,
      powerups: this.powerupSystem.serialize(),
      hud: { time: this.remainingTime, state: this.state },
    };
  }

  /** Wire snapshot: continuous state only. Discrete state goes via events. */
  public toWireSnapshot(): GameSnapshot {
    const bombSystemSnapshot = this.bombSystem.serialize();
    return {
      tick: this.tick,
      timestamp: this.lastTimestamp,
      players: this.players.map((player) => player.serialize()),
      bombs: bombSystemSnapshot.bombs,
      hud: { time: this.remainingTime, state: this.state },
    };
  }

  /**
   * Drains and returns events emitted during the most recent update cycle.
   * Server calls this after each `update()` and broadcasts them as
   * reliable-ordered socket events.
   */
  public drainEvents(): GameEvent[] {
    if (this.pendingEvents.length === 0) return [];
    const events = this.pendingEvents;
    this.pendingEvents = [];
    return events;
  }

  /**
   * Live discrete state bundled for a (re)connecting client. Lets it
   * hydrate block destruction, powerups, explosions, and dead-player
   * lists without replaying the event log.
   */
  public getResyncSnapshot(): GameResyncSnapshot {
    return {
      destroyedBlockCells: this.blockSystem.getDestroyedCells(),
      explosions: this.bombSystem.getActiveExplosions(),
      powerups: this.powerupSystem.getLivePowerups(),
      deadPlayerIds: [...this.deadPlayerIds],
    };
  }

  public getRoundStart(): RoundStartPayload {
    return {
      tick: this.tick,
      timestamp: this.lastTimestamp,
      seeds: this.roundSeeds,
      tileMap: this.stage.serialize().tileMap.map((row) => [...row]),
      initialBlocks: this.blockSystem.serialize().blocks.map((block) => ({
        cell: block.cell,
        powerup: block.powerup,
      })),
    };
  }

  private toClock(roundTimeSeconds?: number): [number, number] {
    if (roundTimeSeconds === undefined) return [...GAME_TIME];
    const totalSeconds = Math.max(30, Math.floor(roundTimeSeconds));
    return [Math.floor(totalSeconds / 60), totalSeconds % 60];
  }

  public getTick(): number {
    return this.tick;
  }

  public getCollisionMap(): number[][] {
    return this.stage.serialize().collisionMap.map((row) => [...row]);
  }
}
