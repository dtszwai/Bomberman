import { GameTime } from "@/game/engine/types";
import { GAME_TIME } from "../constants/levelData";
import { GameState } from "../types";

/**
 * Class representing the Heads-Up Display (HUD) for the battle scene.
 * Manages the game timer and player scores.
 */
export class BattleHud {
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
   * Serializes the current state of the HUD.
   */
  public serialize() {
    return {
      clock: this.clock,
      state: this.state,
    };
  }
}
