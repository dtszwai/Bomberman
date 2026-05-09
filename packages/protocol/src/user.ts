export interface Position {
  roomId: string;
  seatIndex: number;
}

export interface UserProfile {
  name: string;
  avatarColor: string;
}

export type UserProfileUpdate = Partial<UserProfile>;

export interface UserState {
  id: string;
  socketId: string;
  name: string;
  avatarColor: string;
  position?: Position;
  joinedAt: number;
  lastActivityAt: number;
  online?: boolean;
}

export interface UserControls {
  seq: number;
  heldKeys: string[];
  pressedKeys: string[];
}
