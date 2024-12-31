import {
  GlobalState,
  OperationResult,
  RoomSettings,
  RoomState,
} from "@/server/types";
import { GameRoom, Room } from ".";
import { User } from "../user/User";
import { UserService } from "../user";

export class RoomService {
  private rooms = new Map<string, Room>();

  constructor(private userService: UserService) {}

  public createRoom(
    host: User,
    settings: Partial<RoomSettings> = {}
  ): OperationResult<Room> {
    try {
      const room = GameRoom.create(host, undefined, settings);
      this.rooms.set(room.id, room);
      return { success: true, data: room };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : "Unknown error",
      };
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
    try {
      room.addUser(user, seatIndex);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : "Unknown error",
      };
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
