import { Velocity } from "@/game/engine/types";

export enum Direction {
  UP = "direction-up",
  DOWN = "direction-down",
  LEFT = "direction-left",
  RIGHT = "direction-right",
}

export const MovementLookup: Record<Direction, Velocity> = {
  [Direction.UP]: { x: 0, y: -1 },
  [Direction.DOWN]: { x: 0, y: 1 },
  [Direction.LEFT]: { x: -1, y: 0 },
  [Direction.RIGHT]: { x: 1, y: 0 },
} as const;

export const CounterDirectionsLookup: Record<
  Direction,
  [Direction, Direction]
> = {
  [Direction.UP]: [Direction.RIGHT, Direction.LEFT],
  [Direction.DOWN]: [Direction.RIGHT, Direction.LEFT],
  [Direction.LEFT]: [Direction.DOWN, Direction.UP],
  [Direction.RIGHT]: [Direction.DOWN, Direction.UP],
} as const;
