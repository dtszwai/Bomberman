import { Ticker } from "@arcade/realtime-core";
import type { KeyBindings } from "@arcade/realtime-core";
import type { Storage } from "@arcade/storage";
import type { User } from "../user/User";
import { BaseGameRoom, type BaseGameSettings } from "./BaseGameRoom";

/**
 * Game room driven by a fixed-step ticker. Subclasses implement `step`
 * with per-tick sim + broadcast logic; lifecycle hooks (start/stop/pause/
 * resume) auto-manage the interval + ticker reset.
 */
export abstract class RealtimeGameRoom<G> extends BaseGameRoom<G> {
  private gameLoop?: ReturnType<typeof setInterval>;
  private readonly ticker: Ticker;

  protected constructor(
    host: User,
    roomName: string | undefined,
    initialGameState: G,
    gameSettings: BaseGameSettings,
    storage?: Storage,
    inputBindings?: KeyBindings[]
  ) {
    super(
      host,
      roomName,
      initialGameState,
      gameSettings,
      storage,
      inputBindings
    );
    this.ticker = new Ticker(this.gameSettings.tickRate, (dt, now) =>
      this.step(dt, now)
    );
  }

  protected override onGameStart(): void {
    this.startGameLoop();
  }

  protected override onGameStop(): void {
    this.stopGameLoop();
  }

  protected override onGamePause(): void {
    this.stopGameLoop();
  }

  protected override onGameResume(): void {
    this.startGameLoop();
  }

  protected startGameLoop() {
    this.ticker.reset();
    this.gameLoop = setInterval(
      () => this.ticker.tick(),
      this.gameSettings.tickRate
    );
  }

  protected stopGameLoop() {
    if (this.gameLoop) {
      clearInterval(this.gameLoop);
      this.gameLoop = undefined;
    }
  }

  /** Per-step sim + broadcast. Called at `tickRate` intervals. */
  protected abstract step(secondsPassed: number, now: number): void;
}
