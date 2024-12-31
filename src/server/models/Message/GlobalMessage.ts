import { GlobalChatMessage, MessageType } from "@/server/types";
import { User, BaseMessage } from "..";

export class LobbyMessage extends BaseMessage {
  constructor(from: User, content: string) {
    super(from, content, MessageType.GLOBAL);
  }

  public static create(from: User, content: string): LobbyMessage {
    BaseMessage.validateContent(content);
    return new LobbyMessage(from, content);
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
