import type { UserState } from "./user";
import type { PublicSeatActor } from "./actor";

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

export interface PausedStatus<U = UserState> extends BaseGameStatus {
  type: GameStatusType.PAUSED;
  reason: "user_paused" | "player_disconnected" | "system";
  pausedBy: U | "system";
  disconnectedPlayers?: U[];
  autoResumeTime?: number;
}

export interface RoundEndedStatus extends BaseGameStatus {
  type: GameStatusType.ROUND_ENDED;
  roundNumber: number;
  winner: PublicSeatActor | null;
  winnerSeatIndex: number | null;
  roundEndTime: number;
  state:
    | {
        isGameOver: false;
        nextRoundStartTime: number;
      }
    | {
        isGameOver: true;
        scoreboard: { actor: PublicSeatActor; wins: number }[];
        terminationTime: number;
      };
}

export type GameStatus<U = UserState> =
  | WaitingStatus
  | ActiveStatus
  | PausedStatus<U>
  | RoundEndedStatus;
