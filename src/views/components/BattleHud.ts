import { BaseRenderer } from "../BaseRenderer";
import { loadImage, drawText } from "../utils";
import HudUrl from "@assets/images/hud.png";
import { GAME_TIME, SCREEN_WIDTH, STAGE_OFFSET_Y } from "@/game/constants";
import { GameState } from "@/game/types";
import { GameTime } from "@/game/engine/types";

export interface BattleHudRenderData {
  time: GameTime;
  state: GameState;
}

export class BattleHudView extends BaseRenderer {
  private static image = loadImage(HudUrl);
  private clock: [number, number] = [...GAME_TIME];
  private state: GameState = { wins: [0, 0], maxWins: 3 };
  private nextAnimationUpdate: number = 1000;

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

  public update(battleHudData: BattleHudRenderData) {
    this.updateClock(battleHudData.time);
    this.state = battleHudData.state;
  }

  public render() {
    this.context.drawImage(
      BattleHudView.image,
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
      this.context,
      `${this.clock[0]}:${String(this.clock[1]).padStart(2, "0")}`,
      32,
      8
    );

    // Draws the player scores on the HUD.
    this.state.wins.forEach((winCount, index) => {
      const xPosition = index * 32 + 104;
      drawText(this.context, winCount.toString(), xPosition, 8);
    });
  }
}
