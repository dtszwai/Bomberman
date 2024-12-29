import { GameState } from "@/game/types";
import { User } from "../models";
import { GameStatus } from "./game";

export type Seat = Readonly<{
  index: number;
}> &
  (
    | {
        user: User;
        ready: boolean;
      }
    | {
        user: null;
        ready: false;
      }
  );

export interface RoomSettings {
  maxUsers: number;
  isPrivate: boolean;
  roomCode: string | null;
  allowSpectators: boolean;
}

export enum RoomType {
  GAME,
}

export interface BaseRoomState {
  id: string;
  type: RoomType;
  name: string;
  seats: Seat[];
  hostId: string;
  settings: RoomSettings;
  createdAt: number;
  updatedAt: number;
}

export interface GameRoomState extends BaseRoomState {
  type: RoomType.GAME;
  status: GameStatus;
  gameState: GameState;
  startTime?: number;
}

export type RoomState = GameRoomState;
