import { Position, UserState } from "../../types";
import { generateUserName } from "../../utils/name";

export const USER_CONSTANTS = {
  IDLE_TIMEOUT: 10 * 60 * 1000, // 10 minutes
  MAX_NAME_LENGTH: 20,
  MIN_NAME_LENGTH: 3,
} as const;

export class User {
  public readonly id: string;
  public position?: Position;
  public joinedAt: number;
  public lastActivityAt: number;
  public online: boolean;

  public constructor(
    public socketId: string,
    public name: string = generateUserName()
  ) {
    if (
      name.length < USER_CONSTANTS.MIN_NAME_LENGTH ||
      name.length > USER_CONSTANTS.MAX_NAME_LENGTH
    ) {
      throw new Error("Invalid user name length");
    }
    this.id = crypto.randomUUID();
    this.joinedAt = Date.now();
    this.lastActivityAt = Date.now();
    this.online = true;
  }

  /** Get user's current state */
  public getState(): UserState {
    return Object.freeze({
      id: this.id,
      socketId: this.socketId,
      name: this.name,
      position: this.position,
      joinedAt: this.joinedAt,
      lastActivityAt: this.lastActivityAt,
      online: this.online,
    });
  }

  /** Check if user is inactive */
  public isIdle(): boolean {
    return Date.now() - this.lastActivityAt > USER_CONSTANTS.IDLE_TIMEOUT;
  }

  public updateSocketId(socketId: string) {
    this.socketId = socketId;
    this.online = true;
    this.updateActivity();
  }

  /** Update last activity timestamp */
  public updateActivity(): void {
    this.lastActivityAt = Date.now();
  }

  public setOffline(): void {
    this.online = false;
    this.updateActivity();
  }

  public setPosition(
    position: { roomId: string; seatIndex: number } | undefined
  ): void {
    this.position = position;
    this.updateActivity();
  }

  /** Get formatted user info */
  public toString(): string {
    return `${this.name}[${this.id}]`;
  }
}
