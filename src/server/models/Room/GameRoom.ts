import {
  UserControls,
  GameStatus,
  GameRoomState,
  RoomSettings,
  RoomType,
  GameStatusType,
} from "../../types";
import { BattleScene } from "@/game/scenes/BattleScene";
import { GameState } from "@/game/types";
import { FRAME_TIME, MAX_WINS } from "@/game/constants";
import { logger } from "../../utils/logger";
import { ActionHandler } from "@/server/utils/ActionHandler";
import { Room, User } from "..";
import { emitter } from "../..";

interface GameSettings {
  tickRate: number;
  maxWins: number;
  roundStartDelay: number;
  gameTerminationDelay: number;
}

enum GameStateChangePermission {
  HOST_ONLY,
  ANY_PLAYER,
  SYSTEM,
}

interface GameStateTransition {
  fromStates: GameStatusType[];
  permission: GameStateChangePermission;
  validationRules?: ((room: GameRoom, initiator?: User) => string | null)[];
}

export class GameRoom extends Room {
  private static readonly DEFAULT_GAME_SETTINGS: GameSettings = {
    tickRate: FRAME_TIME,
    maxWins: MAX_WINS,
    roundStartDelay: 5000, // 5 seconds
    gameTerminationDelay: 10000, // 10 seconds
  };

  private static readonly STATE_TRANSITIONS: Record<
    GameStatusType,
    GameStateTransition
  > = {
    [GameStatusType.ACTIVE]: {
      fromStates: [GameStatusType.WAITING, GameStatusType.PAUSED],
      permission: GameStateChangePermission.HOST_ONLY,
      validationRules: [
        (room) =>
          room.getUserCount() < 2 ? "Need at least 2 users to start" : null,
        (room) => (!room.isAllReady() ? "Not all users are ready" : null),
        (room, initiator) => {
          if (room.status.type === GameStatusType.WAITING) {
            if (initiator?.id !== room.hostId) {
              return "Only the host can start the game";
            }
            if (room.getUserCount() < 2) {
              return "Need at least 2 users to start";
            }
            if (!room.isAllReady()) {
              return "Not all users are ready";
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

  public readonly type = RoomType.GAME;

  // Game-specific properties
  private battleScene?: BattleScene;
  private gameLoop?: NodeJS.Timeout;
  public status: GameStatus;
  private gameState: GameState;
  private inputHandlers: ActionHandler[];
  private readonly gameSettings: GameSettings;
  public startTime?: number;
  private roundNumber: number;

  constructor(host: User, roomName?: string) {
    super(host, roomName);
    this.status = { type: GameStatusType.WAITING, timestamp: Date.now() };
    this.gameSettings = { ...GameRoom.DEFAULT_GAME_SETTINGS };
    this.gameState = {
      wins: new Array(this.seats.length),
      maxWins: this.gameSettings.maxWins,
    };
    this.inputHandlers = this.seats.map(() => new ActionHandler());
    this.roundNumber = 1;
  }

  private setStatus(status: GameStatus) {
    this.status = status;
    this.updateActivity();
  }

  public startGame(initiator: User): void {
    this.validateGameStateChange(GameStatusType.ACTIVE, initiator);

    // Initialize wins array for occupied seats before starting the game
    this.gameState.wins = this.seats.map((seat) => (seat.user ? 0 : -1));

    this.setStatus({
      type: GameStatusType.ACTIVE,
      timestamp: Date.now(),
      roundNumber: 1,
      roundStartTime: Date.now(),
    });
    this.battleScene = this.createBattleScene();
    this.startGameLoop();
    this.startTime = Date.now();

    this.updateActivity();
    logger.info(`Game started for room ${this.id}`);
  }

  public stopGame(initiator?: User): void {
    this.validateGameStateChange(GameStatusType.WAITING, initiator);

    this.stopGameLoop();
    this.setStatus({ type: GameStatusType.WAITING, timestamp: Date.now() });
    this.battleScene = undefined;
    this.seats.forEach((seat) => {
      seat.ready = false;
    });
    this.updateActivity();
    emitter.room(this);
    logger.info(`Game stopped for room ${this.id}`);
  }

  public pauseGame(initiator: User): void {
    this.validateGameStateChange(GameStatusType.PAUSED, initiator);

    this.setStatus({
      type: GameStatusType.PAUSED,
      timestamp: Date.now(),
      reason: "user_paused",
      pausedBy: initiator,
    });
    this.stopGameLoop();
    this.updateActivity();
    emitter.room(this);
  }

  public resumeGame(initiator: User): void {
    this.validateGameStateChange(GameStatusType.ACTIVE, initiator);

    this.status.type = GameStatusType.ACTIVE;
    this.updatedAt = Date.now();
    this.startGameLoop();
    this.updateActivity();
    emitter.room(this);
  }

  public handleUserInput(user: User, controls: UserControls): void {
    if (this.status.type !== GameStatusType.ACTIVE) return;

    const seat = this.findUserSeat(user);
    if (seat) {
      this.inputHandlers[seat.index].update(controls);
    }
  }

  public override addUser(user: User, seatIndex: number): GameRoomState {
    if (this.status.type !== GameStatusType.WAITING) {
      throw new Error("Game is already in progress");
    }
    return super.addUser(user, seatIndex);
  }

  public override removeUser(user: User): void {
    const result = super.removeUser(user);

    // Stop the game if there are not enough users
    if (this.status.type === GameStatusType.ACTIVE) {
      if (this.getUserCount() < 2) {
        this.stopGame();
      }
    }
    return result;
  }

  // Private helper methods
  private startGameLoop() {
    this.gameLoop = setInterval(
      () => this.update(),
      this.gameSettings.tickRate
    );
  }

  private stopGameLoop() {
    if (this.gameLoop) {
      clearInterval(this.gameLoop);
      this.gameLoop = undefined;
    }
  }

  private update() {
    if (this.status.type !== GameStatusType.ACTIVE || !this.battleScene) return;

    const currentTime = Date.now();
    const delta = (currentTime - this.updatedAt) / 1000;
    this.updatedAt = currentTime;

    this.battleScene.update({ previous: currentTime, secondsPassed: delta });
    this.broadcastGameSnapshot();
  }

  private createBattleScene = (): BattleScene =>
    new BattleScene(this.gameState, this.handleRoundEnd, this.inputHandlers);

  private handleRoundEnd = (seatIndex: number) => {
    const now = Date.now();
    this.gameState.wins[seatIndex]++;

    const isGameEnd =
      this.gameState.wins[seatIndex] >= this.gameSettings.maxWins;

    this.setStatus({
      type: GameStatusType.ROUND_ENDED,
      timestamp: now,
      roundNumber: this.roundNumber++,
      roundEndTime: now,
      winner: this.seats[seatIndex].user!.getState(),
      state: isGameEnd
        ? {
            isGameOver: true,
            scoreboard: this.gameState.wins
              .filter((wins) => wins >= 0)
              .map((wins, index) => ({
                user: this.seats[index].user!.getState(),
                wins,
              })),
            terminationTime: now + this.gameSettings.gameTerminationDelay,
          }
        : {
            isGameOver: false,
            nextRoundStartTime: now + this.gameSettings.roundStartDelay,
          },
    });

    emitter.room(this);
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
        roundNumber: this.gameState.wins.reduce((acc, wins) => acc + wins, 0),
        roundStartTime: time + this.gameSettings.roundStartDelay,
      });
      emitter.room(this);
    }, this.gameSettings.roundStartDelay);
  }

  private broadcastGameSnapshot(): void {
    if (!this.battleScene) return;

    const snapshot = {
      ...this.battleScene.serialize(),
      status: this.status,
    };
    emitter.gameSnapshot(this, snapshot);
  }

  public override getState = (): Readonly<GameRoomState> =>
    Object.freeze({
      ...this.getBaseState(),
      gameState: this.gameState,
      status: this.status,
      startTime: this.startTime,
    });

  private validateGameStateChange(
    targetState: GameStatusType,
    initiator?: User
  ): void {
    const transition = GameRoom.STATE_TRANSITIONS[targetState];

    // Validate state transition
    if (!transition.fromStates.includes(this.status.type)) {
      throw new Error(
        `Cannot transition from ${this.status.type} to ${targetState}`
      );
    }

    // Handle system-initiated changes
    if (
      transition.permission === GameStateChangePermission.SYSTEM &&
      initiator
    ) {
      throw new Error("This state change can only be initiated by the system");
    }

    // Handle disconnected users
    if (
      !initiator &&
      transition.permission !== GameStateChangePermission.SYSTEM
    ) {
      throw new Error("Initiator is required for this state change");
    }

    // Validate permissions
    if (
      transition.permission === GameStateChangePermission.HOST_ONLY &&
      initiator?.id !== this.hostId
    ) {
      throw new Error("Only the host can perform this action");
    }

    // Run additional validation rules
    if (transition.validationRules) {
      for (const rule of transition.validationRules) {
        const error = rule(this, initiator);
        if (error) throw new Error(error);
      }
    }
  }

  public static create(
    host: User,
    roomName?: string,
    settings: Partial<RoomSettings> = {}
  ): GameRoom {
    try {
      const room = new GameRoom(host, roomName);
      room.updateSettings(settings);
      room.seats[0].user = host;
      return room;
    } catch (error) {
      logger.error("Failed to create game room", error as Error);
      host.setPosition(undefined);
      throw new Error("Failed to create game room");
    }
  }
}
