import { Server } from "socket.io";
import { GameStatus, RoomState, PlayerControls, GameSettings } from "./types";
import { BattleScene } from "@/game/scenes/BattleScene";
import { GameState } from "@/game/types";
import { FRAME_TIME, MAX_WINS } from "@/game/constants";
import { Events, ServerEvents } from "@/events";
import { logger } from "./logger";
import { ActionHandler } from "@/server/ActionHandler";

export class GameSession {
  private static readonly DEFAULT_SETTINGS: GameSettings = {
    tickRate: FRAME_TIME,
    maxWins: MAX_WINS,
    roundStartDelay: 3000,
    inactivityTimeout: 30000,
  };

  private battleScene: BattleScene;
  private lastUpdateTime: number;
  private gameLoop?: NodeJS.Timeout;
  private gameStatus = GameStatus.INITIALIZING;
  private readonly gameState: GameState;
  private readonly inputHandlers: ActionHandler[] = [];
  private readonly settings: GameSettings;

  /**
   * Creates an instance of GameController.
   *
   * @param io - The Socket.io server instance.
   * @param room - The room for which this controller manages the game.
   */
  constructor(
    private readonly io: Server,
    private readonly room: RoomState,
    settings: Partial<GameSettings> = {}
  ) {
    this.settings = { ...GameSession.DEFAULT_SETTINGS, ...settings };
    this.lastUpdateTime = Date.now();
    this.gameState = {
      wins: new Array(this.room.players.length).fill(0),
      maxWins: this.settings.maxWins,
    };
    this.inputHandlers = this.room.players.map(() => new ActionHandler());
    this.battleScene = this.createBattleScene();
  }

  public start() {
    if (this.gameStatus !== GameStatus.INITIALIZING) {
      logger.warn(`Attempted to start game in ${this.gameStatus} state`);
    }

    this.gameStatus = GameStatus.ACTIVE;
    this.lastUpdateTime = Date.now();
    this.startGameLoop();
    logger.info(`Game started for room ${this.room.id}`);
  }

  public stop() {
    this.stopGameLoop();
    this.gameStatus = GameStatus.GAME_ENDED;
    logger.info(`Game stopped for room ${this.room.id}`);

    this.io.to(this.room.id).emit(Events.ROOM_STATE, {
      ...this.room,
      started: false,
    } as ServerEvents["roomState"]);
  }

  public pause() {
    if (this.gameStatus !== GameStatus.ACTIVE) return;

    this.gameStatus = GameStatus.PAUSED;
    this.stopGameLoop();
    this.io.to(this.room.id).emit(Events.GAME_PAUSED);
  }

  public resume() {
    if (this.gameStatus !== GameStatus.PAUSED) return;
    this.gameStatus = GameStatus.ACTIVE;
    this.lastUpdateTime = Date.now();
    this.startGameLoop();
    this.io.to(this.room.id).emit(Events.GAME_RESUMED);
  }

  public handlePlayerInput(playerId: string, controls: PlayerControls) {
    if (this.gameStatus !== GameStatus.ACTIVE) return;

    const playerIndex = this.room.players.findIndex((p) => p.id === playerId);
    if (playerIndex >= 0) {
      this.inputHandlers[playerIndex].update(controls);
    }
  }

  public handlePlayerDisconnect(_playerId: string) {
    const remainingPlayers = this.room.players.length - 1;

    // TODO: Improve this logic
    if (remainingPlayers < 2) {
      this.stop();
    } else {
      this.pause();
    }
  }

  private startGameLoop() {
    this.gameLoop = setInterval(() => this.update(), this.settings.tickRate);
  }

  private stopGameLoop() {
    if (this.gameLoop) {
      clearInterval(this.gameLoop);
      this.gameLoop = undefined;
    }
  }

  private update() {
    if (this.gameStatus !== GameStatus.ACTIVE) return;

    const currentTime = Date.now();
    const delta = (currentTime - this.lastUpdateTime) / 1000;
    this.lastUpdateTime = currentTime;

    this.battleScene.update({ previous: currentTime, secondsPassed: delta });
    this.broadcastGameState();
  }

  private createBattleScene = (): BattleScene =>
    new BattleScene(this.gameState, this.handleRoundEnd, this.inputHandlers);

  private handleRoundEnd = (winnerId: number) => {
    if (this.gameStatus === GameStatus.GAME_ENDED) return;

    this.gameStatus = GameStatus.ROUND_ENDED;

    if (winnerId >= 0) {
      this.gameState.wins[winnerId]++;
    }

    const isGameEnd = this.gameState.wins[winnerId] >= this.settings.maxWins;

    if (isGameEnd) {
      this.handleGameEnd(winnerId);
    } else {
      this.startNextRound();
    }
  };

  private handleGameEnd(winnerId: number) {
    this.gameStatus = GameStatus.GAME_ENDED;
    const result = {
      winnerId: this.room.players[winnerId].id,
      score: this.gameState.wins,
    };
    this.io
      .to(this.room.id)
      .emit(Events.GAME_ENDED, result as ServerEvents["gameEnded"]);
    this.stop();
  }

  private startNextRound() {
    setTimeout(() => {
      this.battleScene = this.createBattleScene();
      this.gameStatus = GameStatus.ACTIVE;
      this.io.to(this.room.id).emit(Events.ROUND_START);
    }, this.settings.roundStartDelay);
  }

  private broadcastGameState(): void {
    const gameState = {
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
    this.io
      .to(this.room.id)
      .emit(Events.GAME_STATE, gameState as ServerEvents["gameState"]);
  }
}
