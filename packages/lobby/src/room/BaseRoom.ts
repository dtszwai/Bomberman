import {
  RoomType,
  type BotDifficulty,
  type RoomSettings,
  type Seat as PublicSeat,
} from "@arcade/protocol";
import {
  createBotId,
  createBotName,
  createHumanActor,
  normalizeBotDifficulty,
  normalizeBotName,
} from "../actors";
import { EventBroadcaster } from "../EventBroadcaster";
import { logger } from "../logger";
import type { BaseRoomState, RoomState, Seat } from "../types";
import type { User } from "../user/User";

export abstract class BaseRoom {
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
    this.id = String(BaseRoom.counter++);
    this.name = roomName?.trim() || `Room#${this.id}`;
    this.settings = this.getDefaultSettings();
    this.createdAt = Date.now();
    this.updatedAt = this.createdAt;
    this.seats = this.initializeSeats();
    this.hostId = host.id;
    this.seats[0].actor = createHumanActor(host);
    host.setPosition({ roomId: this.id, seatIndex: 0 });
    logger.info(`${host} created ${this}`);
  }

  private validateConstructorParams(host: User, name?: string) {
    if (!host) {
      throw new Error("Host are required");
    }
    if (
      name &&
      (name.length < BaseRoom.ROOM_CONSTANTS.MIN_NAME_LENGTH ||
        name.length > BaseRoom.ROOM_CONSTANTS.MAX_NAME_LENGTH)
    ) {
      throw new Error(
        `Room name must be between ${BaseRoom.ROOM_CONSTANTS.MIN_NAME_LENGTH} and ${BaseRoom.ROOM_CONSTANTS.MAX_NAME_LENGTH} characters`
      );
    }
  }

  private initializeSeats = (): Seat[] =>
    Array.from({ length: this.settings.maxUsers }, (_, i) => ({
      index: i,
      actor: null,
      ready: false,
    }));

  private getDefaultSettings = (): RoomSettings => ({
    maxUsers: BaseRoom.ROOM_CONSTANTS.MAX_USERS,
    isPrivate: false,
    roomCode: null,
    allowSpectators: false,
    maxWins: 2,
    roundTimeSeconds: 180,
    mapId: "classic",
    powerupPreset: "classic",
    tournamentMode: false,
  });

  public addUser(user: User, seatIndex: number): RoomState {
    this.validateUserAddition(user, seatIndex);
    try {
      Object.assign(this.seats[seatIndex], {
        actor: createHumanActor(user),
        ready: false,
      });
      user.setPosition({ roomId: this.id, seatIndex });
      this.updateActivity();
      logger.info(`${user} joined ${this}`);
      return this.getState();
    } catch (error) {
      Object.assign(this.seats[seatIndex], { actor: null, ready: false });
      user.setPosition(undefined);
      logger.error(`Failed to add user to room ${this.id}`, error as Error);
      throw new Error("Failed to add user to room");
    }
  }

  public removeUser(user: User) {
    const seat = this.findUserSeat(user);
    if (!seat) throw new Error("User not found in room");

    Object.assign(seat, { actor: null, ready: false });
    user.setPosition(undefined);

    if (user.id === this.hostId && this.getUserCount() > 0) {
      this.transferHost();
    }

    if (this.getUserCount() === 0) {
      this.cleanup();
    }

    logger.info(`${user} left ${this}`);
    this.updateActivity();
  }

  public addBot(
    initiator: User,
    payload: {
      seatIndex?: number;
      difficulty?: BotDifficulty;
      name?: string;
    } = {}
  ): RoomState {
    this.validateHostAction(initiator);
    const seat =
      payload.seatIndex === undefined
        ? this.seats.find((candidate) => !candidate.actor)
        : this.seats[payload.seatIndex];

    if (!seat) throw new Error("No empty seat available");
    if (seat.actor) throw new Error("Seat is already taken");
    if (this.getActorCount() >= this.settings.maxUsers) {
      throw new Error("Room is full");
    }

    const difficulty = normalizeBotDifficulty(payload.difficulty);
    seat.actor = {
      kind: "bot",
      bot: {
        id: createBotId(this.id, seat.index),
        name: normalizeBotName(
          payload.name ?? createBotName(seat.index),
          seat.index
        ),
        difficulty,
        seed: this.createBotSeed(),
        createdByUserId: initiator.id,
      },
    };
    seat.ready = true;
    this.updateActivity();
    logger.info(`${initiator} added bot to ${this}`);
    return this.getState();
  }

  public removeBot(initiator: User, seatIndex: number): RoomState {
    this.validateHostAction(initiator);
    const seat = this.seats[seatIndex];
    if (!seat) throw new Error("Invalid seat index");
    if (seat.actor?.kind !== "bot") {
      throw new Error("Seat does not contain a bot");
    }
    Object.assign(seat, { actor: null, ready: false });
    this.updateActivity();
    logger.info(`${initiator} removed bot from ${this}`);
    return this.getState();
  }

  public updateBot(
    initiator: User,
    seatIndex: number,
    payload: { difficulty?: BotDifficulty; name?: string }
  ): RoomState {
    this.validateHostAction(initiator);
    const seat = this.seats[seatIndex];
    if (!seat) throw new Error("Invalid seat index");
    if (seat.actor?.kind !== "bot") {
      throw new Error("Seat does not contain a bot");
    }
    seat.actor.bot = {
      ...seat.actor.bot,
      difficulty: normalizeBotDifficulty(
        payload.difficulty ?? seat.actor.bot.difficulty
      ),
      name:
        payload.name === undefined
          ? seat.actor.bot.name
          : normalizeBotName(payload.name, seat.index),
    };
    seat.ready = true;
    this.updateActivity();
    logger.info(`${initiator} updated bot in ${this}`);
    return this.getState();
  }

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
      seats: this.getPublicSeats(),
      hostId: this.hostId,
      settings: { ...this.settings },
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    });

  public abstract getState(): RoomState;

  public isInactive(): boolean {
    return (
      Date.now() - this.updatedAt > BaseRoom.ROOM_CONSTANTS.INACTIVITY_TIMEOUT
    );
  }

  protected validateUserAddition(user: User, seatIndex: number) {
    if (!user) throw new Error("User is required");
    if (seatIndex < 0 || seatIndex >= this.seats.length)
      throw new Error("Invalid seat index");
    if (this.getUserCount() >= this.settings.maxUsers)
      throw new Error("Room is full");
    if (this.seats[seatIndex].actor) throw new Error("Seat is already taken");
    if (this.findUserSeat(user)) throw new Error("User is already in the room");
  }

  protected findUserSeat = (user: User) =>
    this.seats.find(
      (seat) => seat.actor?.kind === "human" && seat.actor.user.id === user.id
    );

  protected cleanup() {
    this.seats.forEach((seat) => {
      if (seat.actor?.kind === "human") {
        seat.actor.user.setPosition(undefined);
      }
    });
  }

  public getUserCount = () =>
    this.seats.filter((seat) => seat.actor?.kind === "human").length;

  public getActorCount = () =>
    this.seats.filter((seat) => seat.actor !== null).length;

  protected isAllReady = () =>
    this.seats.every(
      (seat) =>
        seat.actor === null ||
        seat.actor.kind === "bot" ||
        seat.ready ||
        seat.actor.user.id === this.hostId
    );

  protected updateActivity(): void {
    this.updatedAt = Date.now();
  }

  protected transferHost(): void {
    const firstUserSeat = this.seats.find(
      (seat) => seat.actor?.kind === "human"
    );
    if (firstUserSeat?.actor?.kind === "human") {
      this.hostId = firstUserSeat.actor.user.id;
    }
    EventBroadcaster.getInstance().room(this);
  }

  public updateSettings(newSettings: Partial<RoomSettings>) {
    const minUsers = BaseRoom.ROOM_CONSTANTS.MIN_USERS;
    const maxUsers = BaseRoom.ROOM_CONSTANTS.MAX_USERS;

    if (
      newSettings?.maxUsers !== undefined &&
      (newSettings?.maxUsers < minUsers || newSettings.maxUsers > maxUsers)
    ) {
      throw new Error(`Max users must be between ${minUsers} and ${maxUsers}`);
    }

    if (
      newSettings.maxUsers !== undefined &&
      newSettings.maxUsers < this.getActorCount()
    ) {
      throw new Error("Max users cannot be lower than occupied seats");
    }

    this.settings = { ...this.settings, ...newSettings };
    this.resizeSeats(this.settings.maxUsers);
    this.updateActivity();
  }

  public toString(): string {
    return `Room(${this.name})`;
  }

  private validateHostAction(initiator: User) {
    if (initiator.id !== this.hostId) {
      throw new Error("Only the host can perform this action");
    }
  }

  private createBotSeed(): number {
    const bytes = new Uint32Array(1);
    crypto.getRandomValues(bytes);
    return bytes[0];
  }

  private resizeSeats(maxUsers: number): void {
    if (this.seats.length === maxUsers) return;

    if (this.seats.length > maxUsers) {
      const seatsToRemove = this.seats.slice(maxUsers);
      if (seatsToRemove.some((seat) => seat.actor)) {
        throw new Error("Cannot remove occupied seats");
      }
      this.seats = this.seats.slice(0, maxUsers);
      return;
    }

    const start = this.seats.length;
    for (let index = start; index < maxUsers; index++) {
      this.seats.push({ index, actor: null, ready: false });
    }
  }

  private getPublicSeats(): PublicSeat[] {
    return this.seats.map((seat) => ({
      index: seat.index,
      ready: seat.ready,
      actor:
        seat.actor?.kind === "human"
          ? { kind: "human", user: seat.actor.user.getState() }
          : seat.actor?.kind === "bot"
          ? { kind: "bot", bot: { ...seat.actor.bot } }
          : null,
    }));
  }
}
