/**
 * Lobby-internal specialisations of protocol types.
 *
 * Human SeatActor<User> carries the server-side User class instance in storage.
 * BaseRoomState/GameRoomState/etc. use the protocol's wire shape
 * (UserState); room state conversion snapshots actors into public DTOs at
 * the getState() boundary.
 */
import type {
  BaseRoomState as PBase,
  ChatMessage as PChat,
  GameRoomState as PGame,
  GameStatus as PStatus,
  GlobalState as PGlobal,
  RoomChatMessage as PRoomChat,
  RoomState as PRoom,
  Seat as PSeat,
} from "@arcade/protocol";
import type { User } from "./user/User";

export type Seat = PSeat<User>;
export type BaseRoomState = PBase;
export type GameRoomState<G = unknown> = PGame<G>;
export type RoomState<G = unknown> = PRoom<G>;
export type GameStatus = PStatus;
export type GlobalState<G = unknown> = PGlobal<G>;
export type ChatMessage<G = unknown> = PChat<G>;
export type RoomChatMessage<G = unknown> = PRoomChat<G>;
