import {
  ChatMessagePayload,
  MessageType,
  OperationResult,
} from "@/server/types";
import { User, UserService } from "../user";
import { LobbyMessage } from "./GlobalMessage";
import { PrivateMessage } from "./PrivateMessage";
import { RoomMessage } from "./RoomMessage";
import { Room, RoomService } from "../room";
import { emitter } from "@/server";
import { BaseMessage } from "./BaseMessage";

export class MessageService {
  private lobbyMessages: LobbyMessage[] = [];
  private roomMessages = new Map<string, RoomMessage[]>();
  private privateMessages = new Map<string, PrivateMessage[]>();

  constructor(
    private userService: UserService,
    private roomService: RoomService
  ) {}

  private createGlobalMessage(user: User, content: string): LobbyMessage {
    const message = LobbyMessage.create(user, content);
    this.lobbyMessages.push(message);
    return message;
  }

  private createRoomMessage(
    user: User,
    content: string,
    room: Room
  ): RoomMessage {
    const message = RoomMessage.create(user, content, room);
    const roomMessages = this.roomMessages.get(room.id) || [];
    roomMessages.push(message);
    this.roomMessages.set(room.id, roomMessages);
    return message;
  }

  private createPrivateMessage(
    from: User,
    content: string,
    to: User
  ): PrivateMessage {
    const message = PrivateMessage.create(from, content, to);
    const pmKey = this.getPrivateMessageKey(from.id, to.id);
    const messages = this.privateMessages.get(pmKey) || [];
    messages.push(message);
    this.privateMessages.set(pmKey, messages);
    return message;
  }

  public createMessage(
    user: User,
    payload: ChatMessagePayload
  ): OperationResult {
    try {
      let message: BaseMessage;
      switch (payload.type) {
        case MessageType.GLOBAL:
          message = this.createGlobalMessage(user, payload.content);
          break;
        case MessageType.ROOM: {
          const room = this.roomService.getRoom(user.position!.roomId);
          message = this.createRoomMessage(user, payload.content, room!);
          break;
        }
        case MessageType.PRIVATE: {
          const to = this.userService.getUser(payload.to);
          message = this.createPrivateMessage(user, payload.content, to!);
          break;
        }
        default:
          return { success: false, message: "Invalid message type" };
      }
      emitter.chat(message);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  private getPrivateMessageKey(userId1: string, userId2: string): string {
    return [userId1, userId2].sort().join(":");
  }
}
