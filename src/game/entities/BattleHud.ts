import { SCREEN_WIDTH, STAGE_OFFSET_Y } from "../constants/game";
import HudUrl from "@assets/images/hud.png";
import { GameTime } from "@/engine/types";
import { drawText } from "../utils/drawText";
import { GAME_TIME } from "../constants/levelData";
import { loadImage } from "../utils/utils";
import { GameState } from "../types";

/**
 * Class representing the Heads-Up Display (HUD) for the battle scene.
 * Manages the game timer and player scores.
 */
export class BattleHud {
  /** Image asset for the HUD */
  private static image = loadImage(HudUrl);
  /** Current game timer in minutes and seconds */
  private clock: [number, number] = [...GAME_TIME];
  /** Timestamp for the next clock update */
  private nextAnimationUpdate: number;

  /**
   * Creates an instance of BattleHud.
   *
   * @param time - The initial game time.
   * @param state - The current state of the game, including player scores.
   */
  constructor(time: GameTime, private state: GameState) {
    this.nextAnimationUpdate = time.previous + 1000;
  }

  /**
   * Updates the game clock based on the elapsed time.
   *
   * @param time - The current game time.
   */
  private updateClock(time: GameTime) {
    if (time.previous <= this.nextAnimationUpdate) return;

    const [minutes, seconds] = this.clock;

    // If the clock is at 0:00, do nothing
    if (minutes === 0 && seconds === 0) return;

    if (seconds > 0) {
      this.clock[1] -= 1;
    } else if (minutes > 0 && seconds === 0) {
      this.clock[0] -= 1;
      this.clock[1] = 59;
    }

    // Schedule the next clock update
    this.nextAnimationUpdate = time.previous + 1000;
  }

  /**
   * Updates the HUD state, including the game clock.
   */
  public update = (time: GameTime) => this.updateClock(time);

  /**
   * Draws the HUD elements onto the canvas.
   */
  public draw(context: CanvasRenderingContext2D) {
    // Draws the HUD background image.
    context.drawImage(
      BattleHud.image,
      8,
      40,
      SCREEN_WIDTH,
      STAGE_OFFSET_Y,
      0,
      0,
      SCREEN_WIDTH,
      STAGE_OFFSET_Y
    );

    // Draws the game timer on the HUD.
    drawText(
      context,
      `${this.clock[0]}:${String(this.clock[1]).padStart(2, "0")}`,
      32,
      8
    );

    // Draws the player scores on the HUD.
    this.state.wins.forEach((winCount, index) => {
      const xPosition = index * 32 + 104;
      drawText(context, winCount.toString(), xPosition, 8);
    });
  }

  /**
   * Serializes the current state of the HUD.
   */
  public serialize() {
    return {
      clock: this.clock,
      nextAnimationUpdate: this.nextAnimationUpdate,
    };
  }
}
