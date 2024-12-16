export interface Lobby {
  rooms: Record<string, IRoom>;
  players: Record<string, Player>;
}

export interface Player {
  id: string;
  roomId?: string;
  index?: number; // Index of the player in the room
}

export interface IRoom {
  id: string;
  players: Player[];
  maxPlayers: number;
  started: boolean;
  hostId: string; // ID of the player who created the room
  name: string;
}

type PlayerMovementAction = {
  type: "move";
  direction: "up" | "down" | "left" | "right";
};

type PlaceBombAction = { type: "placeBomb" };

export type PlayerInput = PlayerMovementAction | PlaceBombAction;

export interface JoinRoomRequest {
  roomId: string;
}

export interface OperationResult<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
}

export interface CreateRoomDto {
  maxPlayers?: number;
  name?: string;
}
