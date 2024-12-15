export interface Lobby {
  rooms: Record<string, Room>;
  players: Record<string, Player>;
}

export interface Player {
  id: string;
  roomId?: string;
  index?: number; // Index of the player in the room
}

export interface Room {
  id: string;
  players: Player[];
  maxPlayers: number;
  started: boolean;
  intervalId?: NodeJS.Timeout;
}

export interface JoinRoomRequest {
  roomId: string;
}

export interface CreateRoomDto {
  maxPlayers: number;
}
