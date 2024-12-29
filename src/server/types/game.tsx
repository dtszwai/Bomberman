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

interface WaitingStatus extends BaseGameStatus {
  type: GameStatusType.WAITING;
}

interface ActiveStatus extends BaseGameStatus {
  type: GameStatusType.ACTIVE;
  roundNumber: number;
  roundStartTime: number;
}

interface PausedStatus extends BaseGameStatus {
  type: GameStatusType.PAUSED;
  reason: "host_paused" | "player_disconnected" | "system";
  pausedBy: string | "system";
  disconnectedPlayers?: string[];
  autoResumeTime?: number;
}

interface RoundEndedStatus extends BaseGameStatus {
  type: GameStatusType.ROUND_ENDED;
  roundNumber: number;
  winner: {
    seatIndex: number;
    userId: string;
  };
  roundEndTime: number;

  state:
    | {
        isGameOver: false;
        nextRoundStartTime: number;
      }
    | {
        isGameOver: true;
        finalScores: number[];
      };
}

export type GameStatus =
  | WaitingStatus
  | ActiveStatus
  | PausedStatus
  | RoundEndedStatus;
