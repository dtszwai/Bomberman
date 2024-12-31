import {
  RoomState,
  RoomSettings,
  Seat,
  BaseRoomState,
  RoomType,
} from "../../types";
import { User } from "..";
import { logger } from "../../utils/logger";
import { emitter } from "../..";

export abstract class Room {
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
  public abstract readonly type: RoomType;

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

  private validateConstructorParams(host: User, name?: string) {
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

  /** Add a user to the room */
  public addUser(user: User, seatIndex: number): RoomState {
    this.validateUserAddition(user, seatIndex);
    try {
      Object.assign(this.seats[seatIndex], { user, ready: false });
      user.setPosition({ roomId: this.id, seatIndex });
      this.updateActivity();
      return this.getState();
    } catch (error) {
      Object.assign(this.seats[seatIndex], { user: null, ready: false });
      user.setPosition(undefined);
      logger.error(`Failed to add user to room ${this.id}`, error as Error);
      throw new Error("Failed to add user to room");
    }
  }

  /** Remove a user from the room */
  public removeUser(user: User) {
    const seat = this.findUserSeat(user);
    if (!seat) throw new Error("User not found in room");

    Object.assign(seat, { user: null, ready: false });
    user.setPosition(undefined);

    if (user.id === this.hostId && this.getUserCount() > 0) {
      this.transferHost();
    }

    if (this.getUserCount() === 0) {
      this.cleanup();
    }

    this.updateActivity();
  }

  /** Set the ready state of a user */
  public setReady(user: User) {
    const seat = this.findUserSeat(user);
    if (!seat) throw new Error("User not found in room");
    seat.ready = !seat.ready;
    user.updateActivity();
    this.updateActivity();
  }

  protected getBaseState = (): BaseRoomState =>
    Object.freeze({
      id: this.id,
      type: this.type,
      name: this.name,
      seats: [...this.seats],
      hostId: this.hostId,
      settings: { ...this.settings },
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    });

  public abstract getState(): RoomState;

  public isInactive(): boolean {
    return Date.now() - this.updatedAt > Room.ROOM_CONSTANTS.INACTIVITY_TIMEOUT;
  }

  protected validateUserAddition(user: User, seatIndex: number) {
    if (!user) throw new Error("User is required");
    if (seatIndex < 0 || seatIndex >= this.seats.length)
      throw new Error("Invalid seat index");
    if (this.getUserCount() >= this.settings.maxUsers)
      throw new Error("Room is full");
    if (this.seats[seatIndex].user) throw new Error("Seat is already taken");
    if (this.findUserSeat(user)) throw new Error("User is already in the room");
  }

  protected findUserSeat = (user: User) =>
    this.seats.find((s) => s.user?.id === user.id);

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
  public updateSettings(newSettings: Partial<RoomSettings>) {
    const minUsers = Room.ROOM_CONSTANTS.MIN_USERS;
    const maxUsers = Room.ROOM_CONSTANTS.MAX_USERS;

    if (
      newSettings?.maxUsers &&
      (newSettings?.maxUsers < minUsers || newSettings.maxUsers > maxUsers)
    ) {
      throw new Error(`Max users must be between ${minUsers} and ${maxUsers}`);
    }

    this.settings = { ...this.settings, ...newSettings };
    this.updateActivity();
  }

  public toString(): string {
    return `Room ${this.id} (${this.name})`;
  }
}
