import {
  UserControls,
  OperationResult,
  GameStatus,
  GameRoomState,
  RoomSettings,
  RoomType,
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
}

enum GameStateChangePermission {
  HOST_ONLY,
  ANY_PLAYER,
  SYSTEM,
}

interface GameStateTransition {
  fromStates: GameStatus[];
  permission: GameStateChangePermission;
  validationRules?: ((room: GameRoom, initiator?: User) => string | null)[];
}

export class GameRoom extends Room {
  private static readonly DEFAULT_GAME_SETTINGS: GameSettings = {
    tickRate: FRAME_TIME,
    maxWins: MAX_WINS,
    roundStartDelay: 3000,
  };

  private static readonly STATE_TRANSITIONS: Record<
    GameStatus,
    GameStateTransition
  > = {
    [GameStatus.ACTIVE]: {
      fromStates: [GameStatus.WAITING, GameStatus.PAUSED],
      permission: GameStateChangePermission.HOST_ONLY,
      validationRules: [
        (room) =>
          room.getUserCount() < 2 ? "Need at least 2 users to start" : null,
        (room) => (!room.isAllReady() ? "Not all users are ready" : null),
        (room, initiator) => {
          if (room.gameStatus === GameStatus.WAITING) {
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
            room.gameStatus === GameStatus.PAUSED &&
            initiator?.id !== room.hostId
          ) {
            return "Only the host can resume the game";
          }
          return null;
        },
      ],
    },
    [GameStatus.PAUSED]: {
      fromStates: [GameStatus.ACTIVE],
      permission: GameStateChangePermission.HOST_ONLY,
      validationRules: [
        (room, initiator) =>
          initiator?.id !== room.hostId
            ? "Only the host can pause the game"
            : null,
      ],
    },
    [GameStatus.WAITING]: {
      fromStates: [
        GameStatus.ACTIVE,
        GameStatus.PAUSED,
        GameStatus.ROUND_ENDED,
      ],
      permission: GameStateChangePermission.SYSTEM,
      validationRules: [
        (_, initiator) =>
          initiator ? "Only system can set game to waiting state" : null,
      ],
    },
    [GameStatus.ROUND_ENDED]: {
      fromStates: [GameStatus.ACTIVE],
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
  public gameStatus: GameStatus;
  private gameState: GameState;
  private inputHandlers: ActionHandler[];
  private readonly gameSettings: GameSettings;
  public startTime?: number;

  constructor(host: User, roomName?: string) {
    super(host, roomName);
    this.gameStatus = GameStatus.WAITING;
    this.gameSettings = { ...GameRoom.DEFAULT_GAME_SETTINGS };
    this.gameState = {
      wins: new Array(this.seats.length),
      maxWins: this.gameSettings.maxWins,
    };
    this.inputHandlers = this.seats.map(() => new ActionHandler());
  }

  public startGame(initiator: User): OperationResult {
    const validationError = this.validateGameStateChange(
      GameStatus.ACTIVE,
      initiator
    );
    if (validationError) {
      return { success: false, message: validationError };
    }

    try {
      // Initialize wins array for occupied seats before starting the game
      this.gameState.wins = this.seats.map((seat) => (seat.user ? 0 : -1));

      this.gameStatus = GameStatus.ACTIVE;
      this.battleScene = this.createBattleScene();
      this.startGameLoop();
      this.startTime = Date.now();

      this.updateActivity();
      logger.info(`Game started for room ${this.id}`);
      return { success: true };
    } catch (error) {
      logger.error(`Failed to start game for room ${this.id}`, error as Error);
      return {
        success: false,
        message: `Failed to start game: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      };
    }
  }

  public stopGame(initiator?: User): OperationResult {
    const validationError = this.validateGameStateChange(
      GameStatus.WAITING,
      initiator
    );
    if (validationError) {
      return { success: false, message: validationError };
    }

    try {
      this.stopGameLoop();
      this.gameStatus = GameStatus.WAITING;
      this.battleScene = undefined;
      this.seats.forEach((seat) => {
        seat.ready = false;
      });
      this.updateActivity();
      logger.info(`Game stopped for room ${this.id}`);
      return { success: true };
    } catch (error) {
      logger.error(`Failed to stop game for room ${this.id}`, error as Error);
      return {
        success: false,
        message: `Failed to stop game: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      };
    }
  }

  public pauseGame(initiator: User): OperationResult {
    const validationError = this.validateGameStateChange(
      GameStatus.PAUSED,
      initiator
    );
    if (validationError) {
      return { success: false, message: validationError };
    }

    try {
      this.gameStatus = GameStatus.PAUSED;
      this.stopGameLoop();
      this.updateActivity();
      emitter.pause(this);
      return { success: true };
    } catch (error) {
      logger.error(`Failed to pause game for room ${this.id}`, error as Error);
      return {
        success: false,
        message: `Failed to pause game: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      };
    }
  }

  public resumeGame(initiator: User): OperationResult {
    const validationError = this.validateGameStateChange(
      GameStatus.ACTIVE,
      initiator
    );
    if (validationError) {
      return { success: false, message: validationError };
    }

    try {
      this.gameStatus = GameStatus.ACTIVE;
      this.updatedAt = Date.now();
      this.startGameLoop();
      this.updateActivity();
      emitter.resume(this);
      return { success: true };
    } catch (error) {
      logger.error(`Failed to resume game for room ${this.id}`, error as Error);
      return {
        success: false,
        message: `Failed to resume game: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      };
    }
  }

  public handleUserInput(user: User, controls: UserControls): void {
    if (this.gameStatus !== GameStatus.ACTIVE) return;

    const seat = this.findUserSeat(user);
    if (seat) {
      this.inputHandlers[seat.index].update(controls);
    }
  }

  public override addUser(
    user: User,
    seatIndex: number
  ): OperationResult<GameRoomState> {
    if (this.gameStatus !== GameStatus.WAITING) {
      return { success: false, message: "Game is already in progress" };
    }
    const result = super.addUser(user, seatIndex);
    if (result.success) {
      return {
        success: true,
        data: this.getState(),
      };
    }
    return {
      success: false,
      message: result.message,
    };
  }

  public override removeUser(user: User): OperationResult {
    const result = super.removeUser(user);
    if (!result.success) {
      return result;
    }

    // Stop the game if there are not enough users
    if (this.gameStatus === GameStatus.ACTIVE) {
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
    if (this.gameStatus !== GameStatus.ACTIVE || !this.battleScene) return;

    const currentTime = Date.now();
    const delta = (currentTime - this.updatedAt) / 1000;
    this.updatedAt = currentTime;

    this.battleScene.update({ previous: currentTime, secondsPassed: delta });
    this.broadcastGameSnapshot();
  }

  private createBattleScene = (): BattleScene =>
    new BattleScene(this.gameState, this.handleRoundEnd, this.inputHandlers);

  private handleRoundEnd = (seatIndex: number) => {
    this.gameStatus = GameStatus.ROUND_ENDED;
    this.gameState.wins[seatIndex]++;

    const isGameEnd =
      this.gameState.wins[seatIndex] >= this.gameSettings.maxWins;

    if (isGameEnd) {
      this.handleGameEnd(this.seats[seatIndex].user!);
    } else {
      this.startNextRound();
    }
  };

  private handleGameEnd(winner: User) {
    const winnerIndex = this.seats.findIndex((seat) => seat.user === winner);
    const result = {
      winner: this.seats[winnerIndex].user!,
      score: this.gameState.wins,
    };
    emitter.end(this, result);
    this.stopGame(winner);
  }

  private startNextRound() {
    setTimeout(() => {
      this.battleScene = this.createBattleScene();
      this.gameStatus = GameStatus.ACTIVE;
      emitter.start(this);
    }, this.gameSettings.roundStartDelay);
  }

  private broadcastGameSnapshot(): void {
    if (!this.battleScene) return;

    const snapshot = {
      ...this.battleScene.serialize(),
      status: this.gameStatus,
    };
    emitter.gameSnapshot(this, snapshot);
  }

  public override getState = (): Readonly<GameRoomState> =>
    Object.freeze({
      ...this.getBaseState(),
      gameStatus: this.gameStatus,
      gameState: this.gameState,
      startTime: this.startTime,
    });

  private validateGameStateChange(
    targetState: GameStatus,
    initiator?: User
  ): string | null {
    const transition = GameRoom.STATE_TRANSITIONS[targetState];

    // Validate state transition
    if (!transition.fromStates.includes(this.gameStatus)) {
      return `Cannot transition from ${this.gameStatus} to ${targetState}`;
    }

    // Handle system-initiated changes
    if (
      transition.permission === GameStateChangePermission.SYSTEM &&
      initiator
    ) {
      return "This state change can only be initiated by the system";
    }

    // Handle disconnected users
    if (
      !initiator &&
      transition.permission !== GameStateChangePermission.SYSTEM
    ) {
      return "Initiator is required for this state change";
    }

    // Validate permissions
    if (
      transition.permission === GameStateChangePermission.HOST_ONLY &&
      initiator?.id !== this.hostId
    ) {
      return "Only the host can perform this action";
    }

    // Run additional validation rules
    if (transition.validationRules) {
      for (const rule of transition.validationRules) {
        const error = rule(this, initiator);
        if (error) return error;
      }
    }

    return null;
  }

  public static create(
    host: User,
    roomName?: string,
    settings: Partial<RoomSettings> = {}
  ): OperationResult<GameRoom | void> {
    try {
      const room = new GameRoom(host, roomName);
      const settingsResult = room.updateSettings(settings);
      if (!settingsResult.success) {
        Room.counter--;
        host.setPosition(undefined);
        return settingsResult;
      }
      room.seats[0].user = host;
      return { success: true, data: room };
    } catch (error) {
      logger.error("Failed to create game room", error as Error);
      host.setPosition(undefined);
      return {
        success: false,
        message: `Failed to create game room: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      };
    }
  }
}
