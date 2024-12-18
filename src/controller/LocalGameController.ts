import { GameTime } from "@/game/engine/types";
import { BattleScene } from "@/game/scenes/BattleScene";
import { GameState } from "@/game/types";
import { NUM_PLAYERS, MAX_WINS } from "@/game/constants";
import {
  registerKeyEvents,
  unregisterKeyEvents,
} from "@/game/engine/inputHandler";
import { BaseGameController, GameControllerConfig } from "./BaseGameController";

export class LocalGameController extends BaseGameController {
  private scene: BattleScene;
  private frameTime: GameTime = { previous: 0, secondsPassed: 0 };
  private gameState: GameState;
  private animationFrameId: number | null = null;

  constructor(config: GameControllerConfig) {
    super(config);
    this.gameState = {
      wins: new Array(NUM_PLAYERS).fill(0),
      maxWins: MAX_WINS,
    };
    this.scene = this.createBattleScene(-1);
  }

  private frame = (currentTime: DOMHighResTimeStamp) => {
    this.animationFrameId = window.requestAnimationFrame(this.frame);

    const delta = (currentTime - this.frameTime.previous) / 1000;
    this.frameTime.secondsPassed = delta;
    this.frameTime.previous = currentTime;

    this.scene.update(this.frameTime);
    const snapshot = this.scene.serialize();
    this.update(snapshot);
  };

  private createBattleScene = (winnerId: number) => {
    if (winnerId >= 0) {
      this.gameState.wins[winnerId]++;
    }
    return new BattleScene(
      this.gameState,
      (winnerId) => (this.scene = this.createBattleScene(winnerId))
    );
  };

  public start() {
    registerKeyEvents();
    this.frameTime.previous = performance.now();
    this.animationFrameId ??= window.requestAnimationFrame(this.frame);
  }

  public stop() {
    unregisterKeyEvents();
    if (this.animationFrameId !== null) {
      window.cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    this.cleanup();
  }
}
