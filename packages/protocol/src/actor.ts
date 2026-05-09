import type { UserState } from "./user";

export const BOT_DIFFICULTIES = ["easy", "normal", "hard", "hell"] as const;
export type BotDifficulty = (typeof BOT_DIFFICULTIES)[number];

export interface BotSpec {
  id: string;
  name: string;
  difficulty: BotDifficulty;
  seed: number;
  createdByUserId: string;
}

export interface HumanSeatActor<U = UserState> {
  kind: "human";
  user: U;
}

export interface BotSeatActor {
  kind: "bot";
  bot: BotSpec;
}

export type SeatActor<U = UserState> = HumanSeatActor<U> | BotSeatActor;

export type PublicSeatActor =
  | {
      kind: "human";
      id: string;
      name: string;
      avatarColor: string;
      online: boolean;
      isHost: boolean;
    }
  | {
      kind: "bot";
      id: string;
      name: string;
      difficulty: BotDifficulty;
    };

export type StoredSeatActor =
  | {
      kind: "human";
      userId: string;
    }
  | {
      kind: "bot";
      botId: string;
      name: string;
      difficulty: BotDifficulty;
      seed: number;
    };

export interface StoredMatchSeat {
  index: number;
  actor: StoredSeatActor | null;
}

export interface StoredRoundResult {
  winnerSeatIndex: number | null;
  winnerActor: StoredSeatActor | null;
}
