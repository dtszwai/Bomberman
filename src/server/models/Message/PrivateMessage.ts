import { ChatMessage, MessageType, OperationResult } from "@/server/types";
import { User, BaseMessage } from "..";
import { logger } from "@/server/utils/logger";

export class PrivateMessage extends BaseMessage {
  constructor(from: User, content: string, public readonly to: User) {
    super(from, content, MessageType.PRIVATE, to);
  }

  public static create(
    content: string,
    from: User,
    to: User
  ): OperationResult<PrivateMessage> {
    try {
      BaseMessage.validateContent(content);
      return {
        success: true,
        data: new PrivateMessage(from, content, to),
      };
    } catch (error) {
      logger.error("Failed to create private message", error as Error);
      return {
        success: false,
        message: `Failed to create private message: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      };
    }
  }

  public toChatMessage(): ChatMessage {
    return {
      id: this.id,
      content: this.content,
      from: this.from,
      timestamp: this.timestamp,
      type: MessageType.PRIVATE,
      to: (this.to as User).getState(),
    };
  }
}
