export interface LobbyState {
  rooms: Record<string, RoomState>;
  players: Record<string, Player>;
}

export interface Player {
  id: string;
  roomId?: string;
  index?: number; // Index of the player in the room
}

export interface RoomState {
  id: string;
  players: Player[];
  maxPlayers: number;
  started: boolean;
  hostId: string; // ID of the player who created the room
  name: string;
}

export interface PlayerControls {
  heldKeys: string[];
  pressedKeys: string[];
}

export interface OperationResult<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
}

export enum GameStatus {
  INITIALIZING,
  ACTIVE,
  PAUSED,
  ROUND_ENDED,
  GAME_ENDED,
}
