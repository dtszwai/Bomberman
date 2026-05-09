import type { InputHandler } from "@arcade/realtime-core";
import type { Seat } from "@arcade/protocol";
import { BattleScene } from "../sim/scenes/BattleScene";
import {
  BombermanBot,
  BotInputHandler,
  BOT_DIFFICULTY_CONFIG,
  createBotWorldView,
  createDeterministicRng,
} from "../sim/bots";

export const NULL_INPUT_HANDLER: InputHandler = {
  isLeft: () => false,
  isRight: () => false,
  isUp: () => false,
  isDown: () => false,
  isAction: () => false,
};

export interface BotRuntimeTickContext {
  scene: BattleScene;
  tick: number;
}

export class BombermanBotRuntime {
  private controllers = new Map<number, BombermanBot>();
  private inputHandlers = new Map<number, BotInputHandler>();

  public initializeForRound(seats: Seat[], roundSeed: number): void {
    this.controllers.clear();
    this.inputHandlers.clear();

    for (const seat of seats) {
      if (seat.actor?.kind !== "bot") continue;

      const input = new BotInputHandler();
      const botSeed = (roundSeed ^ seat.actor.bot.seed ^ seat.index) >>> 0;
      const bot = new BombermanBot(
        seat.actor.bot,
        BOT_DIFFICULTY_CONFIG[seat.actor.bot.difficulty],
        createDeterministicRng(botSeed)
      );

      this.controllers.set(seat.index, bot);
      this.inputHandlers.set(seat.index, input);
    }
  }

  public getInputHandler(seatIndex: number): InputHandler | undefined {
    return this.inputHandlers.get(seatIndex);
  }

  public beforeSceneUpdate(ctx: BotRuntimeTickContext): void {
    const view = createBotWorldView(ctx.scene);
    for (const [seatIndex, controller] of this.controllers) {
      const input = this.inputHandlers.get(seatIndex);
      if (!input) continue;
      const command = controller.decide({ seatIndex, tick: ctx.tick, view });
      input.setCommand(command);
    }
  }

  public afterSceneUpdate(): void {
    for (const input of this.inputHandlers.values()) {
      input.clearOneShotInputs();
    }
  }
}
