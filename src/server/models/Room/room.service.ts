import {
  GlobalState,
  OperationResult,
  RoomSettings,
  RoomState,
} from "@/server/types";
import { GameRoom, Room } from ".";
import { User } from "../user/User";
import { UserService } from "../user";
import { logger } from "@/server/utils/logger";
import { emitter } from "@/server";

export class RoomService {
  private rooms = new Map<string, Room>();

  constructor(private userService: UserService) {}

  public createRoom(
    host: User,
    settings: Partial<RoomSettings> = {}
  ): OperationResult<Room> {
    try {
      if (host.position) {
        this.leaveRoom(host);
      }

      const room = GameRoom.create(host, undefined, settings);
      this.rooms.set(room.id, room);
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
  ): OperationResult<RoomState> {
    const room = this.rooms.get(roomId);
    if (!room) {
      return { success: false, message: "Room not found" };
    }
    if (room.id === user.position?.roomId) {
      // TODO: Allow user to change seat
      return { success: false, message: "User is already in the room" };
    }

    if (user.position) {
      this.leaveRoom(user);
    }

    try {
      room.addUser(user, seatIndex);
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

    emitter.lobby();
    emitter.room(room);
    emitter.whoami(user);
    return { success: true };
  }

  public getRoom(id: string): Room | undefined {
    return this.rooms.get(id);
  }

  public getRooms(): Map<string, Room> {
    return this.rooms;
  }

  public deleteRoom(id: string): void {
    this.rooms.delete(id);
  }

  public getGlobalState(): GlobalState {
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
