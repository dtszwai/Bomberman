import { Tile } from "@arcade/realtime-core";
import type { PublicSeatActor } from "@arcade/protocol";
import { CollisionTile, MapTile, PowerupType } from "./constants/levelData";
import {
  BombermanSnapshot,
  BombSnapshot,
  ExplosionSnapshot,
} from "./entities";
import { BlocksSnapshot, PowerupsSnapshot } from "./systems";

export interface GameState {
  wins: number[];
  maxWins: number;
  tournamentMode: boolean;
}

export interface RoundSeeds {
  matchSeed: number;
  roundIndex: number;
  mapSeed: number;
  powerupSeed: number;
  botSeedBase: number;
}

export interface StageData {
  readonly id: string;
  readonly name: string;
  readonly maxBlocks: number;
  readonly powerups: Partial<Record<CollisionTile, number>>;
  readonly tiles: MapTile[][];
}

export interface FlameCell {
  cell: Tile;
  isVertical: boolean;
  isLast: boolean;
}

/**
 * Wire snapshot sent every server tick. Contains only continuous state
 * (player motion + bomb presence). Discrete transitions — bomb explosions,
 * block destruction, powerup spawn/collect, player deaths — are shipped
 * as one-shot events and applied client-side.
 */
export interface GameSnapshot {
  tick: number;
  timestamp: number;
  hud: { time: [number, number]; state: GameState };
  players: BombermanSnapshot[];
  bombs: BombSnapshot[];
}

/**
 * Full local scene state. Used internally by `BattleScene.serialize()` and
 * by the offline/local controller. Server never broadcasts this shape;
 * it strips to {@link GameSnapshot} before sending.
 */
export interface SceneSnapshot extends GameSnapshot {
  blocks: BlocksSnapshot["blocks"];
  explosions: ExplosionSnapshot[];
  powerups: PowerupsSnapshot;
}

export interface RoundStartPayload {
  tick: number;
  timestamp: number;
  seeds: RoundSeeds;
  tileMap: MapTile[][];
  initialBlocks: { cell: Tile; powerup?: PowerupType }[];
  roundActors?: (PublicSeatActor | null)[];
}

export interface PowerupSnapshot {
  id: number;
  cell: Tile;
  type: PowerupType;
}

/** Live discrete state bundled into resync so a (re)connecting client can
 *  hydrate the event-sourced systems without replaying the event log. */
export interface GameResyncSnapshot {
  destroyedBlockCells: Tile[];
  explosions: ExplosionSnapshot[];
  powerups: PowerupSnapshot[];
  deadPlayerIds: number[];
}

// ---- Game event payloads ----------------------------------------------

export interface BombPlacedEvent {
  id: number;
  ownerId: number;
  cell: Tile;
  placedAt: number;
  fuseMs: number;
  strength: number;
}

export interface BombExplodedEvent {
  id: number;
  cell: Tile;
  flameCells: FlameCell[];
  startedAt: number;
  durationMs: number;
}

export interface BlockDestroyedEvent {
  cell: Tile;
  destroyedAt: number;
  durationMs: number;
}

export interface PowerupSpawnedEvent {
  id: number;
  cell: Tile;
  type: PowerupType;
}

export interface PowerupCollectedEvent {
  id: number;
  playerId: number;
}

export interface PlayerDiedEvent {
  id: number;
  at: number;
}

export type GameEvent =
  | ({ kind: "bomb:placed" } & BombPlacedEvent)
  | ({ kind: "bomb:exploded" } & BombExplodedEvent)
  | ({ kind: "block:destroyed" } & BlockDestroyedEvent)
  | ({ kind: "powerup:spawned" } & PowerupSpawnedEvent)
  | ({ kind: "powerup:collected" } & PowerupCollectedEvent)
  | ({ kind: "player:died" } & PlayerDiedEvent);

export type EmitGameEvent = (event: GameEvent) => void;
