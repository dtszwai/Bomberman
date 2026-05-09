import type {
  BlockDestroyedEvent,
  BombExplodedEvent,
  BombPlacedEvent,
  GameResyncSnapshot,
  GameSnapshot,
  GameState,
  PlayerDiedEvent,
  PowerupCollectedEvent,
  PowerupSpawnedEvent,
  RoundStartPayload,
} from "./types";
import {
  CoreEvents,
  type ClientPayloads as ProtocolClientPayloads,
  type ServerPayloads as ProtocolServerPayloads,
} from "@arcade/protocol";

export * from "@arcade/protocol";

/**
 * Sent to a single socket when it connects inside an active game.
 * Installs the round's static data, hydrates event-sourced systems, warms
 * snapshot buffer.
 */
export interface GameResyncPayload extends GameResyncSnapshot {
  roundStart: RoundStartPayload;
  snapshot: GameSnapshot;
  roundActors?: RoundStartPayload["roundActors"];
}

/**
 * Bomberman-specific event ids. Merged into the app's socket type map
 * via `ServerPayloads<BombermanServerPayloads, ...>`. Moves to
 * `packages/games/bomberman/sim` in step 9.
 */
export const BombermanEvents = {
  BOMB_PLACED: "bomb:placed",
  BOMB_EXPLODED: "bomb:exploded",
  BLOCK_DESTROYED: "block:destroyed",
  POWERUP_SPAWNED: "powerup:spawned",
  POWERUP_COLLECTED: "powerup:collected",
  PLAYER_DIED: "player:died",
} as const;

export const Events = { ...CoreEvents, ...BombermanEvents } as const;

export type EventType = (typeof Events)[keyof typeof Events];

export interface BombermanServerPayloads {
  [BombermanEvents.BOMB_PLACED]: BombPlacedEvent;
  [BombermanEvents.BOMB_EXPLODED]: BombExplodedEvent;
  [BombermanEvents.BLOCK_DESTROYED]: BlockDestroyedEvent;
  [BombermanEvents.POWERUP_SPAWNED]: PowerupSpawnedEvent;
  [BombermanEvents.POWERUP_COLLECTED]: PowerupCollectedEvent;
  [BombermanEvents.PLAYER_DIED]: PlayerDiedEvent;
}

export type ClientPayloads = ProtocolClientPayloads;

export type ServerPayloads = ProtocolServerPayloads<
  BombermanServerPayloads,
  GameSnapshot,
  RoundStartPayload,
  GameResyncPayload,
  GameState
>;

export type BidirectionalEvent = keyof ClientPayloads & keyof ServerPayloads;
