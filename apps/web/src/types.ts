/**
 * App-wide specialised wire types. Client + non-server-internal code
 * pulls typed `RoomState`, `GameStatus`, etc. from here; server-internal
 * code uses `@/server/types` which re-specialises with the `User` class.
 */
import type {
  BaseRoomState as PBase,
  GameRoomState as PGame,
  GameStatus as PStatus,
  RoomState as PRoom,
  Seat as PSeat,
} from "@arcade/protocol";
import type { GameState } from "@arcade/games-bomberman/sim";

import type {
  ChatMessage as PChat,
  GlobalState as PGlobal,
  RoomChatMessage as PRoomChat,
} from "@arcade/protocol";

export type Seat = PSeat;
export type BaseRoomState = PBase;
export type GameRoomState = PGame<GameState>;
export type RoomState = PRoom<GameState>;
export type GameStatus = PStatus;
export type GlobalState = PGlobal<GameState>;
export type RoomChatMessage = PRoomChat<GameState>;
export type ChatMessage = PChat<GameState>;

export type {
  Position,
  UserState,
  UserControls,
  BotDifficulty,
  BotSpec,
  RoomSettings,
  WaitingStatus,
  ActiveStatus,
  PausedStatus,
  RoundEndedStatus,
  PrivateChatMessage,
  GlobalChatMessage,
  ChatMessagePayload,
  GlobalMessagePayload,
  RoomMessagePayload,
  PrivateMessagePayload,
  OperationResult,
} from "@arcade/protocol";
export {
  BOT_DIFFICULTIES,
  RoomType,
  MessageType,
  GameStatusType,
} from "@arcade/protocol";
