import type { Seat } from "@/types";
import type { BotDifficulty } from "@/types";

export const isHumanSeat = (seat: Seat) => seat.actor?.kind === "human";
export const isBotSeat = (seat: Seat) => seat.actor?.kind === "bot";
export const isOccupiedSeat = (seat: Seat) => seat.actor !== null;

export const getSeatActorId = (seat: Seat) => {
  if (seat.actor?.kind === "human") return seat.actor.user.id;
  if (seat.actor?.kind === "bot") return seat.actor.bot.id;
  return undefined;
};

export const getSeatActorName = (seat: Seat) => {
  if (seat.actor?.kind === "human") return seat.actor.user.name;
  if (seat.actor?.kind === "bot") return seat.actor.bot.name;
  return "";
};

export const getSeatAvatarColor = (seat: Seat) => {
  if (seat.actor?.kind === "human") return seat.actor.user.avatarColor;
  return undefined;
};

export const getSeatInitial = (seat: Seat) =>
  getSeatActorName(seat).slice(0, 1).toUpperCase();

export const nextBotDifficulty = (
  difficulty: BotDifficulty
): BotDifficulty => {
  if (difficulty === "easy") return "normal";
  if (difficulty === "normal") return "hard";
  return "easy";
};

export const getDifficultyLabel = (difficulty: BotDifficulty) => {
  if (difficulty === "easy") return "E";
  if (difficulty === "normal") return "N";
  return "H";
};
