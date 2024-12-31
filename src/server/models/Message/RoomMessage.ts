import { MessageType, RoomChatMessage } from "@/server/types";
import { User, Room, BaseMessage } from "..";

export class RoomMessage extends BaseMessage {
  constructor(from: User, content: string, public readonly to: Room) {
    super(from, content, MessageType.ROOM, to);
  }

  public static create(from: User, content: string, room: Room): RoomMessage {
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
      room: (this.to as Room).getState(),
    };
  }
}
