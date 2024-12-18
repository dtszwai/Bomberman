import { Server } from "socket.io";
import { GameSession } from "./GameSession";
import { Player, OperationResult, RoomState, PlayerControls } from "./types";
import { Events } from "@/events";

export class Room {
  private readonly players: Player[] = [];
  private gameSession?: GameSession;

  constructor(
    private readonly io: Server,
    public readonly id: string,
    public readonly name: string,
    public readonly maxPlayers: number,
    public hostId: string
  ) {}

  public addPlayer(player: Player): OperationResult<RoomState> {
    if (!this.canAddPlayer(player)) {
      return {
        success: false,
        message: this.getPlayerAdditionErrorMessage(player),
      };
    }

    player.roomId = this.id;
    player.index = this.players.length;
    this.players.push(player);

    return { success: true, data: { ...this.getState() } };
  }

  public removePlayer(playerId: string): void {
    const playerIndex = this.players.findIndex((p) => p.id === playerId);
    if (playerIndex === -1) return;

    const player = this.players[playerIndex];
    this.gameSession?.handlePlayerDisconnect(player.id);
    this.players.splice(playerIndex, 1);
    this.resetPlayerState(player);

    // If the host leaves, assign a new host
    if (playerId === this.hostId && this.players.length > 0) {
      this.hostId = this.players[0].id;
    }

    // Cleanup is handled by the Lobby
  }

  public startGame(initiatorId: string): OperationResult {
    if (!this.canStartGame(initiatorId)) {
      return {
        success: false,
        message: this.getGameStartErrorMessage(initiatorId),
      };
    }

    this.gameSession = new GameSession(this.io, {
      id: this.id,
      players: [...this.players],
      maxPlayers: this.maxPlayers,
      started: true,
      hostId: this.hostId,
      name: this.name,
    });

    this.gameSession.start();
    return { success: true };
  }

  public handlePlayerInput(playerId: string, controls: PlayerControls) {
    if (this.players.some((p) => p.id === playerId)) {
      this.gameSession?.handlePlayerInput(playerId, controls);
    }
  }

  public cleanup(): void {
    this.gameSession?.stop();
    this.gameSession = undefined;
    this.players.forEach(this.resetPlayerState);
  }

  public getState = (): RoomState => ({
    id: this.id,
    name: this.name,
    players: [...this.players],
    maxPlayers: this.maxPlayers,
    started: !!this.gameSession,
    hostId: this.hostId,
  });

  public shouldClose = () =>
    this.players.length === 0 || (this.isStarted() && this.players.length < 2);

  public isStarted = () => !!this.gameSession;

  public handleGameEnd = () => {
    this.gameSession = undefined;
    this.io.emit(Events.ROOM_STATE, this.getState());
  };

  private canAddPlayer = (player: Player) =>
    !this.isStarted() &&
    this.players.length < this.maxPlayers &&
    !player.roomId;

  private canStartGame = (initiatorId: string) =>
    initiatorId === this.hostId &&
    !this.isStarted() &&
    this.players.length >= 2;

  private resetPlayerState(player: Player) {
    player.roomId = undefined;
    player.index = undefined;
  }

  private getPlayerAdditionErrorMessage(player: Player) {
    if (this.isStarted()) return "Game is already in progress";
    if (this.players.length >= this.maxPlayers) return "Room is full";
    if (player.roomId) return "Player is already in another room";
    return "Cannot add player to room";
  }

  private getGameStartErrorMessage(initiatorId: string) {
    if (initiatorId !== this.hostId) return "Only the host can start the game";
    if (this.isStarted()) return "Game is already in progress";
    if (this.players.length < 2) return "Need at least 2 players to start";
    return "Cannot start game";
  }
}
