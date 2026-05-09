import type { BotSpec } from "@arcade/protocol";
import {
  EMPTY_BOT_COMMAND,
  type BotDifficultyConfig,
  type BotMemory,
  type BotRng,
} from "./BotTypes";
import type { BotWorldView } from "./BotWorldView";
import { getPlayerCell } from "./BotWorldView";
import { createBotPlan } from "./BotPolicy";
import { getNextDirection } from "./Pathfinding";
import { Direction } from "../constants";

export interface BombermanBotDecisionContext {
  seatIndex: number;
  tick: number;
  view: BotWorldView;
}

export class BombermanBot {
  private memory: BotMemory = {
    path: [],
    bombCooldownUntilTick: 0,
    lastDecisionTick: -Infinity,
  };

  public constructor(
    private readonly spec: BotSpec,
    private readonly config: BotDifficultyConfig,
    private readonly rng: BotRng
  ) {}

  public decide(ctx: BombermanBotDecisionContext) {
    void this.spec;

    const self = ctx.view.players.find((player) => player.id === ctx.seatIndex);
    if (!self) {
      this.memory.path = [];
      return EMPTY_BOT_COMMAND;
    }

    const shouldReplan =
      ctx.tick - this.memory.lastDecisionTick >= this.config.decisionIntervalTicks || this.memory.path.length < 2;

    let action = false;
    if (shouldReplan) {
      const plan = createBotPlan({
        seatIndex: ctx.seatIndex,
        tick: ctx.tick,
        view: ctx.view,
        config: this.config,
        rng: this.rng,
        bombCooldownUntilTick: this.memory.bombCooldownUntilTick,
      });
      this.memory.path = plan.path;
      this.memory.lastDecisionTick = ctx.tick;
      action = plan.action;
      if (plan.cooldownUntilTick !== undefined) {
        this.memory.bombCooldownUntilTick = plan.cooldownUntilTick;
      }
    }

    const currentCell = getPlayerCell(self);
    const direction = getNextDirection(this.memory.path, currentCell);
    return { ...commandForDirection(direction), action };
  }
}

function commandForDirection(direction?: Direction) {
  if (!direction) return EMPTY_BOT_COMMAND;

  return {
    left: direction === Direction.LEFT,
    right: direction === Direction.RIGHT,
    up: direction === Direction.UP,
    down: direction === Direction.DOWN,
    action: false,
  };
}
