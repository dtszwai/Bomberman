import {
  GlobalChatMessage,
  MessageType,
  OperationResult,
} from "@/server/types";
import { User, BaseMessage } from "..";
import { logger } from "@/server/utils/logger";

export class LobbyMessage extends BaseMessage {
  constructor(from: User, content: string) {
    super(from, content, MessageType.GLOBAL);
  }

  public static create(
    from: User,
    content: string
  ): OperationResult<LobbyMessage> {
    try {
      BaseMessage.validateContent(content);
      return {
        success: true,
        data: new LobbyMessage(from, content),
      };
    } catch (error) {
      logger.error("Failed to create lobby message", error as Error);
      return {
        success: false,
        message: `Failed to create lobby message: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      };
    }
  }

  public toChatMessage(): GlobalChatMessage {
    return {
      id: this.id,
      content: this.content,
      from: this.from,
      timestamp: this.timestamp,
      type: MessageType.GLOBAL,
    };
  }
}
