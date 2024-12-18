import { GameTime } from "./game/engine/types";
import { GameSnapshot, GameState } from "./game/types";
import {
  RoomState,
  LobbyState,
  OperationResult,
  GameStatus,
  Player,
  PlayerControls,
} from "./server/types";

export const Events = {
  LOBBY_STATE: "lobbyState",
  PLAYER_STATE: "playerState",

  // Room Events
  CREATE_ROOM: "createRoom",
  JOIN_ROOM: "joinRoom",
  LEAVE_ROOM: "leaveRoom",
  ROOM_STATE: "roomState",

  // Game Flow Events
  START_GAME: "startGame",
  GAME_STATE: "gameState",
  GAME_PAUSED: "gamePaused",
  GAME_RESUMED: "gameResumed",
  GAME_ENDED: "gameEnded",
  ROUND_START: "roundStart",

  // Player Events
  PLAYER_CONTROLS: "playerAction",
} as const;

// Type for type-safety when using events
export type EventType = (typeof Events)[keyof typeof Events];

// Client-to-server requests
export interface ClientEvents {
  [Events.CREATE_ROOM]: { maxPlayers?: number; name?: string };
  [Events.JOIN_ROOM]: { roomId: string; seat: number };
  [Events.PLAYER_CONTROLS]: PlayerControls;
}

// Server-to-client responses and broadcasts
export interface ServerEvents {
  [Events.PLAYER_STATE]: Player;
  [Events.LOBBY_STATE]: LobbyState;
  [Events.ROOM_STATE]: RoomState;
  [Events.GAME_STATE]: GameSnapshot & { status: GameStatus };
  [Events.CREATE_ROOM]: OperationResult<RoomState>;
  [Events.JOIN_ROOM]: OperationResult<RoomState>;
  [Events.LEAVE_ROOM]: OperationResult;
  [Events.START_GAME]: OperationResult;
  [Events.GAME_ENDED]: { winnerId: string; score: number[] };
}
