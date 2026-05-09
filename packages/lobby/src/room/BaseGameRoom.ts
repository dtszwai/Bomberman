import {
  type BotDifficulty,
  GameStatusType,
  RoomType,
  type UserControls,
} from "@arcade/protocol";
import type { KeyBindings } from "@arcade/realtime-core";
import type { Storage } from "@arcade/storage";
import { ActionHandler } from "../ActionHandler";
import { EventBroadcaster } from "../EventBroadcaster";
import { logger } from "../logger";
import type { GameRoomState, GameStatus } from "../types";
import type { User } from "../user/User";
import { BaseRoom } from "./BaseRoom";

export interface BaseGameSettings {
  tickRate: number;
  maxWins: number;
  roundStartDelay: number;
  gameTerminationDelay: number;
}

export enum GameStateChangePermission {
  HOST_ONLY,
  ANY_PLAYER,
  SYSTEM,
}

export interface GameStateTransition<G> {
  fromStates: GameStatusType[];
  permission: GameStateChangePermission;
  validationRules?: ((
    room: BaseGameRoom<G>,
    initiator?: User
  ) => string | null)[];
}

/**
 * Common game-room lifecycle FSM: waiting/active/paused/round-ended
 * with permission checks and validation rules. Sub-classes pick the
 * sim driver (realtime tick vs turn-based).
 */
export abstract class BaseGameRoom<G> extends BaseRoom {
  public readonly type = RoomType.GAME;
  public status: GameStatus;
  protected gameState: G;
  protected readonly gameSettings: BaseGameSettings;
  protected inputHandlers: ActionHandler[];
  protected roundNumber: number;
  public startTime?: number;

  protected static readonly STATE_TRANSITIONS: Record<
    GameStatusType,
    GameStateTransition<unknown>
  > = {
    [GameStatusType.ACTIVE]: {
      fromStates: [GameStatusType.WAITING, GameStatusType.PAUSED],
      permission: GameStateChangePermission.HOST_ONLY,
      validationRules: [
        (room) =>
          room.getUserCount() < 1
            ? "Need at least 1 human player to start"
            : null,
        (room) =>
          room.getActorCount() < 2
            ? "Need at least 2 players to start"
            : null,
        (room) => (!room.isAllReady() ? "Not all players are ready" : null),
        (room, initiator) => {
          if (room.status.type === GameStatusType.WAITING) {
            if (initiator?.id !== room.hostId) {
              return "Only the host can start the game";
            }
            if (room.getUserCount() < 1) {
              return "Need at least 1 human player to start";
            }
            if (room.getActorCount() < 2) {
              return "Need at least 2 players to start";
            }
            if (!room.isAllReady()) {
              return "Not all players are ready";
            }
          }
          if (
            room.status.type === GameStatusType.PAUSED &&
            initiator?.id !== room.hostId
          ) {
            return "Only the host can resume the game";
          }
          return null;
        },
      ],
    },
    [GameStatusType.PAUSED]: {
      fromStates: [GameStatusType.ACTIVE],
      permission: GameStateChangePermission.HOST_ONLY,
      validationRules: [
        (room, initiator) =>
          initiator?.id !== room.hostId
            ? "Only the host can pause the game"
            : null,
      ],
    },
    [GameStatusType.WAITING]: {
      fromStates: [
        GameStatusType.ACTIVE,
        GameStatusType.PAUSED,
        GameStatusType.ROUND_ENDED,
      ],
      permission: GameStateChangePermission.SYSTEM,
      validationRules: [
        (_, initiator) =>
          initiator ? "Only system can set game to waiting state" : null,
      ],
    },
    [GameStatusType.ROUND_ENDED]: {
      fromStates: [GameStatusType.ACTIVE],
      permission: GameStateChangePermission.SYSTEM,
      validationRules: [
        (_, initiator) =>
          initiator ? "Round end can only be triggered by the system" : null,
      ],
    },
  };

  constructor(
    host: User,
    roomName: string | undefined,
    initialGameState: G,
    gameSettings: BaseGameSettings,
    protected readonly storage?: Storage,
    inputBindings?: KeyBindings[]
  ) {
    super(host, roomName);
    this.status = { type: GameStatusType.WAITING, timestamp: Date.now() };
    this.gameSettings = gameSettings;
    this.gameState = initialGameState;
    this.inputHandlers = this.seats.map(
      (_, index) => new ActionHandler(inputBindings?.[index])
    );
    this.roundNumber = 1;
  }

  protected setStatus(status: GameStatus) {
    this.status = status;
    this.updateActivity();
  }

  public startGame(initiator: User): void {
    this.validateGameStateChange(GameStatusType.ACTIVE, initiator);
    this.setStatus({
      type: GameStatusType.ACTIVE,
      timestamp: Date.now(),
      roundNumber: 1,
      roundStartTime: Date.now(),
    });
    this.onGameStart();
    this.startTime = Date.now();
    this.updateActivity();
    logger.info(`Game started by ${initiator} in ${this}`);
  }

  public stopGame(initiator?: User): void {
    this.validateGameStateChange(GameStatusType.WAITING, initiator);
    this.onGameStop();
    this.setStatus({ type: GameStatusType.WAITING, timestamp: Date.now() });
    this.seats.forEach((seat) => {
      seat.ready = seat.actor?.kind === "bot";
    });
    this.updateActivity();
    const emitter = EventBroadcaster.getInstance();
    emitter.room(this);
    emitter.lobby();
    logger.info(`Game stopped in ${this}`);
  }

  public pauseGame(initiator: User): void {
    this.validateGameStateChange(GameStatusType.PAUSED, initiator);
    this.setStatus({
      type: GameStatusType.PAUSED,
      timestamp: Date.now(),
      reason: "user_paused",
      pausedBy: initiator.getState(),
    });
    this.onGamePause();
    this.updateActivity();
    EventBroadcaster.getInstance().room(this);
    logger.info(`Game paused by ${initiator} in ${this}`);
  }

  public resumeGame(initiator: User): void {
    this.validateGameStateChange(GameStatusType.ACTIVE, initiator);
    this.status.type = GameStatusType.ACTIVE;
    this.updatedAt = Date.now();
    this.onGameResume();
    this.updateActivity();
    EventBroadcaster.getInstance().room(this);
    logger.info(`Game resumed by ${initiator} in ${this}`);
  }

  public handleUserInput(user: User, controls: UserControls): void {
    if (this.status.type !== GameStatusType.ACTIVE) return;
    const seat = this.findUserSeat(user);
    if (seat) {
      this.inputHandlers[seat.index].update(controls);
    }
  }

  public override addUser(user: User, seatIndex: number) {
    if (this.status.type !== GameStatusType.WAITING) {
      throw new Error("Game is already in progress");
    }
    return super.addUser(user, seatIndex);
  }

  public override addBot(
    initiator: User,
    payload: {
      seatIndex?: number;
      difficulty?: BotDifficulty;
      name?: string;
    } = {}
  ) {
    if (this.status.type !== GameStatusType.WAITING) {
      throw new Error("Game is already in progress");
    }
    return super.addBot(initiator, payload);
  }

  public override removeBot(initiator: User, seatIndex: number) {
    if (this.status.type !== GameStatusType.WAITING) {
      throw new Error("Game is already in progress");
    }
    return super.removeBot(initiator, seatIndex);
  }

  public override updateBot(
    initiator: User,
    seatIndex: number,
    payload: { difficulty?: BotDifficulty; name?: string }
  ) {
    if (this.status.type !== GameStatusType.WAITING) {
      throw new Error("Game is already in progress");
    }
    return super.updateBot(initiator, seatIndex, payload);
  }

  public override removeUser(user: User): void {
    super.removeUser(user);
    if (
      this.status.type === GameStatusType.ACTIVE &&
      (this.getUserCount() < 1 || this.getActorCount() < 2)
    ) {
      this.stopGame();
    }
  }

  public getState(): Readonly<GameRoomState<G>> {
    return Object.freeze({
      ...this.getBaseState(),
      type: RoomType.GAME,
      gameState: this.gameState,
      status: this.status,
      startTime: this.startTime,
    });
  }

  protected validateGameStateChange(
    targetState: GameStatusType,
    initiator?: User
  ): void {
    const transition = BaseGameRoom.STATE_TRANSITIONS[targetState];

    if (!transition.fromStates.includes(this.status.type)) {
      throw new Error(
        `Cannot transition from ${this.status.type} to ${targetState}`
      );
    }

    if (
      transition.permission === GameStateChangePermission.SYSTEM &&
      initiator
    ) {
      throw new Error("This state change can only be initiated by the system");
    }

    if (
      !initiator &&
      transition.permission !== GameStateChangePermission.SYSTEM
    ) {
      throw new Error("Initiator is required for this state change");
    }

    if (
      transition.permission === GameStateChangePermission.HOST_ONLY &&
      initiator?.id !== this.hostId
    ) {
      throw new Error("Only the host can perform this action");
    }

    if (transition.validationRules) {
      for (const rule of transition.validationRules) {
        const error = (
          rule as (
            room: BaseGameRoom<G>,
            initiator?: User
          ) => string | null
        )(this, initiator);
        if (error) throw new Error(error);
      }
    }
  }

  /** Subclass owns sim bring-up. RealtimeGameRoom starts the ticker. */
  protected abstract onGameStart(): void;
  protected abstract onGameStop(): void;
  protected abstract onGamePause(): void;
  protected abstract onGameResume(): void;
}
