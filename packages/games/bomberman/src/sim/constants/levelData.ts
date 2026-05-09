import type { StageData } from "../types";
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
  POWERUP_SHIELD = 4,
  POWERUP_FUSE = 5,
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
  Shield = CollisionTile.POWERUP_SHIELD,
  Fuse = CollisionTile.POWERUP_FUSE,
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
  id: "classic",
  name: "Classic",
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

export const BOMBERMAN_MAPS = [
  {
    id: "classic",
    name: "Classic",
    description: "Balanced lanes with familiar Bomberman pressure.",
    maxBlocks: 50,
  },
  {
    id: "open",
    name: "Open Field",
    description: "Fewer fixed walls and faster early contact.",
    maxBlocks: 44,
  },
  {
    id: "crossfire",
    name: "Crossfire",
    description: "Long central lanes reward timing and bomb range.",
    maxBlocks: 46,
  },
] as const;

export type BombermanMapId = (typeof BOMBERMAN_MAPS)[number]["id"];

export const POWERUP_PRESETS = [
  {
    id: "classic",
    name: "Classic",
    powerups: {
      [CollisionTile.POWERUP_FLAME]: 5,
      [CollisionTile.POWERUP_BOMB]: 5,
      [CollisionTile.POWERUP_SPEED]: 5,
      [CollisionTile.POWERUP_SHIELD]: 2,
      [CollisionTile.POWERUP_FUSE]: 2,
    },
  },
  {
    id: "party",
    name: "Party",
    powerups: {
      [CollisionTile.POWERUP_FLAME]: 6,
      [CollisionTile.POWERUP_BOMB]: 6,
      [CollisionTile.POWERUP_SPEED]: 5,
      [CollisionTile.POWERUP_SHIELD]: 4,
      [CollisionTile.POWERUP_FUSE]: 4,
    },
  },
  {
    id: "lean",
    name: "Lean",
    powerups: {
      [CollisionTile.POWERUP_FLAME]: 4,
      [CollisionTile.POWERUP_BOMB]: 4,
      [CollisionTile.POWERUP_SPEED]: 3,
      [CollisionTile.POWERUP_SHIELD]: 1,
      [CollisionTile.POWERUP_FUSE]: 1,
    },
  },
] as const;

export type PowerupPresetId = (typeof POWERUP_PRESETS)[number]["id"];

const cloneTiles = (tiles: MapTile[][]): MapTile[][] =>
  tiles.map((row) => [...row]);

const isInnerWall = (tile: MapTile, row: number, column: number): boolean =>
  tile === MapTile.WALL && row > 1 && row < 11 && column > 1 && column < 15;

const createOpenTiles = (): MapTile[][] =>
  stageData.tiles.map((row, rowIndex) =>
    row.map((tile, columnIndex) => {
      if (
        isInnerWall(tile, rowIndex, columnIndex) &&
        (rowIndex + columnIndex) % 4 === 1
      ) {
        return MapTile.FLOOR;
      }
      return tile;
    })
  );

const createCrossfireTiles = (): MapTile[][] =>
  stageData.tiles.map((row, rowIndex) =>
    row.map((tile, columnIndex) => {
      const isCentralLane = rowIndex === 7 || columnIndex === 8;
      if (isInnerWall(tile, rowIndex, columnIndex) && isCentralLane) {
        return MapTile.FLOOR;
      }
      if (
        isInnerWall(tile, rowIndex, columnIndex) &&
        rowIndex % 4 === 2 &&
        columnIndex % 4 === 1
      ) {
        return MapTile.FLOOR;
      }
      return tile;
    })
  );

const MAP_TILES: Record<BombermanMapId, MapTile[][]> = {
  classic: stageData.tiles,
  open: createOpenTiles(),
  crossfire: createCrossfireTiles(),
};

const MAPS_BY_ID = new Map(BOMBERMAN_MAPS.map((map) => [map.id, map]));
const POWERUP_PRESETS_BY_ID = new Map(
  POWERUP_PRESETS.map((preset) => [preset.id, preset])
);

export const getStageData = (
  mapId: string = "classic",
  powerupPresetId: string = "classic"
): StageData => {
  const map = MAPS_BY_ID.get(mapId as BombermanMapId) ?? BOMBERMAN_MAPS[0];
  const preset =
    POWERUP_PRESETS_BY_ID.get(powerupPresetId as PowerupPresetId) ??
    POWERUP_PRESETS[0];

  return {
    id: map.id,
    name: map.name,
    maxBlocks: map.maxBlocks,
    powerups: { ...preset.powerups },
    tiles: cloneTiles(MAP_TILES[map.id]),
  };
};

/**
 * Collision map derived from the stage tiles.
 * Maps each MapTile to its corresponding CollisionTile using the lookup.
 * Defaults to CollisionTile.EMPTY if no mapping exists.
 */
export const collisionMap: CollisionTile[][] = stageData.tiles.map((row) =>
  row.map((tile) => MapToCollisionTileLookup[tile] ?? CollisionTile.EMPTY)
);
