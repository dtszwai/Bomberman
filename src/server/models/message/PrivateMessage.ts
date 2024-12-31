import { ChatMessage, MessageType } from "@/server/types";
import { User, BaseMessage } from "..";

export class PrivateMessage extends BaseMessage {
  constructor(from: User, content: string, public readonly to: User) {
    super(from, content, MessageType.PRIVATE, to);
  }

  public static create(from: User, content: string, to: User): PrivateMessage {
    BaseMessage.validateContent(content);
    return new PrivateMessage(from, content, to);
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
