import { loadImage } from "@/game/utils/utils";
import HudUrl from "@assets/images/hud.png";
import { BaseRenderer } from "../BaseRenderer";
import { SCREEN_WIDTH, STAGE_OFFSET_Y } from "@/game/constants";
import { drawText } from "@/game/utils/drawText";
import { GameState } from "@/game/types";

export interface BattleHudRenderData {
  clock: [number, number];
  state: GameState;
}

export class BattleHudView extends BaseRenderer {
  private static image = loadImage(HudUrl);
  private battleHudData: BattleHudRenderData = {
    clock: [0, 0],
    state: { wins: [], maxWins: 0 },
  };

  public update(battleHudData: BattleHudRenderData) {
    this.battleHudData = battleHudData;
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

    const { clock, state } = this.battleHudData;

    // Draws the game timer on the HUD.
    drawText(
      this.context,
      `${clock[0]}:${String(clock[1]).padStart(2, "0")}`,
      32,
      8
    );

    // Draws the player scores on the HUD.
    state.wins.forEach((winCount, index) => {
      const xPosition = index * 32 + 104;
      drawText(this.context, winCount.toString(), xPosition, 8);
    });
  }
}
