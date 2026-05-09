import type { Tile } from "@arcade/realtime-core";
import { BattleScene } from "../scenes/BattleScene";
import {
  CollisionTile,
  Direction,
  HALF_TILE_SIZE,
  MovementLookup,
  TILE_SIZE,
} from "../constants";
import type {
  BombermanSnapshot,
  BombSnapshot,
  ExplosionSnapshot,
} from "../entities";
import type { PowerupSnapshot } from "../types";

export interface BotWorldView {
  tick: number;
  timestamp: number;
  width: number;
  height: number;
  collisionMap: CollisionTile[][];
  players: BombermanSnapshot[];
  bombs: BombSnapshot[];
  explosions: ExplosionSnapshot[];
  powerups: PowerupSnapshot[];
  blockCells: Tile[];
}

export const BOT_DIRECTIONS = Object.values(Direction);

export function createBotWorldView(scene: BattleScene) {
  const snapshot = scene.serialize();
  const collisionMap = scene.getCollisionMap() as CollisionTile[][];

  return {
    tick: snapshot.tick,
    timestamp: snapshot.timestamp,
    width: collisionMap[0]?.length ?? 0,
    height: collisionMap.length,
    collisionMap,
    players: snapshot.players,
    bombs: snapshot.bombs,
    explosions: snapshot.explosions,
    powerups: snapshot.powerups.powerups,
    blockCells: snapshot.blocks.map((block) => block.cell),
  };
}

export const tileKey = ({ row, column }: Tile) => `${row}:${column}`;

export const sameTile = (a: Tile, b: Tile) => a.row === b.row && a.column === b.column;

export const getPlayerCell = ({ position }: Pick<BombermanSnapshot, "position">) => ({
  row: Math.floor(position.y / TILE_SIZE),
  column: Math.floor(position.x / TILE_SIZE),
});

export const getCellCenter = ({ row, column }: Tile) => ({
  x: column * TILE_SIZE + HALF_TILE_SIZE,
  y: row * TILE_SIZE + HALF_TILE_SIZE,
});

export const manhattan = (a: Tile, b: Tile) =>
  Math.abs(a.row - b.row) + Math.abs(a.column - b.column);

export const isInside = ({ height, width }: BotWorldView, { row, column }: Tile) => row >= 0 && column >= 0 && row < height && column < width;

export const getCollision = (view: BotWorldView, { row, column }: Tile) => isInside(view, { row, column }) ? view.collisionMap[row][column] : CollisionTile.WALL;

export const isWalkableCollision = (tile: CollisionTile) => tile < CollisionTile.WALL && tile !== CollisionTile.FLAME;

export const isPassable = (view: BotWorldView, cell: Tile, options: { allowStart?: Tile } = {}) =>
  isInside(view, cell) && ((options.allowStart && sameTile(options.allowStart, cell)) || isWalkableCollision(getCollision(view, cell)));

export const neighborForDirection = ({ row, column }: Tile, direction: Direction) => {
  const { x, y } = MovementLookup[direction];
  return { row: row + y, column: column + x };
}

export const directionBetween = (from: Tile, to: Tile) => {
  const rowDelta = to.row - from.row;
  const columnDelta = to.column - from.column;
  if (rowDelta === -1 && columnDelta === 0) return Direction.UP;
  if (rowDelta === 1 && columnDelta === 0) return Direction.DOWN;
  if (rowDelta === 0 && columnDelta === -1) return Direction.LEFT;
  if (rowDelta === 0 && columnDelta === 1) return Direction.RIGHT;
  return undefined;
}
