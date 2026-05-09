import type { UserState } from "./user";
import type { RoomState } from "./room";

export enum MessageType {
  GLOBAL = "GLOBAL",
  ROOM = "ROOM",
  PRIVATE = "PRIVATE",
}

interface BaseMessage {
  readonly id: string;
  readonly content: string;
  readonly from: Readonly<UserState>;
  readonly timestamp: number;
  readonly type: MessageType;
}

export interface RoomChatMessage<G = unknown> extends BaseMessage {
  readonly type: MessageType.ROOM;
  readonly room: Readonly<RoomState<G>>;
  readonly to?: never;
}

export interface PrivateChatMessage extends BaseMessage {
  readonly type: MessageType.PRIVATE;
  readonly to: Readonly<UserState>;
  readonly room?: never;
}

export interface GlobalChatMessage extends BaseMessage {
  readonly type: MessageType.GLOBAL;
  readonly to?: never;
  readonly room?: never;
}

export type ChatMessage<G = unknown> = Readonly<
  RoomChatMessage<G> | PrivateChatMessage | GlobalChatMessage
>;

interface BaseMessagePayload {
  readonly content: string;
  readonly type: MessageType;
}

export interface GlobalMessagePayload extends BaseMessagePayload {
  readonly type: MessageType.GLOBAL;
}

export interface RoomMessagePayload extends BaseMessagePayload {
  readonly type: MessageType.ROOM;
}

export interface PrivateMessagePayload extends BaseMessagePayload {
  readonly type: MessageType.PRIVATE;
  readonly to: string;
}

export type ChatMessagePayload = Readonly<
  GlobalMessagePayload | RoomMessagePayload | PrivateMessagePayload
>;
