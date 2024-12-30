import { UserState } from "./user";

export enum GameStatusType {
  WAITING = "WAITING",
  ACTIVE = "ACTIVE",
  PAUSED = "PAUSED",
  ROUND_ENDED = "ROUND_ENDED",
}

interface BaseGameStatus {
  type: GameStatusType;
  timestamp: number;
}

export interface WaitingStatus extends BaseGameStatus {
  type: GameStatusType.WAITING;
}

export interface ActiveStatus extends BaseGameStatus {
  type: GameStatusType.ACTIVE;
  roundNumber: number;
  roundStartTime: number;
}

export interface PausedStatus extends BaseGameStatus {
  type: GameStatusType.PAUSED;
  reason: "user_paused" | "player_disconnected" | "system";
  pausedBy: UserState | "system";
  disconnectedPlayers?: UserState[];
  autoResumeTime?: number;
}

export interface RoundEndedStatus extends BaseGameStatus {
  type: GameStatusType.ROUND_ENDED;
  roundNumber: number;
  winner: UserState;
  roundEndTime: number;

  state:
    | {
        isGameOver: false;
        nextRoundStartTime: number;
      }
    | {
        isGameOver: true;
        scoreboard: { user: UserState; wins: number }[];
        terminationTime: number;
      };
}

export type GameStatus =
  | WaitingStatus
  | ActiveStatus
  | PausedStatus
  | RoundEndedStatus;
