import type {
  BotDifficulty,
  BotSpec,
  PublicSeatActor,
  Seat,
  SeatActor,
  StoredMatchSeat,
} from "@arcade/protocol";
import type { User } from "./user/User";

export type LobbySeat = Seat<User>;
export type LobbySeatActor = SeatActor<User>;

const BOT_NAME_PREFIX = "CPU";
const VALID_BOT_DIFFICULTIES = new Set<BotDifficulty>([
  "easy",
  "normal",
  "hard",
]);

export const isOccupiedSeat = (seat: LobbySeat): boolean =>
  seat.actor !== null;

export const isHumanSeat = (
  seat: LobbySeat
): seat is LobbySeat & { actor: { kind: "human"; user: User } } =>
  seat.actor?.kind === "human";

export const isBotSeat = (
  seat: LobbySeat
): seat is LobbySeat & { actor: { kind: "bot"; bot: BotSpec } } =>
  seat.actor?.kind === "bot";

export const createHumanActor = (user: User): LobbySeatActor => ({
  kind: "human",
  user,
});

export const createBotId = (roomId: string, seatIndex: number): string =>
  `bot:${roomId}:${seatIndex}:${crypto.randomUUID()}`;

export const createBotName = (seatIndex: number): string =>
  `${BOT_NAME_PREFIX} ${seatIndex + 1}`;

export const normalizeBotDifficulty = (
  difficulty?: BotDifficulty
): BotDifficulty => {
  if (!difficulty) return "normal";
  if (!VALID_BOT_DIFFICULTIES.has(difficulty)) {
    throw new Error("Invalid bot difficulty");
  }
  return difficulty;
};

export const normalizeBotName = (name: string | undefined, seatIndex: number) => {
  const normalized = name?.trim() || createBotName(seatIndex);
  if (normalized.length < 1 || normalized.length > 20) {
    throw new Error("Bot name must be between 1 and 20 characters");
  }
  return normalized;
};

export const createPublicSeatActor = (
  actor: LobbySeatActor,
  hostId: string
): PublicSeatActor => {
  if (actor.kind === "bot") {
    return {
      kind: "bot",
      id: actor.bot.id,
      name: actor.bot.name,
      difficulty: actor.bot.difficulty,
    };
  }

  const userState = actor.user.getState();
  return {
    kind: "human",
    id: userState.id,
    name: userState.name,
    avatarColor: userState.avatarColor,
    online: userState.online ?? true,
    isHost: userState.id === hostId,
  };
};

export const actorPublicId = (actor: LobbySeatActor): string =>
  actor.kind === "bot" ? actor.bot.id : actor.user.id;

export const actorName = (actor: LobbySeatActor): string =>
  actor.kind === "bot" ? actor.bot.name : actor.user.name;

export const toStoredMatchSeat = (seat: LobbySeat): StoredMatchSeat => ({
  index: seat.index,
  actor:
    seat.actor?.kind === "human"
      ? { kind: "human", userId: seat.actor.user.id }
      : seat.actor?.kind === "bot"
      ? {
          kind: "bot",
          botId: seat.actor.bot.id,
          name: seat.actor.bot.name,
          difficulty: seat.actor.bot.difficulty,
          seed: seat.actor.bot.seed,
        }
      : null,
});
