import type { Position, UserProfileUpdate, UserState } from "@arcade/protocol";
import { generateUserName } from "../name";

export const USER_CONSTANTS = {
  IDLE_TIMEOUT: 10 * 60 * 1000, // 10 minutes
  MAX_NAME_LENGTH: 20,
  MIN_NAME_LENGTH: 3,
} as const;

export const AVATAR_COLORS = [
  "#22c55e",
  "#06b6d4",
  "#8b5cf6",
  "#f97316",
  "#ef4444",
  "#eab308",
] as const;

const DEFAULT_AVATAR_COLOR = AVATAR_COLORS[0];
const HEX_COLOR_RE = /^#[0-9a-fA-F]{6}$/;

export class User {
  public readonly id: string;
  public position?: Position;
  public joinedAt: number;
  public lastActivityAt: number;
  public online: boolean;

  public constructor(
    public socketId: string,
    public name: string = generateUserName(),
    public avatarColor: string = DEFAULT_AVATAR_COLOR
  ) {
    this.assertValidName(name);
    this.assertValidAvatarColor(avatarColor);
    this.id = crypto.randomUUID();
    this.joinedAt = Date.now();
    this.lastActivityAt = Date.now();
    this.online = true;
  }

  public getState(): UserState {
    return Object.freeze({
      id: this.id,
      socketId: this.socketId,
      name: this.name,
      avatarColor: this.avatarColor,
      position: this.position,
      joinedAt: this.joinedAt,
      lastActivityAt: this.lastActivityAt,
      online: this.online,
    });
  }

  public isIdle(): boolean {
    return Date.now() - this.lastActivityAt > USER_CONSTANTS.IDLE_TIMEOUT;
  }

  public updateSocketId(socketId: string) {
    this.socketId = socketId;
    this.online = true;
    this.updateActivity();
  }

  public updateActivity(): void {
    this.lastActivityAt = Date.now();
  }

  public updateProfile(update: UserProfileUpdate): void {
    if (update.name !== undefined) {
      const name = update.name.trim();
      this.assertValidName(name);
      this.name = name;
    }

    if (update.avatarColor !== undefined) {
      this.assertValidAvatarColor(update.avatarColor);
      this.avatarColor = update.avatarColor;
    }

    this.updateActivity();
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

  public toString(): string {
    return `${this.name}[${this.id}]`;
  }

  private assertValidName(name: string): void {
    if (
      name.length < USER_CONSTANTS.MIN_NAME_LENGTH ||
      name.length > USER_CONSTANTS.MAX_NAME_LENGTH
    ) {
      throw new Error("Name must be between 3 and 20 characters");
    }
  }

  private assertValidAvatarColor(color: string): void {
    if (!HEX_COLOR_RE.test(color)) {
      throw new Error("Avatar color must be a hex color");
    }
  }
}
