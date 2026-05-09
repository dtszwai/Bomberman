import type { RoomState } from "./room";
import type { UserState } from "./user";

export interface GlobalState<G = unknown, U = UserState> {
  rooms: Readonly<Record<string, RoomState<G, U>>>;
  users: Readonly<Record<string, UserState>>;
}

export interface OperationResult<T = void> {
  readonly success: boolean;
  readonly message?: string;
  readonly data?: T;
}
