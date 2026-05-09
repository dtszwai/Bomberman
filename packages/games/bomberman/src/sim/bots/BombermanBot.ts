import type { Tile } from "@arcade/realtime-core";
import type { BotSpec } from "@arcade/protocol";
import {
  EMPTY_BOT_COMMAND,
  type BotDifficultyConfig,
  type BotMemory,
  type BotRng,
} from "./BotTypes";
import type { BotWorldView } from "./BotWorldView";
import {
  directionBetween,
  getCellCenter,
  getPlayerCell,
  isPassable,
  sameTile,
} from "./BotWorldView";
import {
  createBotPlan,
  type BotPlan,
  type BotPlanIntent,
} from "./BotPolicy";
import { createDangerMap } from "./DangerMap";
import { TILE_TRAVEL_MS } from "./Pathfinding";
import { Direction } from "../constants";

export interface BombermanBotDecisionContext {
  seatIndex: number;
  tick: number;
  view: BotWorldView;
}

const CENTER_REACHED_EPSILON_PX = 2;
const MIN_RECONSIDER_TICKS = 10;
const PLAN_INTENT_PRIORITY: Record<BotPlanIntent, number> = {
  explore: 1,
  powerup: 2,
  attack: 3,
  bomb: 4,
  escape: 5,
};

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
      this.memory.planIntent = undefined;
      return EMPTY_BOT_COMMAND;
    }

    const currentCell = getPlayerCell(self);
    const danger = createDangerMap(ctx.view);
    const mustReplan =
      danger.isDangerousSoon(
        currentCell,
        ctx.view.timestamp,
        this.config.dangerLookaheadMs
      ) || !this.hasUsablePath(ctx.view, self, danger);
    const shouldReconsider =
      !mustReplan &&
      ctx.tick - this.memory.lastDecisionTick >=
        Math.max(this.config.decisionIntervalTicks, MIN_RECONSIDER_TICKS);

    let action = false;
    if (mustReplan || shouldReconsider) {
      const plan = createBotPlan({
        seatIndex: ctx.seatIndex,
        tick: ctx.tick,
        view: ctx.view,
        config: this.config,
        rng: this.rng,
        bombCooldownUntilTick: this.memory.bombCooldownUntilTick,
      });
      this.memory.lastDecisionTick = ctx.tick;
      action = this.applyPlanIfUseful(plan, mustReplan);
    }

    const direction = this.getPathDirection(self);
    return { ...commandForDirection(direction), action };
  }

  private applyPlanIfUseful(plan: BotPlan, force: boolean) {
    if (!force && !this.shouldAdoptPlan(plan)) {
      return false;
    }

    this.memory.path = plan.path;
    this.memory.planIntent = plan.intent;
    if (plan.cooldownUntilTick !== undefined) {
      this.memory.bombCooldownUntilTick = plan.cooldownUntilTick;
    }

    return plan.action;
  }

  private shouldAdoptPlan(plan: BotPlan) {
    if (plan.action) return true;
    if (!this.memory.planIntent) return true;
    if (plan.intent === "explore") return false;

    return (
      PLAN_INTENT_PRIORITY[plan.intent] >
      PLAN_INTENT_PRIORITY[this.memory.planIntent as BotPlanIntent]
    );
  }

  private hasUsablePath(
    view: BotWorldView,
    self: BotWorldView["players"][number],
    danger: ReturnType<typeof createDangerMap>
  ) {
    if (!this.getPathDirection(self)) return false;

    const currentCell = getPlayerCell(self);
    const currentIndex = this.memory.path.findIndex((cell) =>
      sameTile(cell, currentCell)
    );
    const remainingPath =
      currentIndex >= 0
        ? this.memory.path.slice(currentIndex + 1)
        : this.memory.path;
    if (remainingPath.length === 0) return true;

    let previous = currentCell;
    return remainingPath.every((cell, index) => {
      if (!directionBetween(previous, cell)) return false;
      if (!isPassable(view, cell, { allowStart: currentCell })) return false;

      const arrivalTime = view.timestamp + (index + 1) * TILE_TRAVEL_MS;
      if (danger.isDangerousAt(cell, arrivalTime, TILE_TRAVEL_MS)) {
        return false;
      }

      previous = cell;
      return true;
    });
  }

  private getPathDirection(self: BotWorldView["players"][number]) {
    const currentCell = getPlayerCell(self);
    const currentIndex = this.memory.path.findIndex((cell) =>
      sameTile(cell, currentCell)
    );
    const target =
      currentIndex >= 0
        ? this.memory.path[
            Math.min(currentIndex + 1, this.memory.path.length - 1)
          ]
        : this.memory.path[0];

    if (!target) return undefined;

    const nextDirection = directionBetween(currentCell, target);
    return nextDirection ?? this.getCenteringDirection(self, target);
  }

  private getCenteringDirection(
    self: BotWorldView["players"][number],
    cell: Tile
  ) {
    const center = getCellCenter(cell);
    const deltaX = center.x - self.position.x;
    const deltaY = center.y - self.position.y;
    const absX = Math.abs(deltaX);
    const absY = Math.abs(deltaY);

    if (absX > CENTER_REACHED_EPSILON_PX && absX >= absY) {
      return deltaX > 0 ? Direction.RIGHT : Direction.LEFT;
    }
    if (absY > CENTER_REACHED_EPSILON_PX) {
      return deltaY > 0 ? Direction.DOWN : Direction.UP;
    }
    return undefined;
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
