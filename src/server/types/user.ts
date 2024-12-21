export interface Position {
  roomId: string;
  seatIndex: number;
}

export interface UserState {
  id: string;
  socketId: string;
  name: string;
  position?: Position;
  joinedAt: number;
  lastActivityAt: number;
}

export interface UserControls {
  heldKeys: string[];
  pressedKeys: string[];
}
