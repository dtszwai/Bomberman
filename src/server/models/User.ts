import { Position, UserState } from "../types";
import { generateUserName } from "../utils/name";

const USER_CONSTANTS = {
  IDLE_TIMEOUT: 5 * 60 * 1000, // 5 minutes
  MAX_NAME_LENGTH: 20,
  MIN_NAME_LENGTH: 3,
} as const;

export class User {
  public position?: Position;
  public joinedAt: number;
  public lastActivityAt: number;

  public constructor(
    public readonly id: string,
    public name: string = generateUserName()
  ) {
    if (
      name.length < USER_CONSTANTS.MIN_NAME_LENGTH ||
      name.length > USER_CONSTANTS.MAX_NAME_LENGTH
    ) {
      throw new Error("Invalid user name length");
    }
    this.joinedAt = Date.now();
    this.lastActivityAt = Date.now();
  }

  /** Get user's current state */
  public getState(): UserState {
    return Object.freeze({
      id: this.id,
      name: this.name,
      position: this.position,
      joinedAt: this.joinedAt,
      lastActivityAt: this.lastActivityAt,
    });
  }

  /** Check if user is inactive */
  public isIdle(): boolean {
    return Date.now() - this.lastActivityAt > USER_CONSTANTS.IDLE_TIMEOUT;
  }

  /** Update last activity timestamp */
  public updateActivity(): void {
    this.lastActivityAt = Date.now();
  }

  public setPosition(
    position: { roomId: string; seatIndex: number } | undefined
  ): void {
    this.position = position;
    this.updateActivity();
  }

  /** Get formatted user info */
  public toString(): string {
    return `User(${this.name})[${this.id}]${
      this.position ? ` in room ${this.position.roomId}` : ""
    }`;
  }
}
