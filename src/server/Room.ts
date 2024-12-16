import { Server } from "socket.io";
import { GameController } from "./GameController";
import { Player, OperationResult, PlayerInput, IRoom } from "./types";

export class Room {
  private readonly players: Player[] = [];
  private gameController?: GameController;

  constructor(
    private readonly io: Server,
    public readonly id: string,
    public readonly name: string,
    public readonly maxPlayers: number,
    public hostId: string
  ) {}

  public addPlayer(player: Player): OperationResult<IRoom> {
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
    this.players.splice(playerIndex, 1);
    this.resetPlayerState(player);

    // If the host leaves, assign a new host
    if (playerId === this.hostId && this.players.length > 0) {
      this.hostId = this.players[0].id;
    }
  }

  public startGame(initiatorId: string): OperationResult {
    if (!this.canStartGame(initiatorId)) {
      return {
        success: false,
        message: this.getGameStartErrorMessage(initiatorId),
      };
    }

    this.gameController = new GameController(this.io, {
      id: this.id,
      players: this.players,
      maxPlayers: this.maxPlayers,
      started: true,
      hostId: this.hostId,
      name: this.name,
    });

    this.gameController.start();
    return { success: true };
  }

  public handlePlayerInput(playerId: string, input: PlayerInput): void {
    this.gameController?.handlePlayerInput(playerId, input);
  }

  public cleanup(): void {
    this.gameController?.stop();
    delete this.gameController;
    this.players.forEach(this.resetPlayerState);
  }

  public getState = (): IRoom => ({
    id: this.id,
    name: this.name,
    players: this.players,
    maxPlayers: this.maxPlayers,
    started: !!this.gameController,
    hostId: this.hostId,
  });

  public shouldClose = () =>
    this.players.length === 0 || (this.isStarted() && this.players.length < 2);

  public isStarted = () => !!this.gameController;

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
