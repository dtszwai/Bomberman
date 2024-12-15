import { Server } from "socket.io";
import { CreateRoomDto, Lobby, Room } from "./types";

export class RoomManager {
  constructor(private io: Server, private lobby: Lobby) {}

  /**
   * Create a room and automatically add the creator to it.
   * @param playerId The player creating the room.
   * @returns The created room, or null if creation failed.
   */
  public createRoom(playerId: string, dto?: CreateRoomDto): Room | null {
    const maxPlayers = dto?.maxPlayers || 4;

    const roomId = this.generateRoomId();
    const room: Room = {
      id: roomId,
      players: [],
      maxPlayers,
      started: false,
    };

    this.lobby.rooms[roomId] = room;

    // Automatically join the creator to the newly created room
    const joinResult = this.joinRoom(roomId, playerId);
    if (!joinResult.success) {
      // If for some reason the creator can't join, remove the room.
      delete this.lobby.rooms[roomId];
      return null;
    }

    return room;
  }

  /**
   * Player joins a specified room, if possible.
   * Assigns the player an index within that room.
   * @param roomId The ID of the room the player is trying to join.
   * @param playerId The ID of the player joining the room.
   * @returns Object containing success state and optional message.
   */
  public joinRoom(
    roomId: string,
    playerId: string
  ): { success: boolean; message?: string } {
    const room = this.lobby.rooms[roomId];
    if (!room) return { success: false, message: "Room does not exist." };
    if (room.started)
      return { success: false, message: "Game already started." };
    if (room.players.length >= room.maxPlayers) {
      return { success: false, message: "Room is full." };
    }
    const player = this.lobby.players[playerId];
    if (!player) return { success: false, message: "Player does not exist." };
    if (player.roomId)
      return player.roomId === roomId
        ? { success: false, message: "Player already in room." }
        : { success: false, message: "Player already in another room." };

    // Add the player to the room and assign their index
    player.roomId = roomId;
    player.index = room.players.length;
    room.players.push(player);

    this.broadcastLobbyState();
    return { success: true };
  }

  /**
   * Start the game if conditions are met.
   * @param roomId The ID of the room to start the game in.
   */
  public startGame(roomId: string) {
    const room = this.lobby.rooms[roomId];
    if (!room || room.started) return;

    room.started = true;
    // In a real game, you'd initialize and run your game logic here.
    // For now, we just emit a dummy "gameState" periodically.
    room.intervalId = setInterval(() => {
      const state = { dummy: "gameState" };
      this.io.in(room.id).emit("gameState", state);
    }, 1000 / 60);

    this.broadcastLobbyState();
  }

  /**
   * Handle player disconnection: remove them from their room and the lobby.
   * @param playerId The ID of the player who disconnected.
   */
  public handleDisconnect(playerId: string) {
    this.leaveRoom(playerId);
    delete this.lobby.players[playerId];
    this.broadcastLobbyState();
  }

  /**
   * Leave the room the player is currently in.
   * @param playerId The player's ID.
   */
  public leaveRoom(playerId: string) {
    const player = this.lobby.players[playerId];
    if (!player || !player.roomId) return;

    const room = this.lobby.rooms[player.roomId];
    if (!room) {
      player.roomId = undefined;
      player.index = undefined;
      return;
    }

    // Remove the player from the room's player array
    room.players = room.players.filter((p) => p.id !== playerId);

    // Reset player's room-related info
    player.roomId = undefined;
    player.index = undefined;

    // If the room is now empty, delete it
    if (room.players.length === 0) {
      delete this.lobby.rooms[room.id];
    }

    this.broadcastLobbyState();
  }

  /**
   * Emits the entire lobby state to all connected clients.
   * This includes all rooms and all players (with their room affiliations).
   */
  private broadcastLobbyState() {
    this.io.emit("lobbyUpdate", this.getLobbySnapshot());
  }

  /**
   * Generates a unique room ID.
   */
  private generateRoomId(): string {
    let roomId = Math.random().toString(36).substring(2, 8);
    while (this.lobby.rooms[roomId]) {
      roomId = Math.random().toString(36).substring(2, 8);
    }
    return roomId;
  }

  /**
   * Returns a full snapshot of the lobby: all rooms and all players.
   * Rooms include their players' IDs and indexes.
   */
  private getLobbySnapshot() {
    const rooms = Object.values(this.lobby.rooms).map((r) => ({
      id: r.id,
      maxPlayers: r.maxPlayers,
      started: r.started,
      players: r.players.map((p) => ({
        id: p.id,
        index: p.index,
      })),
    }));

    const players = Object.values(this.lobby.players).map((p) => ({
      id: p.id,
      roomId: p.roomId || null,
      index: p.index ?? null,
    }));

    return { rooms, players };
  }
}
