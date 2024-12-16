import { Server } from "socket.io";
import { GameStatus, RoomState, PlayerAction } from "./types";
import { BattleScene } from "@/game/scenes/BattleScene";
import { GameState } from "@/game/types";
import { FRAME_TIME, MAX_WINS } from "@/game/constants";
import { Events, ServerEvents } from "@/events";

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
    this.battleScene = new BattleScene(this.gameState, this.onRoundEnd);
  }

  /**
   * Starts the game loop.
   */
  public start() {
    this.gameStatus = GameStatus.ACTIVE;
    this.lastUpdateTime = Date.now();
    this.gameLoop = setInterval(() => this.update(), this.settings.tickRate);
    console.log(`Game started for room ${this.room.id}`);
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
    console.log(`Game stopped for room ${this.room.id}`);
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
    const deltaTime = currentTime - this.lastUpdateTime;
    this.lastUpdateTime = currentTime;

    this.battleScene.update({
      previous: currentTime,
      secondsPassed: deltaTime / 1000,
    });
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
        this.battleScene = new BattleScene(this.gameState, this.onRoundEnd);
        this.gameStatus = GameStatus.ACTIVE;
        this.io.to(this.room.id).emit(Events.ROUND_START);
      }, this.settings.roundStartDelay);
    }
  };

  public handlePlayerInput(_playerId: string, _action: PlayerAction) {
    if (this.gameStatus !== GameStatus.ACTIVE) return;
    // Future: Transform player actions into game commands
    // For now, the BattleScene handles the raw actions
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
    };
    this.io.to(this.room.id).emit(Events.GAME_STATE, gameState);
  }
}
