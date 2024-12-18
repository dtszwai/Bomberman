import { GameSession } from "./GameSession";
import { Player, OperationResult, RoomState, PlayerControls } from "./types";
import { logger } from "./logger";
import { emitter } from ".";

export class Room {
  private readonly players: Player[] = [];
  private gameSession?: GameSession;

  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly maxPlayers: number,
    public hostId: string
  ) {}

  public addPlayer(player: Player): OperationResult<RoomState> {
    const validationError = this.validatePlayerAddition(player);
    if (validationError) {
      return { success: false, message: validationError };
    }

    player.roomId = this.id;
    player.index = this.players.length;
    this.players.push(player);
    this.broadcastRoomUpdate();
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
      this.reassignHost();
    }

    this.broadcastRoomUpdate();
    // Cleanup is handled by the Lobby
  }

  public startGame(initiatorId: string): OperationResult {
    const validationError = this.validateGameStart(initiatorId);
    if (validationError) {
      return { success: false, message: validationError };
    }

    try {
      this.gameSession = new GameSession({
        id: this.id,
        players: [...this.players],
        maxPlayers: this.maxPlayers,
        started: true,
        hostId: this.hostId,
        name: this.name,
      });
      this.gameSession.start();
      this.broadcastRoomUpdate();
      return { success: true };
    } catch (error) {
      logger.error(`Failed to start game for room ${this.id}`, error as Error);
      return { success: false, message: "Failed to start game" };
    }
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
    this.broadcastRoomUpdate();
  }

  public getState = (): RoomState => ({
    id: this.id,
    name: this.name,
    players: [...this.players],
    maxPlayers: this.maxPlayers,
    started: this.isStarted(),
    hostId: this.hostId,
  });

  public shouldClose = () =>
    this.players.length === 0 || (this.isStarted() && this.players.length < 2);

  public isStarted = () => !!this.gameSession;

  private validatePlayerAddition(player: Player): string | null {
    if (this.isStarted()) return "Game is already in progress";
    if (this.players.length >= this.maxPlayers) return "Room is full";
    if (player.roomId) return "Player is already in another room";
    return null;
  }

  private validateGameStart(initiatorId: string): string | null {
    if (initiatorId !== this.hostId) return "Only the host can start the game";
    if (this.isStarted()) return "Game is already in progress";
    if (this.players.length < 2) return "Need at least 2 players to start";
    return null;
  }

  private resetPlayerState(player: Player) {
    player.roomId = undefined;
    player.index = undefined;
  }

  private reassignHost(): void {
    this.hostId = this.players[0].id;
    logger.info(`New host assigned in room ${this.id}: ${this.hostId}`);
  }

  private broadcastRoomUpdate(): void {
    const roomState = this.getState();
    emitter.broadcastRoomState(this.id, roomState);
    // Notify the lobby of state changes through the onStateChange callback
    this.onStateChange?.();
  }

  // Callback to notify lobby of state changes
  public onStateChange?: () => void;
}
