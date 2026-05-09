import { MessageType } from "@arcade/protocol";
import { BaseMessage } from "./BaseMessage";
import type { BaseRoom } from "../room/BaseRoom";
import type { User } from "../user/User";
import type { RoomChatMessage } from "../types";

export class RoomMessage extends BaseMessage {
  constructor(from: User, content: string, public readonly to: BaseRoom) {
    super(from, content, MessageType.ROOM, to);
  }

  public static create(
    from: User,
    content: string,
    room: BaseRoom
  ): RoomMessage {
    BaseMessage.validateContent(content);
    return new RoomMessage(from, content, room);
  }

  public toChatMessage(): RoomChatMessage {
    return {
      id: this.id,
      content: this.content,
      from: this.from,
      timestamp: this.timestamp,
      type: MessageType.ROOM,
      room: this.to.getState(),
    };
  }
}
