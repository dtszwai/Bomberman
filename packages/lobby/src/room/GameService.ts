import type { OperationResult, UserControls } from "@arcade/protocol";
import { EventBroadcaster } from "../EventBroadcaster";
import type { User } from "../user/User";
import { BaseGameRoom } from "./BaseGameRoom";
import type { RoomService } from "./RoomService";

export class GameService<G = unknown> {
  constructor(private roomService: RoomService<G>) {}

  startGame(user: User): OperationResult {
    const roomId = user.position?.roomId;
    if (!roomId) {
      return { success: false, message: "User is not in a room" };
    }

    const room = this.roomService.getRoom(roomId);
    if (!room || !(room instanceof BaseGameRoom)) {
      return { success: false, message: "Invalid game room" };
    }

    try {
      room.startGame(user);
      const emitter = EventBroadcaster.getInstance();
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
    if (!room || !(room instanceof BaseGameRoom)) {
      return { success: false, message: "Invalid game room" };
    }

    try {
      room.setReady(user);
      const emitter = EventBroadcaster.getInstance();
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
    if (!room || !(room instanceof BaseGameRoom)) return;

    room.handleUserInput(user, input);
  }
}
