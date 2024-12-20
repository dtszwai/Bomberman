import {
  UserControls,
  OperationResult,
  GameStatus,
  GameRoomState,
  RoomSettings,
} from "../types";
import { BattleScene } from "@/game/scenes/BattleScene";
import { GameState } from "@/game/types";
import { FRAME_TIME, MAX_WINS } from "@/game/constants";
import { logger } from "../utils/logger";
import { ActionHandler } from "@/server/utils/ActionHandler";
import { Room } from "./Room";
import { User } from "./User";
import { emitter } from "..";

interface GameSettings {
  tickRate: number;
  maxWins: number;
  roundStartDelay: number;
}

export class GameRoom extends Room {
  private static readonly DEFAULT_GAME_SETTINGS: GameSettings = {
    tickRate: FRAME_TIME,
    maxWins: MAX_WINS,
    roundStartDelay: 3000,
  };

  // Game-specific properties
  private battleScene?: BattleScene;
  private gameLoop?: NodeJS.Timeout;
  private gameStatus;
  private gameState: GameState;
  private inputHandlers: ActionHandler[];
  private readonly gameSettings: GameSettings;
  public startTime?: number;

  constructor(host: User, roomName?: string) {
    super(host, roomName);
    this.gameStatus = GameStatus.WAITING;
    this.gameSettings = { ...GameRoom.DEFAULT_GAME_SETTINGS };
    this.gameState = {
      wins: new Array(this.seats.length).fill(0),
      maxWins: this.gameSettings.maxWins,
    };
    this.inputHandlers = this.seats.map(() => new ActionHandler());
  }

  public startGame(initiator: User): OperationResult {
    const validationError = this.validateGameStart(initiator);
    if (validationError) {
      return { success: false, message: validationError };
    }

    try {
      this.gameStatus = GameStatus.ACTIVE;
      this.battleScene = this.createBattleScene();
      this.startGameLoop();

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

  public stopGame(initiator: User): OperationResult {
    const validationError = this.validateGameStateChange(initiator);
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

  public pauseGame(initiaotr: User): OperationResult {
    const validationError = this.validateGameStateChange(initiaotr);
    if (validationError) {
      return { success: false, message: validationError };
    }
    if (this.gameStatus !== GameStatus.ACTIVE) {
      return { success: false, message: "Game must be active to pause" };
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
    const validationError = this.validateGameStateChange(initiator);
    if (validationError) {
      return { success: false, message: validationError };
    }
    if (this.gameStatus !== GameStatus.PAUSED) {
      return { success: false, message: "Game must be paused to resume" };
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
        this.stopGame(user);
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
      ...super.getState(),
      type: "game",
      gameStatus: this.gameStatus,
      gameState: this.gameState,
    });

  private validateGameStart(initiator: User): string | null {
    if (initiator.id !== this.hostId) return "Only the host can start the game";
    if (this.gameStatus !== GameStatus.WAITING)
      return "Game is already in progress";
    if (this.getUserCount() < 2) return "Need at least 2 users to start";
    if (!this.isAllReady()) return "Not all users are ready";
    return null;
  }

  private validateGameStateChange(initiator: User): string | null {
    if (!this.findUserSeat(initiator)) {
      return "User not in this room";
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
