import {
  MAX_WINS,
  NUM_PLAYERS,
  SCREEN_HEIGHT,
  SCREEN_WIDTH,
} from "@/game/constants/game";
import { GameState } from "@/game/types";
import { BattleScene } from "@/game/scenes/BattleScene";
import {
  registerKeyEvents,
  unregisterKeyEvents,
} from "@/game/engine/inputHandler";
import { GameTime } from "@/game/engine/types";
import { Camera } from "@/views/Camera";
import { BattleSceneRenderer } from "@/views/BattleSceneRenderer";
import { createCanvasContext, removeCanvas } from "@/views/utils";

/**
 * Class representing the main Bomberman game.
 * Manages game state, rendering, and the game loop.
 */
export class BombermanGame {
  /** Current active scene */
  private scene: BattleScene;
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
  /** Renderer for the current scene */
  private renderer: BattleSceneRenderer;

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
    this.context = createCanvasContext(container, width, height).context;
    this.camera = new Camera(0, 0);
    this.scene = this.createBattleScene(-1);
    this.renderer = new BattleSceneRenderer(this.context, this.camera);
  }

  /**
   * The main game loop, called on each animation frame.
   *
   * @param currentTime - The current timestamp provided by requestAnimationFrame.
   */
  private frame = (currentTime: DOMHighResTimeStamp) => {
    this.animationFrameId = window.requestAnimationFrame(this.frame);

    // If it's the first frame, just set the time and return
    if (this.frameTime.previous === 0) {
      this.frameTime.previous = currentTime;
      return;
    }

    // Calculate time passed, capped at a maximum of 1/30th of a second to prevent huge jumps
    const delta = Math.min(
      (currentTime - this.frameTime.previous) / 1000,
      1 / 30
    );
    this.frameTime.secondsPassed = delta;
    this.frameTime.previous = currentTime;

    // Update and render the scene
    this.scene.update(this.frameTime);

    // Render the scene
    const snapshot = this.scene.serialize();
    this.renderer.update({
      ...snapshot,
      blocks: snapshot.blocks
        .map((block) => block.entity)
        .filter((entity) => typeof entity !== "undefined"),
      stage: snapshot.stage.tileMap,
    });
    this.renderer.render();
  };

  /**
   * Creates a new BattleScene, optionally incrementing the win count for a player.
   *
   * @param winnerId - The ID of the player who won the previous battle. Use -1 if no winner.
   * @returns A new instance of BattleScene.
   */
  private createBattleScene = (winnerId: number) => {
    if (winnerId >= 0) this.gameState.wins[winnerId]++;

    return new BattleScene(
      this.gameState,
      (winnerId) => (this.scene = this.createBattleScene(winnerId))
    );
  };

  /**
   * Starts the game by registering input events and initiating the game loop.
   */
  public start() {
    registerKeyEvents();
    this.animationFrameId ??= window.requestAnimationFrame(this.frame);
  }

  /**
   * Stops the game by unregistering input events, removing the canvas, and cancelling the game loop.
   */
  public stop() {
    unregisterKeyEvents();
    removeCanvas(this.container);
    // Cancel the animation frame if it exists
    if (this.animationFrameId !== null) {
      window.cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }
}
