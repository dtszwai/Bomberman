import type { GameSnapshot } from "./game/types";
import {
  RoomState,
  ChatMessagePayload,
  GameStatus,
  GlobalChatMessage,
  GlobalState,
  OperationResult,
  Position,
  PrivateChatMessage,
  RoomChatMessage,
  RoomSettings,
  UserControls,
  UserState,
} from "./server/types";

export const Events = {
  // Global
  GLOBAL_STATE: "global:state",
  USER_STATE: "user:state",

  // Room Events
  CREATE_ROOM: "room:create",
  JOIN_ROOM: "room:join",
  LEAVE_ROOM: "room:leave",
  ROOM_STATE: "room:state",
  ROOM_READY: "game:ready",

  // Game Flow Events
  START_GAME: "game:start",
  GAME_SNAPSHOT: "game:snapshot",
  GAME_PAUSE: "game:pause",
  GAME_RESUME: "game:resume",
  GAME_END: "game:end",
  round_end: "game:round_end",
  USER_CONTROLS: "game:controls",

  // Message Events
  GLOBAL_MESSAGE: "global:message",
  ROOM_MESSAGE: "room:message",
  PRIVATE_MESSAGE: "user:message",
  CREATE_MESSAGE: "message:create",
} as const;

export type EventType = (typeof Events)[keyof typeof Events];

// Client-to-Server Event Payloads
export interface ClientPayloads {
  [Events.CREATE_ROOM]: Partial<RoomSettings & { name: string }>;
  [Events.JOIN_ROOM]: Position;
  [Events.LEAVE_ROOM]: null;
  [Events.START_GAME]: null;
  [Events.ROOM_READY]: null;
  [Events.USER_CONTROLS]: UserControls;
  [Events.CREATE_MESSAGE]: ChatMessagePayload;
  [Events.USER_STATE]: null;
}

// Server-to-Client Event Payloads
export interface ServerPayloads {
  [Events.USER_STATE]: UserState;
  [Events.GLOBAL_STATE]: GlobalState;
  [Events.ROOM_STATE]: RoomState;
  [Events.GAME_SNAPSHOT]: GameSnapshot & { status: GameStatus };
  [Events.CREATE_ROOM]: OperationResult<RoomState>;
  [Events.JOIN_ROOM]: OperationResult<RoomState>;
  [Events.LEAVE_ROOM]: OperationResult;
  [Events.START_GAME]: OperationResult;
  [Events.USER_CONTROLS]: void;
  [Events.GAME_END]: { winner: UserState; score: number[] };
  [Events.ROOM_READY]: OperationResult;
  [Events.GLOBAL_MESSAGE]: GlobalChatMessage;
  [Events.ROOM_MESSAGE]: RoomChatMessage;
  [Events.PRIVATE_MESSAGE]: PrivateChatMessage;
  [Events.CREATE_MESSAGE]: OperationResult;
}

// Event Types
export type BidirectionalEvent = keyof ClientPayloads & keyof ServerPayloads;
