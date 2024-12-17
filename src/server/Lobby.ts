import { Server } from "socket.io";
import {
  LobbyState as ILobby,
  OperationResult,
  Player,
  PlayerAction,
  RoomState,
} from "./types";
import { Room } from "./Room";
import { Events } from "@/events";

export class Lobby {
  private players: Record<string, Player> = {};
  private rooms: Record<string, Room> = {};

  public constructor(private readonly io: Server) {}

  public addPlayer(playerId: string) {
    this.players[playerId] = { id: playerId };
    this.broadcastLobbyUpdate();
  }

  public removePlayer(playerId: string): void {
    const player = this.players[playerId];
    const roomId = player?.roomId;
    if (roomId) {
      this.rooms[roomId]?.removePlayer(playerId);
      this.cleanupRoomIfNeeded(roomId);
    }
    delete this.players[playerId];
    this.broadcastLobbyUpdate();
  }

  public createRoom(
    hostId: string,
    config: {
      name?: string;
      maxPlayers?: number;
    } = {}
  ) {
    const host = this.players[hostId];

    if (!host) {
      return { success: false, message: "Host player not found" };
    }
    if (host.roomId) {
      return { success: false, message: "Already in room" };
    }

    const roomId = this.generateRoomId();
    const room = new Room(
      this.io,
      roomId,
      config.name || `Room ${roomId.slice(0, 4)}`,
      config.maxPlayers || 4,
      hostId
    );

    this.rooms[roomId] = room;
    const result = room.addPlayer(host);

    if (result.success) {
      this.broadcastLobbyUpdate();
    } else {
      delete this.rooms[roomId];
    }

    return result;
  }

  public joinRoom(
    roomId: string,
    playerId: string
  ): OperationResult<RoomState> {
    const room = this.rooms[roomId];
    const player = this.players[playerId];

    if (!room) return { success: false, message: "Room not found" };
    if (!player) return { success: false, message: "Player not found." };
    if (player.roomId) return { success: false, message: "Already in room." };

    const result = room.addPlayer(player);
    if (result.success) {
      this.broadcastLobbyUpdate();
      this.broadcastRoomUpdate(roomId);
    }

    return { ...result, data: room.getState() };
  }

  public handlePlayerInput(
    roomId: string,
    playerId: string,
    input: PlayerAction
  ) {
    this.rooms[roomId]?.handlePlayerInput(playerId, input);
  }

  public initiateGame(initiatorId: string): OperationResult {
    const player = this.players[initiatorId];
    if (!player) {
      return { success: false, message: "Player not found." };
    }
    if (!player.roomId) {
      return { success: false, message: "Not in a room." };
    }
    const room = this.rooms[player.roomId];

    const result = room.startGame(initiatorId);
    if (result.success) {
      this.broadcastLobbyUpdate();
      this.broadcastRoomUpdate(room.id);
    }

    return result;
  }

  public leaveRoom(playerId: string): OperationResult<{ id: string }> {
    const player = this.players[playerId];
    if (!player) {
      return { success: false, message: "Player not found." };
    }
    if (!player.roomId) {
      return { success: false, message: "Not in a room." };
    }

    const roomId = player.roomId;
    this.rooms[roomId]?.removePlayer(playerId);
    this.cleanupRoomIfNeeded(roomId);
    this.broadcastLobbyUpdate();
    this.broadcastRoomUpdate(roomId);
    return { success: true, data: { id: roomId } };
  }

  private cleanupRoomIfNeeded(roomId: string) {
    const room = this.rooms[roomId];
    if (room?.shouldClose()) {
      room.cleanup();
      delete this.rooms[roomId];
      this.broadcastLobbyUpdate();
      this.io.socketsLeave(roomId);
    }
  }

  /**
   * Emits the entire lobby state to all connected clients.
   * This includes all rooms and all players (with their room affiliations).
   */
  private broadcastLobbyUpdate() {
    this.io.emit(Events.LOBBY_STATE, this.getLobbyState());
  }

  private broadcastRoomUpdate(roomId: string) {
    this.io.to(roomId).emit(Events.ROOM_STATE, this.rooms[roomId]?.getState());
  }

  /**
   * Generates a unique room ID.
   */
  private generateRoomId(): string {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let roomId: string;
    do {
      roomId = Array(6)
        .fill(0)
        .map(() => chars.charAt(Math.floor(Math.random() * chars.length)))
        .join("");
    } while (this.rooms[roomId]);
    return roomId;
  }

  /**
   * Returns a full snapshot of the lobby: all rooms and all players.
   * Rooms include their players' IDs and indexes.
   */
  public getLobbyState(): ILobby {
    return {
      players: this.players,
      rooms: Object.fromEntries(
        Object.entries(this.rooms).map(([id, room]) => [id, room.getState()])
      ),
    };
  }
}
