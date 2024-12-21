import { GameState } from "@/game/types";
import { User } from "./models/User";

export enum GameStatus {
  WAITING = "WAITING",
  ACTIVE = "ACTIVE",
  PAUSED = "PAUSED",
  ROUND_ENDED = "ROUND_ENDED",
}

export interface Position {
  roomId: string;
  seatIndex: number;
}

export interface UserState {
  id: string;
  name: string;
  position?: Position;
  joinedAt: number;
  lastActivityAt: number;
}
export type Seat = {
  index: Readonly<number>;
} & (
  | {
      user: User;
      ready: boolean;
    }
  | {
      user: null;
      ready: false;
    }
);

export interface BaseRoomState {
  id: string;
  name: string;
  seats: Seat[];
  hostId: string;
  settings: RoomSettings;
  createdAt: number;
  updatedAt: number;
}

export interface RoomState extends BaseRoomState {
  type: "room";
}

export interface RoomSettings {
  maxUsers: number;
  isPrivate: boolean;
  roomCode: string | null;
  allowSpectators: boolean;
}

export interface GameRoomState extends BaseRoomState {
  type: "game";
  gameStatus: GameStatus;
  gameState: GameState;
  startTime?: number;
}

export type AnyRoomState = RoomState | GameRoomState;

export interface LobbyState {
  rooms: Record<string, AnyRoomState>;
  users: Record<string, UserState>;
}

export interface UserControls {
  heldKeys: string[];
  pressedKeys: string[];
}

export interface OperationResult<T = void> {
  success: boolean;
  message?: string;
  data?: T;
}

export enum MessageType {
  LOBBY,
  ROOM,
  PRIVATE,
}

export type ChatMessage =
  | RoomChatMessage
  | PrivateChatMessage
  | LobbyChatMessage;

interface BaseRoomChatMessage {
  id: string;
  content: string;
  from: UserState;
  timestamp: number;
  type: MessageType;
}

export interface RoomChatMessage extends BaseRoomChatMessage {
  to?: never;
  room: AnyRoomState;
  type: MessageType.ROOM;
}

export interface PrivateChatMessage extends BaseRoomChatMessage {
  to: UserState;
  room?: never;
  type: MessageType.PRIVATE;
}

export interface LobbyChatMessage extends BaseRoomChatMessage {
  to?: never;
  room?: never;
  type: MessageType.LOBBY;
}
