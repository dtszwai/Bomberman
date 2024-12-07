import { BattleScene } from "./scenes/BattleScene";
import {
  MAX_WINS,
  NUM_PLAYERS,
  SCREEN_HEIGHT,
  SCREEN_WIDTH,
} from "./constants/game";
import { Camera } from "@/engine";
import { createCanvasContext, removeCanvas } from "@/engine/context";
import {
  registerGamepadEvents,
  registerKeyEvents,
  unregisterGamepadEvents,
  unregisterKeyEvents,
} from "@/engine/inputHandler";
import { GameState } from "./types";
import { GameTime, Scene } from "@/engine/types";

/**
 * Class representing the main Bomberman game.
 * Manages game state, rendering, and the game loop.
 */
export class BombermanGame {
  /** Current active scene */
  private scene: Scene;
  /** Canvas rendering context */
  private context: CanvasRenderingContext2D;
  /** Camera handling viewport transformations */
  private camera: Camera;
  /** Tracks time between frames */
  private frameTime: GameTime;
  /** Tracks players' win counts and maximum allowed wins */
  private gameState: GameState;
  /** ID of the current animation frame for cancellation */
  private animationFrameId: number | null = null;

  /**
   * Creates an instance of BombermanGame.
   *
   * @param container - The HTML element to contain the game canvas.
   * @param width - The width of the game canvas. Defaults to SCREEN_WIDTH.
   * @param height - The height of the game canvas. Defaults to SCREEN_HEIGHT.
   */
  constructor(
    private container: HTMLElement,
    width = SCREEN_WIDTH,
    height = SCREEN_HEIGHT
  ) {
    this.frameTime = { previous: 0, secondsPassed: 0 };
    this.gameState = {
      wins: new Array(NUM_PLAYERS).fill(0),
      maxWins: MAX_WINS,
    };
    this.context = createCanvasContext(container, width, height);
    this.camera = new Camera(0, 0);
    this.scene = this.createBattleScene(-1);
  }

  /**
   * The main game loop, called on each animation frame.
   *
   * @param currentTime - The current timestamp provided by requestAnimationFrame.
   */
  private frame = (currentTime: DOMHighResTimeStamp) => {
    this.animationFrameId = window.requestAnimationFrame(this.frame);
    // Calculate time passed
    const delta = (currentTime - this.frameTime.previous) / 1000;
    this.frameTime.secondsPassed = delta;
    this.frameTime.previous = currentTime;

    // Update and render the scene
    this.scene.update(this.frameTime, this.context, this.camera);
    this.scene.draw(this.context, this.camera);
  };

  /**
   * Creates a new BattleScene, optionally incrementing the win count for a player.
   *
   * @param winnerId - The ID of the player who won the previous battle. Use -1 if no winner.
   * @returns A new instance of BattleScene.
   */
  private createBattleScene = (winnerId: number): Scene => {
    if (winnerId >= 0) this.gameState.wins[winnerId]++;

    return new BattleScene(
      this.frameTime,
      this.camera,
      this.gameState,
      (winnerId) => (this.scene = this.createBattleScene(winnerId))
    );
  };

  /**
   * Starts the game by registering input events and initiating the game loop.
   */
  public start() {
    registerKeyEvents();
    registerGamepadEvents();
    this.animationFrameId ??= window.requestAnimationFrame(this.frame);
  }

  /**
   * Stops the game by unregistering input events, removing the canvas, and cancelling the game loop.
   */
  public stop() {
    unregisterKeyEvents();
    unregisterGamepadEvents();
    removeCanvas(this.container);
    // Cancel the animation frame if it exists
    if (this.animationFrameId !== null) {
      window.cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }
}
