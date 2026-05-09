import type { UserState } from "./user";
import type { GameStatus } from "./game-status";
import type { SeatActor } from "./actor";

export interface Seat<U = UserState> {
  index: number;
  actor: SeatActor<U> | null;
  ready: boolean;
}

export interface RoomSettings {
  maxUsers: number;
  isPrivate: boolean;
  roomCode: string | null;
  allowSpectators: boolean;
  maxWins: number;
  roundTimeSeconds: number;
  mapId: string;
  powerupPreset: string;
  tournamentMode: boolean;
}

export enum RoomType {
  GAME,
}

export interface BaseRoomState<U = UserState> {
  id: string;
  type: RoomType;
  name: string;
  seats: Seat<U>[];
  hostId: string;
  settings: RoomSettings;
  createdAt: number;
  updatedAt: number;
}

export interface GameRoomState<G = unknown, U = UserState>
  extends BaseRoomState<U> {
  type: RoomType.GAME;
  status: GameStatus<U>;
  gameState: G;
  startTime?: number;
}

export type RoomState<G = unknown, U = UserState> = GameRoomState<G, U>;
