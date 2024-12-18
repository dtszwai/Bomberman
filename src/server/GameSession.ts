import { Server } from "socket.io";
import { GameStatus, RoomState, PlayerControls } from "./types";
import { BattleScene } from "@/game/scenes/BattleScene";
import { GameState } from "@/game/types";
import { FRAME_TIME, MAX_WINS } from "@/game/constants";
import { Events, ServerEvents } from "@/events";
import { logger } from "./logger";
import { ActionHandler } from "@/game/engine/ActionHandler";

export class GameSession {
  private readonly settings = {
    tickRate: FRAME_TIME,
    maxWins: MAX_WINS,
    roundStartDelay: 3000,
    inactivityTimeout: 30000,
  };

  private battleScene: BattleScene;
  private lastUpdateTime = Date.now();
  private gameLoop: NodeJS.Timeout | null = null;
  private gameStatus = GameStatus.INITIALIZING;
  private gameState: GameState;
  private inputHandlers: ActionHandler[] = [];

  /**
   * Creates an instance of GameController.
   *
   * @param io - The Socket.io server instance.
   * @param room - The room for which this controller manages the game.
   */
  constructor(private io: Server, private room: RoomState) {
    this.gameState = {
      wins: new Array(this.room.players.length).fill(0),
      maxWins: this.settings.maxWins,
    };

    this.room.players.forEach((_) => {
      this.inputHandlers.push(new ActionHandler());
    });

    this.battleScene = new BattleScene(
      this.gameState,
      this.onRoundEnd,
      this.inputHandlers
    );
  }

  /**
   * Starts the game loop.
   */
  public start() {
    this.gameStatus = GameStatus.ACTIVE;
    this.lastUpdateTime = Date.now();
    this.gameLoop = setInterval(() => this.update(), this.settings.tickRate);
    logger.info(`Game started for room ${this.room.id}`);
  }

  /**
   * Stops the game loop and performs necessary cleanup.
   */
  public stop() {
    if (this.gameLoop) {
      clearInterval(this.gameLoop);
      this.gameLoop = null;
    }

    this.gameStatus = GameStatus.GAME_ENDED;
    logger.info(`Game stopped for room ${this.room.id}`);
  }

  public pause() {
    this.gameStatus = GameStatus.PAUSED;
    if (this.gameLoop) {
      clearInterval(this.gameLoop);
      this.gameLoop = null;
    }
    this.io.to(this.room.id).emit(Events.GAME_PAUSED);
  }

  public resume() {
    this.gameStatus = GameStatus.ACTIVE;
    this.lastUpdateTime = Date.now();
    this.gameLoop = setInterval(() => this.update(), this.settings.tickRate);
    this.io.to(this.room.id).emit(Events.GAME_RESUMED);
  }

  private update() {
    if (this.gameStatus !== GameStatus.ACTIVE) return;

    const currentTime = Date.now();
    const delta = (currentTime - this.lastUpdateTime) / 1000;
    this.lastUpdateTime = currentTime;

    this.battleScene.update({ previous: currentTime, secondsPassed: delta });
    this.broadcastGameState();
  }

  private onRoundEnd = (winnerId: number): void => {
    this.gameStatus = GameStatus.ROUND_ENDED;

    if (winnerId >= 0) {
      this.gameState.wins[winnerId]++;
    }

    const isGameEnd = this.gameState.wins[winnerId] >= this.settings.maxWins;

    if (isGameEnd) {
      this.gameStatus = GameStatus.GAME_ENDED;
      const result: ServerEvents["gameEnded"] = {
        winnerId: this.room.players[winnerId].id,
        score: this.gameState.wins,
      };
      this.io.to(this.room.id).emit(Events.GAME_ENDED, result);
      this.stop();
    } else {
      setTimeout(() => {
        this.battleScene = new BattleScene(
          this.gameState,
          this.onRoundEnd,
          this.inputHandlers
        );
        this.gameStatus = GameStatus.ACTIVE;
        this.io.to(this.room.id).emit(Events.ROUND_START);
      }, this.settings.roundStartDelay);
    }
  };

  public handlePlayerInput(playerId: string, controls: PlayerControls) {
    if (this.gameStatus !== GameStatus.ACTIVE) return;
    const playerIndex = this.room.players.findIndex((p) => p.id === playerId);
    if (playerIndex < 0) return;
    console.log(this.inputHandlers[0]);
    this.inputHandlers[playerIndex].update(controls);
  }

  public handlePlayerDisconnect(_playerId: string) {
    const remainingPlayers = this.room.players.length - 1;

    if (remainingPlayers < 2) {
      this.stop();
    } else {
      this.pause();
    }
  }

  private broadcastGameState(): void {
    const gameState: ServerEvents["gameState"] = {
      ...this.battleScene.serialize(),
      status: this.gameStatus,
      hud: {
        time: {
          previous: this.lastUpdateTime,
          secondsPassed: this.settings.tickRate / 1000,
        },
        state: {
          wins: this.gameState.wins,
          maxWins: this.settings.maxWins,
        },
      },
    };
    this.io.to(this.room.id).emit(Events.GAME_STATE, gameState);
  }
}
