import { RoomState, UserState } from ".";

export * from "./room";
export * from "./user";
export * from "./chat";

export interface GlobalState {
  rooms: Readonly<Record<string, RoomState>>;
  users: Readonly<Record<string, UserState>>;
}

export interface OperationResult<T = void> {
  readonly success: boolean;
  readonly message?: string;
  readonly data?: T;
}
