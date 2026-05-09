import type {
  BotDifficulty,
  OperationResult,
  RoomSettings,
} from "@arcade/protocol";
import { EventBroadcaster } from "../EventBroadcaster";
import { logger } from "../logger";
import type { GlobalState, RoomState } from "../types";
import type { User } from "../user/User";
import type { UserService } from "../user/UserService";
import type { BaseGameRoom } from "./BaseGameRoom";
import type { BaseRoom } from "./BaseRoom";

export type RoomFactory<G> = (
  host: User,
  name: string | undefined,
  settings: Partial<RoomSettings>
) => BaseGameRoom<G>;

export class RoomService<G = unknown> {
  private rooms = new Map<string, BaseGameRoom<G>>();

  constructor(
    private userService: UserService,
    private roomFactory: RoomFactory<G>
  ) {}

  public createRoom(
    host: User,
    settings: Partial<RoomSettings> = {}
  ): OperationResult<BaseGameRoom<G>> {
    try {
      if (host.position) {
        this.leaveRoom(host);
      }

      const room = this.roomFactory(host, undefined, settings);
      this.rooms.set(room.id, room);
      const emitter = EventBroadcaster.getInstance();
      emitter.lobby();
      emitter.whoami(host);
      emitter.room(room);
      return { success: true, data: room };
    } catch (e) {
      const error = e instanceof Error ? e.message : "Unknown error";
      logger.error(error);
      return { success: false, message: error };
    }
  }

  public joinRoom(
    user: User,
    roomId: string,
    seatIndex: number
  ): OperationResult<RoomState<G>> {
    const room = this.rooms.get(roomId);
    if (!room) {
      return { success: false, message: "Room not found" };
    }
    if (room.id === user.position?.roomId) {
      return { success: false, message: "User is already in the room" };
    }

    if (user.position) {
      this.leaveRoom(user);
    }

    try {
      room.addUser(user, seatIndex);
      const emitter = EventBroadcaster.getInstance();
      emitter.lobby();
      emitter.whoami(user);
      emitter.room(room);
      return { success: true };
    } catch (e) {
      const error = e instanceof Error ? e.message : "Unknown error";
      logger.error(error);
      return { success: false, message: error };
    }
  }

  public updateRoomSettings(
    user: User,
    roomId: string,
    settings: Partial<RoomSettings>
  ): OperationResult<RoomState<G>> {
    const room = this.rooms.get(roomId);
    if (!room) {
      return { success: false, message: "Room not found" };
    }

    if (room.hostId !== user.id) {
      return { success: false, message: "Only the host can change settings" };
    }

    try {
      room.updateSettings(settings);
      const emitter = EventBroadcaster.getInstance();
      emitter.lobby();
      emitter.room(room);
      return { success: true, data: room.getState() };
    } catch (e) {
      const error = e instanceof Error ? e.message : "Unknown error";
      logger.error(error);
      return { success: false, message: error };
    }
  }

  public addBot(
    user: User,
    roomId: string,
    payload: { seatIndex?: number; difficulty?: BotDifficulty; name?: string }
  ): OperationResult<RoomState<G>> {
    const room = this.rooms.get(roomId);
    if (!room) {
      return { success: false, message: "Room not found" };
    }

    try {
      room.addBot(user, payload);
      const emitter = EventBroadcaster.getInstance();
      emitter.lobby();
      emitter.room(room);
      return { success: true, data: room.getState() };
    } catch (e) {
      const error = e instanceof Error ? e.message : "Unknown error";
      logger.error(error);
      return { success: false, message: error };
    }
  }

  public removeBot(
    user: User,
    roomId: string,
    seatIndex: number
  ): OperationResult<RoomState<G>> {
    const room = this.rooms.get(roomId);
    if (!room) {
      return { success: false, message: "Room not found" };
    }

    try {
      room.removeBot(user, seatIndex);
      const emitter = EventBroadcaster.getInstance();
      emitter.lobby();
      emitter.room(room);
      return { success: true, data: room.getState() };
    } catch (e) {
      const error = e instanceof Error ? e.message : "Unknown error";
      logger.error(error);
      return { success: false, message: error };
    }
  }

  public updateBot(
    user: User,
    roomId: string,
    seatIndex: number,
    payload: { difficulty?: BotDifficulty; name?: string }
  ): OperationResult<RoomState<G>> {
    const room = this.rooms.get(roomId);
    if (!room) {
      return { success: false, message: "Room not found" };
    }

    try {
      room.updateBot(user, seatIndex, payload);
      const emitter = EventBroadcaster.getInstance();
      emitter.lobby();
      emitter.room(room);
      return { success: true, data: room.getState() };
    } catch (e) {
      const error = e instanceof Error ? e.message : "Unknown error";
      logger.error(error);
      return { success: false, message: error };
    }
  }

  public leaveRoom(user: User): OperationResult {
    if (!user.position) {
      return { success: false, message: "User not in a room" };
    }

    const room = this.rooms.get(user.position.roomId);
    if (!room) {
      return { success: false, message: "Room not found" };
    }

    room.removeUser(user);
    if (room.getUserCount() === 0) {
      this.deleteRoom(room.id);
    }

    const emitter = EventBroadcaster.getInstance();
    emitter.lobby();
    emitter.room(room);
    emitter.whoami(user);
    return { success: true };
  }

  public getRoom(id: string): BaseGameRoom<G> | undefined {
    return this.rooms.get(id);
  }

  public getRooms(): Map<string, BaseRoom> {
    return this.rooms;
  }

  public deleteRoom(id: string): void {
    this.rooms.delete(id);
  }

  public getGlobalState(): GlobalState<G> {
    return {
      rooms: Object.fromEntries(
        [...this.rooms].map(([id, room]) => [id, room.getState()])
      ),
      users: Object.fromEntries(
        [...this.userService.getOnlineUsers()].map(([id, user]) => [
          id,
          user.getState(),
        ])
      ),
    };
  }
}
