import type { RoomSettings } from "./room";
import type {
  Position,
  UserControls,
  UserProfileUpdate,
  UserState,
} from "./user";
import type { BotDifficulty } from "./actor";
import type { RoomState } from "./room";
import type { GlobalState, OperationResult } from "./global";
import type {
  GlobalChatMessage,
  PrivateChatMessage,
  RoomChatMessage,
  ChatMessagePayload,
} from "./chat";

/**
 * Core events — game-agnostic. Each game package defines its own event
 * constants + payload map and the app merges them into the socket type
 * map via the generic `ServerPayloads<G>` / `ClientPayloads<G>`.
 */
export const CoreEvents = {
  // Global
  GLOBAL_STATE: "global:state",
  USER_STATE: "user:state",
  UPDATE_PROFILE: "user:updateProfile",

  // Room
  CREATE_ROOM: "room:create",
  UPDATE_ROOM_SETTINGS: "room:updateSettings",
  JOIN_ROOM: "room:join",
  LEAVE_ROOM: "room:leave",
  ADD_BOT: "room:addBot",
  REMOVE_BOT: "room:removeBot",
  UPDATE_BOT: "room:updateBot",
  ROOM_STATE: "room:state",
  ROOM_READY: "game:ready",

  // Game flow (lifecycle, not gameplay)
  START_GAME: "game:start",
  ROUND_STARTED: "game:roundStarted",
  GAME_SNAPSHOT: "game:snapshot",
  GAME_RESYNC: "game:resync",
  USER_CONTROLS: "game:controls",

  // Chat
  GLOBAL_MESSAGE: "global:message",
  ROOM_MESSAGE: "room:message",
  PRIVATE_MESSAGE: "user:message",
  CREATE_MESSAGE: "message:create",
} as const;

export type CoreEventType = (typeof CoreEvents)[keyof typeof CoreEvents];

export interface CoreClientPayloads {
  [CoreEvents.CREATE_ROOM]: Partial<RoomSettings & { name: string }>;
  [CoreEvents.UPDATE_ROOM_SETTINGS]: {
    roomId: string;
    settings: Partial<RoomSettings>;
  };
  [CoreEvents.JOIN_ROOM]: Position;
  [CoreEvents.LEAVE_ROOM]: null;
  [CoreEvents.ADD_BOT]: {
    roomId: string;
    seatIndex?: number;
    difficulty?: BotDifficulty;
    name?: string;
  };
  [CoreEvents.REMOVE_BOT]: { roomId: string; seatIndex: number };
  [CoreEvents.UPDATE_BOT]: {
    roomId: string;
    seatIndex: number;
    difficulty?: BotDifficulty;
    name?: string;
  };
  [CoreEvents.START_GAME]: null;
  [CoreEvents.ROOM_READY]: null;
  [CoreEvents.USER_CONTROLS]: UserControls;
  [CoreEvents.CREATE_MESSAGE]: ChatMessagePayload;
  [CoreEvents.USER_STATE]: null;
  [CoreEvents.UPDATE_PROFILE]: UserProfileUpdate;
}

/**
 * Core server payloads. Game-specific payloads (GAME_SNAPSHOT, ROUND_STARTED,
 * GAME_RESYNC) use the `G` generic so each game parameterizes the wire shape.
 */
export interface CoreServerPayloads<
  Snapshot = unknown,
  RoundStart = unknown,
  Resync = unknown,
  GameStateT = unknown
> {
  [CoreEvents.USER_STATE]: UserState;
  [CoreEvents.UPDATE_PROFILE]: OperationResult<UserState>;
  [CoreEvents.GLOBAL_STATE]: GlobalState<GameStateT>;
  [CoreEvents.ROOM_STATE]: RoomState<GameStateT>;
  [CoreEvents.GAME_SNAPSHOT]: Snapshot;
  [CoreEvents.ROUND_STARTED]: RoundStart;
  [CoreEvents.GAME_RESYNC]: Resync;
  [CoreEvents.CREATE_ROOM]: OperationResult<RoomState<GameStateT>>;
  [CoreEvents.UPDATE_ROOM_SETTINGS]: OperationResult<RoomState<GameStateT>>;
  [CoreEvents.JOIN_ROOM]: OperationResult<RoomState<GameStateT>>;
  [CoreEvents.LEAVE_ROOM]: OperationResult;
  [CoreEvents.ADD_BOT]: OperationResult<RoomState<GameStateT>>;
  [CoreEvents.REMOVE_BOT]: OperationResult<RoomState<GameStateT>>;
  [CoreEvents.UPDATE_BOT]: OperationResult<RoomState<GameStateT>>;
  [CoreEvents.START_GAME]: OperationResult;
  [CoreEvents.ROOM_READY]: OperationResult;
  [CoreEvents.GLOBAL_MESSAGE]: GlobalChatMessage;
  [CoreEvents.ROOM_MESSAGE]: RoomChatMessage<GameStateT>;
  [CoreEvents.PRIVATE_MESSAGE]: PrivateChatMessage;
  [CoreEvents.CREATE_MESSAGE]: OperationResult;
}

/**
 * App-level payload maps: compose core + per-game event records.
 * Each game package exports its own payload record (e.g. `BombermanServerPayloads`)
 * and the app picks them up via intersection.
 *
 *   type Server = ServerPayloads<BombermanServerPayloads, BombermanSnapshot, ...>
 *   type Client = ClientPayloads<BombermanClientPayloads>
 */
export type ClientPayloads<G extends object = Record<never, never>> =
  CoreClientPayloads & G;

export type ServerPayloads<
  G extends object = Record<never, never>,
  Snapshot = unknown,
  RoundStart = unknown,
  Resync = unknown,
  GameStateT = unknown
> = CoreServerPayloads<Snapshot, RoundStart, Resync, GameStateT> & G;
