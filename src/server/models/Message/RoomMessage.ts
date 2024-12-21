import { MessageType, OperationResult, RoomChatMessage } from "@/server/types";
import { Room } from "../Room";
import { User } from "../User";
import { BaseMessage } from "./BaseMessage";
import { logger } from "@/server/utils/logger";

export class RoomMessage extends BaseMessage {
  constructor(from: User, content: string, public readonly to: Room) {
    super(from, content, MessageType.ROOM, to);
  }

  public static create(
    content: string,
    from: User,
    room: Room
  ): OperationResult<RoomMessage> {
    try {
      BaseMessage.validateContent(content);
      return {
        success: true,
        data: new RoomMessage(from, content, room),
      };
    } catch (error) {
      logger.error("Failed to create room message", error as Error);
      return {
        success: false,
        message: `Failed to create room message: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      };
    }
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
