import type { GameSnapshot } from "./game/types";
import {
  AnyRoomState,
  ChatMessage,
  GameStatus,
  LobbyChatMessage,
  LobbyState,
  OperationResult,
  Position,
  PrivateChatMessage,
  RoomChatMessage,
  RoomSettings,
  UserControls,
  UserState,
} from "./server/types";

export const Events = {
  LOBBY_STATE: "lobbyState",
  WHOAMI: "whoami",

  // Room Events
  CREATE_ROOM: "createRoom",
  JOIN_ROOM: "joinRoom",
  LEAVE_ROOM: "leaveRoom",
  ROOM_STATE: "roomState",
  TOGGLE_READY: "toggleReady",

  // Game Flow Events
  START_GAME: "startGame",
  GAME_SNAPSHOT: "gameSnapshot",
  GAME_PAUSED: "gamePaused",
  GAME_RESUMED: "gameResumed",
  GAME_ENDED: "gameEnded",
  ROUND_START: "roundStart",
  USER_CONTROLS: "userControls",

  // Message Events
  LOBBY_MESSAGE: "lobby:message",
  ROOM_MESSAGE: "room:message",
  PRIVATE_MESSAGE: "user:message",
  CREATE_MESSAGE: "createMessage",
} as const;

// Type for type-safety when using events
export type EventType = (typeof Events)[keyof typeof Events];

// Client-to-server requests
export interface ClientEvents {
  [Events.CREATE_ROOM]: Partial<RoomSettings & { name: string }>;
  [Events.JOIN_ROOM]: Position;
  [Events.USER_CONTROLS]: UserControls;
  [Events.LOBBY_MESSAGE]: { content: string };
  [Events.ROOM_MESSAGE]: { content: string };
  [Events.PRIVATE_MESSAGE]: { content: string; to: string };
}

// Server-to-client responses and broadcasts
export interface ServerEvents {
  [Events.WHOAMI]: UserState;
  [Events.LOBBY_STATE]: LobbyState;
  [Events.ROOM_STATE]: AnyRoomState;
  [Events.GAME_SNAPSHOT]: GameSnapshot & { status: GameStatus };
  [Events.CREATE_ROOM]: OperationResult<AnyRoomState>;
  [Events.JOIN_ROOM]: OperationResult<AnyRoomState>;
  [Events.LEAVE_ROOM]: OperationResult;
  [Events.START_GAME]: OperationResult;
  [Events.GAME_ENDED]: { winner: UserState; score: number[] };
  [Events.TOGGLE_READY]: OperationResult;
  [Events.LOBBY_MESSAGE]: LobbyChatMessage;
  [Events.ROOM_MESSAGE]: RoomChatMessage;
  [Events.PRIVATE_MESSAGE]: PrivateChatMessage;
  [Events.CREATE_MESSAGE]: OperationResult<ChatMessage>;
}
