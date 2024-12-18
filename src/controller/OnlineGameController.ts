import { BaseGameController } from "./BaseGameController";
import { GameSnapshot } from "@/game/types";

export class OnlineGameController extends BaseGameController {
  public start(): void {}

  public stop(): void {
    this.cleanup();
  }

  public updateFromServer(snapshot: GameSnapshot) {
    this.update(snapshot);
  }
}
