import { OperationResult, UserControls } from "@/server/types";
import { RoomService } from "./room.service";
import { User } from "../user";
import { GameRoom } from "./GameRoom";
import { emitter } from "@/server";

export class GameService {
  constructor(private roomService: RoomService) {}

  startGame(user: User): OperationResult {
    const roomId = user.position?.roomId;
    if (!roomId) {
      return { success: false, message: "User is not in a room" };
    }

    const room = this.roomService.getRoom(roomId);

    if (!room || !(room instanceof GameRoom)) {
      return { success: false, message: "Invalid game room" };
    }

    try {
      room.startGame(user);
      emitter.room(room);
      emitter.lobby();
      return { success: true };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  toggleReady(user: User): OperationResult {
    const roomId = user.position?.roomId;
    if (!roomId) {
      return { success: false, message: "User is not in a room" };
    }

    const room = this.roomService.getRoom(roomId);
    if (!room || !(room instanceof GameRoom)) {
      return { success: false, message: "Invalid game room" };
    }

    try {
      room.setReady(user);
      emitter.room(room);
      emitter.lobby();
      return { success: true };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  handleUserInput(user: User, input: UserControls): void {
    const roomId = user.position?.roomId;
    if (!roomId) return;

    const room = this.roomService.getRoom(roomId);
    if (!room || !(room instanceof GameRoom)) return;

    room.handleUserInput(user, input);
  }
}
