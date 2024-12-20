import { AnyRoomState, OperationResult, RoomSettings, Seat } from "../types";
import { User } from "./User";
import { logger } from "../utils/logger";
import { emitter } from "..";

export class Room {
  protected static counter = 0;
  protected static readonly ROOM_CONSTANTS = {
    MIN_USERS: 2,
    MAX_USERS: 4,
    INACTIVITY_TIMEOUT: 15 * 60 * 1000, // 15 minutes
    MIN_NAME_LENGTH: 1,
    MAX_NAME_LENGTH: 10,
  } as const;

  public seats: Seat[];
  public readonly id: string;
  public readonly name: string;
  public hostId: string;
  public readonly createdAt: number;
  public updatedAt: number;
  protected settings: RoomSettings;

  constructor(host: User, roomName?: string) {
    this.validateConstructorParams(host, roomName);
    this.id = String(Room.counter++);
    this.name = roomName?.trim() || `Room#${this.id}`;
    this.settings = this.getDefaultSettings();
    this.createdAt = Date.now();
    this.updatedAt = this.createdAt;
    this.seats = this.initializeSeats();
    this.hostId = host.id;
    host.setPosition({ roomId: this.id, seatIndex: 0 });
  }

  private validateConstructorParams(host: User, name?: string): void {
    if (!host) {
      throw new Error("Host are required");
    }
    if (
      name &&
      (name.length < Room.ROOM_CONSTANTS.MIN_NAME_LENGTH ||
        name.length > Room.ROOM_CONSTANTS.MAX_NAME_LENGTH)
    ) {
      throw new Error(
        `Room name must be between ${Room.ROOM_CONSTANTS.MIN_NAME_LENGTH} and ${Room.ROOM_CONSTANTS.MAX_NAME_LENGTH} characters`
      );
    }
  }

  private initializeSeats = (): Seat[] =>
    Array.from({ length: this.settings.maxUsers }, (_, i) => ({
      index: i,
      user: null,
      ready: false,
    }));

  private getDefaultSettings = (): RoomSettings => ({
    maxUsers: Room.ROOM_CONSTANTS.MAX_USERS,
    isPrivate: false,
    roomCode: null,
    allowSpectators: false,
  });

  /** Create a new room */
  public static create(
    host: User,
    roomName?: string,
    settings: Partial<RoomSettings> = {}
  ): OperationResult<Room | void> {
    try {
      const room = new Room(host, roomName);
      const settingsResult = room.updateSettings(settings);
      if (!settingsResult.success) {
        Room.counter--;
        return settingsResult;
      }
      room.seats[0].user = host;
      return { success: true, data: room };
    } catch (error) {
      logger.error("Failed to create room", error as Error);
      host.setPosition(undefined);
      return {
        success: false,
        message: `Failed to create room: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      };
    }
  }

  /** Add a user to the room */
  public addUser(user: User, seatIndex: number): OperationResult<AnyRoomState> {
    const validationError = this.validateUserAddition(user, seatIndex);
    if (validationError) {
      return { success: false, message: validationError };
    }
    try {
      Object.assign(this.seats[seatIndex], { user, ready: false });
      user.setPosition({ roomId: this.id, seatIndex });
      this.updateActivity();
      return { success: true, data: this.getState() };
    } catch (error) {
      logger.error(`Failed to add user to room ${this.id}`, error as Error);
      Object.assign(this.seats[seatIndex], { user: null, ready: false });
      user.setPosition(undefined);
      return {
        success: false,
        message: `Failed to join Room: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      };
    }
  }

  /** Remove a user from the room */
  public removeUser(user: User): OperationResult {
    const seat = this.findUserSeat(user);
    if (!seat) {
      return { success: false, message: "User not found in room" };
    }

    try {
      Object.assign(seat, { user: null, ready: false });
      user.setPosition(undefined);

      if (user.id === this.hostId && this.getUserCount() > 0) {
        this.transferHost();
      }

      this.updateActivity();

      if (this.getUserCount() === 0) {
        this.cleanup();
      }

      return { success: true };
    } catch (error) {
      logger.error(
        `Failed to remove user from room ${this.id}`,
        error as Error
      );
      return {
        success: false,
        message: `Failed to remove user: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      };
    }
  }

  /** Set the ready state of a user */
  public setReady(user: User): OperationResult {
    const seat = this.findUserSeat(user);
    if (!seat) {
      return { success: false, message: "User not found in room" };
    }
    seat.ready = !seat.ready;
    user.updateActivity();
    this.updateActivity();
    return { success: true };
  }

  public getState(): Readonly<AnyRoomState> {
    return Object.freeze({
      id: this.id,
      type: "room",
      name: this.name,
      seats: [...this.seats],
      hostId: this.hostId,
      settings: { ...this.settings },
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    });
  }

  public isInactive(): boolean {
    return Date.now() - this.updatedAt > Room.ROOM_CONSTANTS.INACTIVITY_TIMEOUT;
  }

  protected validateUserAddition(user: User, seatIndex: number): string | null {
    if (!user) return "User is required";
    if (seatIndex < 0 || seatIndex >= this.seats.length)
      return "Invalid seat index";
    if (this.getUserCount() >= this.settings.maxUsers) return "Room is full";
    if (this.seats[seatIndex].user)
      return "Seat is already taken by another user";
    if (this.findUserSeat(user)) return "User already in this room";
    return null;
  }

  protected findUserSeat(user: User): Seat | undefined {
    return this.seats.find((s) => s.user?.id === user.id);
  }

  protected cleanup() {
    this.seats.forEach((seat) => {
      if (seat.user) {
        seat.user.setPosition(undefined);
      }
    });
  }

  public getUserCount = () => this.seats.filter((s) => s.user !== null).length;

  protected isAllReady = () =>
    this.seats.every(
      (seat) => seat.user === null || seat.ready || seat.user.id === this.hostId
    );

  protected updateActivity(): void {
    this.updatedAt = Date.now();
  }

  protected transferHost(): void {
    const firstUser = this.seats.find((seat) => seat.user)?.user;
    if (firstUser) {
      this.hostId = firstUser.id;
    }
    emitter.room(this);
  }

  /** Update the room settings */
  public updateSettings(newSettings: Partial<RoomSettings>): OperationResult {
    const minUsers = Room.ROOM_CONSTANTS.MIN_USERS;
    const maxUsers = Room.ROOM_CONSTANTS.MAX_USERS;
    try {
      if (
        newSettings?.maxUsers &&
        (newSettings?.maxUsers < minUsers || newSettings.maxUsers > maxUsers)
      ) {
        return {
          success: false,
          message: `Max users must be between ${minUsers} and ${maxUsers}`,
        };
      }

      this.settings = {
        ...this.settings,
        ...newSettings,
      };

      this.updateActivity();
      return { success: true };
    } catch (error) {
      return {
        success: false,
        message: `Failed to update settings: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      };
    }
  }

  public toString(): string {
    return `Room ${this.id} (${this.name})`;
  }
}
