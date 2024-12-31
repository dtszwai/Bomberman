import { ChatMessage, MessageType } from "@/server/types";
import { Room, User } from "..";

export abstract class BaseMessage {
  protected static counter = 0;
  public readonly id: string;

  constructor(
    public readonly from: User,
    public readonly content: string,
    public readonly type: MessageType,
    public readonly to: Room | User | null = null,
    public readonly timestamp: number = Date.now()
  ) {
    this.id = `msg#${Date.now()}_${BaseMessage.counter++}`;
    this.content = content.trim();
  }

  protected static validateContent(content: string): void {
    if (!content?.trim()) {
      throw new Error("Message content cannot be empty");
    }
  }

  public abstract toChatMessage(): ChatMessage;

  public toString(): string {
    const timestamp = new Date(this.timestamp).toISOString();
    const recipientStr = this.to ? ` To: ${this.to}` : "";
    return `Message ${this.id} | ${timestamp} | From: ${this.from}${recipientStr} | "${this.content}"`;
  }
}
