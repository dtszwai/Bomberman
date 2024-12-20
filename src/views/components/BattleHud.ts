import { BaseRenderer } from "../BaseRenderer";
import { loadImage, drawText } from "../utils";
import HudUrl from "@assets/images/hud.png";
import { GAME_TIME, SCREEN_WIDTH, STAGE_OFFSET_Y } from "@/game/constants";
import { GameState } from "@/game/types";

export interface BattleHudRenderData {
  time: [number, number];
  state: GameState;
}

export class BattleHudView extends BaseRenderer {
  private static image = loadImage(HudUrl);
  private clock: [number, number] = [...GAME_TIME];
  private state: GameState = { wins: [0, 0], maxWins: 3 };

  public update(battleHudData: BattleHudRenderData) {
    this.clock = battleHudData.time;
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
      // if winCount is -1, the seat is empty, so we don't draw the score
      if (winCount < 0) return;

      const xPosition = index * 32 + 104;
      drawText(this.context, winCount.toString(), xPosition, 8);
    });
  }
}
