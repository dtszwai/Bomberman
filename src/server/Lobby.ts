import {
  LobbyState as ILobby,
  OperationResult,
  Player,
  PlayerControls,
  RoomState,
} from "./types";
import { Room } from "./Room";
import { emitter } from ".";

export class Lobby {
  private players: Record<string, Player> = {};
  private rooms: Record<string, Room> = {};

  public constructor() {}

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
  ): OperationResult<RoomState> {
    const host = this.players[hostId];

    if (!host) {
      return { success: false, message: "Host player not found" };
    }
    if (host.roomId) {
      return { success: false, message: "Already in room" };
    }

    const roomId = this.generateRoomId();
    const room = new Room(
      roomId,
      config.name || `Room ${roomId.slice(0, 4)}`,
      config.maxPlayers || 4,
      hostId,
      () => this.handleRoomStateChange(roomId)
    );

    this.rooms[roomId] = room;
    const result = room.addPlayer(host);

    emitter.broadcastPlayerState(hostId, host);

    if (!result.success) {
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

    if (player.roomId && player.roomId !== roomId) {
      // Leave the current room first if already in one
      this.leaveRoom(playerId);
    }

    const result = room.addPlayer(player);
    emitter.broadcastPlayerState(playerId, player);
    return { ...result, data: room.getState() };
  }

  public handlePlayerInput(
    roomId: string,
    playerId: string,
    controls: PlayerControls
  ) {
    this.rooms[roomId]?.handlePlayerInput(playerId, controls);
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
    return room.startGame(initiatorId);
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
    emitter.broadcastPlayerState(playerId, player);
    return { success: true, data: { id: roomId } };
  }

  public getLobbyState(): ILobby {
    return {
      players: this.players,
      rooms: Object.fromEntries(
        Object.entries(this.rooms).map(([id, room]) => [id, room.getState()])
      ),
    };
  }

  private cleanupRoomIfNeeded(roomId: string) {
    const room = this.rooms[roomId];
    if (room?.shouldClose()) {
      room.cleanup();
      delete this.rooms[roomId];
      this.broadcastLobbyUpdate();
    }
  }

  private broadcastLobbyUpdate() {
    emitter.broadcastLobbyState(this.getLobbyState());
  }

  private handleRoomStateChange(roomId: string) {
    if (this.rooms[roomId]) {
      this.broadcastLobbyUpdate();
    }
  }

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
}
