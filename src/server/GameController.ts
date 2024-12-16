import { Server } from "socket.io";
import { IRoom } from "./types";

import { BattleScene, GameSnapshot } from "@/game/scenes/BattleScene";
import { GameState } from "@/game/types";

/**
 * Class representing the server-side controller for a single game room.
 * Manages the game loop, updates the BattleScene, and communicates with clients.
 */
export class GameController {
  /** Reference to the Socket.io server */
  private io: Server;

  /** The room associated with this game controller */
  private room: IRoom;

  /** The current game state */
  private gameState: GameState;

  /** Instance of BattleScene managing the game logic */
  private battleScene: BattleScene;

  /** Timer ID for the game loop */
  private gameLoopInterval: NodeJS.Timeout | null = null;

  /** Tick rate for the game loop (e.g., 60 FPS) */
  private readonly TICK_RATE = 1000 / 60;

  /** Timestamp of the last update */
  private lastUpdateTime = Date.now();

  /**
   * Creates an instance of GameController.
   *
   * @param io - The Socket.io server instance.
   * @param room - The room for which this controller manages the game.
   */
  constructor(io: Server, room: IRoom) {
    this.io = io;
    this.room = room;
    this.gameState = {
      wins: new Array(this.room.players.length).fill(0),
      maxWins: 3, // Example value; adjust as needed
    };
    this.battleScene = new BattleScene(this.gameState, this.handleGameEnd);
  }

  /**
   * Starts the game loop.
   */
  public start() {
    if (this.gameLoopInterval) return; // Prevent multiple loops

    this.gameLoopInterval = setInterval(() => this.gameLoop(), this.TICK_RATE);
    console.log(`Game started for room ${this.room.id}`);
  }

  /**
   * Stops the game loop and performs necessary cleanup.
   */
  public stop() {
    if (this.gameLoopInterval) {
      clearInterval(this.gameLoopInterval);
      this.gameLoopInterval = null;
      console.log(`Game stopped for room ${this.room.id}`);
    }
  }

  /**
   * The main game loop. Updates the game state and emits snapshots to clients.
   */
  private gameLoop() {
    const currentTime = Date.now();
    const deltaSeconds = (currentTime - this.lastUpdateTime) / 1000;
    this.lastUpdateTime = currentTime;

    // Update the BattleScene
    this.battleScene.update({
      previous: currentTime,
      secondsPassed: deltaSeconds,
    });

    // Serialize the current game state
    const snapshot: GameSnapshot = this.battleScene.serialize();

    // Emit the snapshot to all clients in the room
    this.io.to(this.room.id).emit("gameState", snapshot);
  }

  /**
   * Callback invoked when the game ends.
   *
   * @param winnerId - The ID of the winning player, or -1 if no winner.
   */
  private handleGameEnd = (winnerId: number) => {
    this.stop();

    if (winnerId >= 0) {
      this.gameState.wins[winnerId]++;
      // Check if any player has reached the maximum number of wins
      const maxWin = this.gameState.wins[winnerId] >= this.gameState.maxWins;
      if (maxWin) {
        this.io.to(this.room.id).emit("gameOver", { winnerId });
        // Optionally, perform additional cleanup or reset
        return;
      }
    }

    // Optionally, restart the game or handle next round
    // For example:
    // this.battleScene = new BattleScene(this.gameState, this.handleGameEnd);
    // this.start();
  };

  /**
   * Handles player input received from clients.
   *
   * @param playerId - The ID of the player sending the input.
   * @param input - The input data.
   */
  public handlePlayerInput(_playerId: string, _input: unknown) {
    // Process the input and update the BattleScene accordingly
    // Example:
    // this.battleScene.processInput(playerId, input);
  }
}
