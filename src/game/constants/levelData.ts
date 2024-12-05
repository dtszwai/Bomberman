import { StageData } from "../types";
import { TILE_SIZE } from "./game";

/**
 * Maximum size of the stage map in pixels.
 */
export const STAGE_MAP_MAX_SIZE = 64 * TILE_SIZE;

/**
 * Total game time represented as [minutes, seconds].
 */
export const GAME_TIME: Readonly<[number, number]> = [3, 0];

/**
 * Coordinates representing player starting positions.
 * Prevents blocks and other objects from spawning on top of players.
 */
export const playerStartCoords: ReadonlyArray<Readonly<[number, number]>> = [
  [1, 2],
  [2, 2],
  [1, 3],
  [1, 13],
  [1, 14],
  [2, 14],
  [10, 2],
  [11, 2],
  [11, 3],
  [10, 14],
  [11, 13],
  [11, 14],
  [5, 8],
  [6, 8],
  [7, 8],
  [5, 7],
  [5, 9],
  [7, 7],
  [7, 9],
];

/**
 * Represents the tile index for each type of map tile.
 */
export enum MapTile {
  OUTER_WALL = 29,
  FLOOR = 59,
  WALL = 30,
  BLOCK = 103,
}

/**
 * Represents different collision properties associated with tiles.
 */
export enum CollisionTile {
  EMPTY = 0,
  POWERUP_FLAME = 1,
  POWERUP_BOMB = 2,
  POWERUP_SPEED = 3,
  FLAME = 10,
  WALL = 20,
  BOMB = 21,
  BLOCK = 30,
}

/**
 * Represents different types of power-ups available in the game.
 */
export enum PowerupType {
  Flame = CollisionTile.POWERUP_FLAME,
  Bomb = CollisionTile.POWERUP_BOMB,
  Speed = CollisionTile.POWERUP_SPEED,
}

/**
 * Maps each MapTile to its corresponding CollisionTile.
 */
export const MapToCollisionTileLookup: Readonly<
  Record<MapTile, CollisionTile>
> = {
  [MapTile.FLOOR]: CollisionTile.EMPTY,
  [MapTile.WALL]: CollisionTile.WALL,
  [MapTile.OUTER_WALL]: CollisionTile.WALL,
  [MapTile.BLOCK]: CollisionTile.BLOCK,
} as const;

export const stageData: StageData = {
  maxBlocks: 50,
  powerups: {
    // the number of powerups of each type to spawn
    [CollisionTile.POWERUP_FLAME]: 5,
    [CollisionTile.POWERUP_BOMB]: 5,
    [CollisionTile.POWERUP_SPEED]: 5,
  },
  tiles: [
    [
      MapTile.OUTER_WALL,
      MapTile.WALL,
      MapTile.WALL,
      MapTile.WALL,
      MapTile.WALL,
      MapTile.WALL,
      MapTile.WALL,
      MapTile.WALL,
      MapTile.WALL,
      MapTile.WALL,
      MapTile.WALL,
      MapTile.WALL,
      MapTile.WALL,
      MapTile.WALL,
      MapTile.WALL,
      MapTile.WALL,
      MapTile.OUTER_WALL,
    ],
    [
      MapTile.OUTER_WALL,
      MapTile.WALL,
      MapTile.FLOOR,
      MapTile.FLOOR,
      MapTile.FLOOR,
      MapTile.FLOOR,
      MapTile.FLOOR,
      MapTile.FLOOR,
      MapTile.FLOOR,
      MapTile.FLOOR,
      MapTile.FLOOR,
      MapTile.FLOOR,
      MapTile.FLOOR,
      MapTile.FLOOR,
      MapTile.FLOOR,
      MapTile.WALL,
      MapTile.OUTER_WALL,
    ],
    [
      MapTile.OUTER_WALL,
      MapTile.WALL,
      MapTile.FLOOR,
      MapTile.WALL,
      MapTile.FLOOR,
      MapTile.WALL,
      MapTile.FLOOR,
      MapTile.WALL,
      MapTile.FLOOR,
      MapTile.WALL,
      MapTile.FLOOR,
      MapTile.WALL,
      MapTile.FLOOR,
      MapTile.WALL,
      MapTile.FLOOR,
      MapTile.WALL,
      MapTile.OUTER_WALL,
    ],
    [
      MapTile.OUTER_WALL,
      MapTile.WALL,
      MapTile.FLOOR,
      MapTile.FLOOR,
      MapTile.FLOOR,
      MapTile.FLOOR,
      MapTile.FLOOR,
      MapTile.FLOOR,
      MapTile.FLOOR,
      MapTile.FLOOR,
      MapTile.FLOOR,
      MapTile.FLOOR,
      MapTile.FLOOR,
      MapTile.FLOOR,
      MapTile.FLOOR,
      MapTile.WALL,
      MapTile.OUTER_WALL,
    ],
    [
      MapTile.OUTER_WALL,
      MapTile.WALL,
      MapTile.FLOOR,
      MapTile.WALL,
      MapTile.FLOOR,
      MapTile.WALL,
      MapTile.FLOOR,
      MapTile.WALL,
      MapTile.FLOOR,
      MapTile.WALL,
      MapTile.FLOOR,
      MapTile.WALL,
      MapTile.FLOOR,
      MapTile.WALL,
      MapTile.FLOOR,
      MapTile.WALL,
      MapTile.OUTER_WALL,
    ],
    [
      MapTile.OUTER_WALL,
      MapTile.WALL,
      MapTile.FLOOR,
      MapTile.FLOOR,
      MapTile.FLOOR,
      MapTile.FLOOR,
      MapTile.FLOOR,
      MapTile.FLOOR,
      MapTile.FLOOR,
      MapTile.FLOOR,
      MapTile.FLOOR,
      MapTile.FLOOR,
      MapTile.FLOOR,
      MapTile.FLOOR,
      MapTile.FLOOR,
      MapTile.WALL,
      MapTile.OUTER_WALL,
    ],
    [
      MapTile.OUTER_WALL,
      MapTile.WALL,
      MapTile.FLOOR,
      MapTile.WALL,
      MapTile.FLOOR,
      MapTile.WALL,
      MapTile.FLOOR,
      MapTile.WALL,
      MapTile.FLOOR,
      MapTile.WALL,
      MapTile.FLOOR,
      MapTile.WALL,
      MapTile.FLOOR,
      MapTile.WALL,
      MapTile.FLOOR,
      MapTile.WALL,
      MapTile.OUTER_WALL,
    ],
    [
      MapTile.OUTER_WALL,
      MapTile.WALL,
      MapTile.FLOOR,
      MapTile.FLOOR,
      MapTile.FLOOR,
      MapTile.FLOOR,
      MapTile.FLOOR,
      MapTile.FLOOR,
      MapTile.FLOOR,
      MapTile.FLOOR,
      MapTile.FLOOR,
      MapTile.FLOOR,
      MapTile.FLOOR,
      MapTile.FLOOR,
      MapTile.FLOOR,
      MapTile.WALL,
      MapTile.OUTER_WALL,
    ],
    [
      MapTile.OUTER_WALL,
      MapTile.WALL,
      MapTile.FLOOR,
      MapTile.WALL,
      MapTile.FLOOR,
      MapTile.WALL,
      MapTile.FLOOR,
      MapTile.WALL,
      MapTile.FLOOR,
      MapTile.WALL,
      MapTile.FLOOR,
      MapTile.WALL,
      MapTile.FLOOR,
      MapTile.WALL,
      MapTile.FLOOR,
      MapTile.WALL,
      MapTile.OUTER_WALL,
    ],
    [
      MapTile.OUTER_WALL,
      MapTile.WALL,
      MapTile.FLOOR,
      MapTile.FLOOR,
      MapTile.FLOOR,
      MapTile.FLOOR,
      MapTile.FLOOR,
      MapTile.FLOOR,
      MapTile.FLOOR,
      MapTile.FLOOR,
      MapTile.FLOOR,
      MapTile.FLOOR,
      MapTile.FLOOR,
      MapTile.FLOOR,
      MapTile.FLOOR,
      MapTile.WALL,
      MapTile.OUTER_WALL,
    ],
    [
      MapTile.OUTER_WALL,
      MapTile.WALL,
      MapTile.FLOOR,
      MapTile.WALL,
      MapTile.FLOOR,
      MapTile.WALL,
      MapTile.FLOOR,
      MapTile.WALL,
      MapTile.FLOOR,
      MapTile.WALL,
      MapTile.FLOOR,
      MapTile.WALL,
      MapTile.FLOOR,
      MapTile.WALL,
      MapTile.FLOOR,
      MapTile.WALL,
      MapTile.OUTER_WALL,
    ],
    [
      MapTile.OUTER_WALL,
      MapTile.WALL,
      MapTile.FLOOR,
      MapTile.FLOOR,
      MapTile.FLOOR,
      MapTile.FLOOR,
      MapTile.FLOOR,
      MapTile.FLOOR,
      MapTile.FLOOR,
      MapTile.FLOOR,
      MapTile.FLOOR,
      MapTile.FLOOR,
      MapTile.FLOOR,
      MapTile.FLOOR,
      MapTile.FLOOR,
      MapTile.WALL,
      MapTile.OUTER_WALL,
    ],
    [
      MapTile.OUTER_WALL,
      MapTile.WALL,
      MapTile.WALL,
      MapTile.WALL,
      MapTile.WALL,
      MapTile.WALL,
      MapTile.WALL,
      MapTile.WALL,
      MapTile.WALL,
      MapTile.WALL,
      MapTile.WALL,
      MapTile.WALL,
      MapTile.WALL,
      MapTile.WALL,
      MapTile.WALL,
      MapTile.WALL,
      MapTile.OUTER_WALL,
    ],
    [
      MapTile.OUTER_WALL,
      MapTile.OUTER_WALL,
      MapTile.OUTER_WALL,
      MapTile.OUTER_WALL,
      MapTile.OUTER_WALL,
      MapTile.OUTER_WALL,
      MapTile.OUTER_WALL,
      MapTile.OUTER_WALL,
      MapTile.OUTER_WALL,
      MapTile.OUTER_WALL,
      MapTile.OUTER_WALL,
      MapTile.OUTER_WALL,
      MapTile.OUTER_WALL,
      MapTile.OUTER_WALL,
      MapTile.OUTER_WALL,
      MapTile.OUTER_WALL,
      MapTile.OUTER_WALL,
    ],
  ],
};

/**
 * Collision map derived from the stage tiles.
 * Maps each MapTile to its corresponding CollisionTile using the lookup.
 * Defaults to CollisionTile.EMPTY if no mapping exists.
 */
export const collisionMap: CollisionTile[][] = stageData.tiles.map((row) =>
  row.map((tile) => MapToCollisionTileLookup[tile] ?? CollisionTile.EMPTY)
);
