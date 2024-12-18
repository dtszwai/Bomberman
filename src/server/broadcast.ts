import { Server } from "socket.io";
import { Events, ServerEvents } from "@/events";
import { RoomState, LobbyState } from "@/server/types";
import { logger } from "@/server/logger";

export class EventBroadcaster {
  constructor(private readonly io: Server) {}

  public broadcastPlayerState(socketId: string): void {
    this.io.to(socketId).emit(Events.PLAYER_STATE, {
      id: socketId,
    } as ServerEvents["playerState"]);
  }

  public broadcastLobbyState(state: ServerEvents["lobbyState"]): void {
    this.io.emit(Events.LOBBY_STATE, state);
    logger.debug("Broadcasted lobby state update");
  }

  public broadcastRoomState(
    roomId: string,
    state: ServerEvents["roomState"]
  ): void {
    this.io.to(roomId).emit(Events.ROOM_STATE, state);
    logger.debug(`Broadcasted room state update for room ${roomId}`);
  }

  public broadcastGameState(
    roomId: string,
    state: ServerEvents["gameState"]
  ): void {
    this.io.to(roomId).emit(Events.GAME_STATE, state);
  }

  public notifyGamePaused(roomId: string): void {
    this.io.to(roomId).emit(Events.GAME_PAUSED);
  }

  public notifyGameResumed(roomId: string): void {
    this.io.to(roomId).emit(Events.GAME_RESUMED);
  }

  public notifyGameEnded(
    roomId: string,
    result: ServerEvents["gameEnded"]
  ): void {
    this.io.to(roomId).emit(Events.GAME_ENDED, result);
  }

  public notifyRoundStart(roomId: string): void {
    this.io.to(roomId).emit(Events.ROUND_START);
  }
}
