import { Bot, Crown, User, X } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { BotDifficulty, Seat } from "@/types";
import {
  getSeatActorId,
  getSeatActorName,
  getSeatAvatarColor,
  getSeatInitial,
  getDifficultyLabel,
  isBotSeat,
  nextBotDifficulty,
} from "@/lib/roomActors";
import { BotNameInput } from "./BotNameInput";

interface PlayerSlotProps {
  seat: Seat;
  isHost: boolean;
  onSeatClick: (seatIndex: number) => void;
  isCurrentUser: boolean;
  canManageBots?: boolean;
  onAddBot?: (seatIndex: number) => void;
  onRemoveBot?: (seatIndex: number) => void;
  onUpdateBotDifficulty?: (
    seatIndex: number,
    difficulty: BotDifficulty
  ) => void;
  onUpdateBotName?: (seatIndex: number, name: string) => void;
}

const positionStyles: Record<number, string> = {
  0: "top-0 left-1/2 -translate-x-1/2",
  1: "right-3 top-1/2 -translate-y-1/2",
  2: "bottom-0 left-1/2 -translate-x-1/2",
  3: "left-3 top-1/2 -translate-y-1/2",
};

export const PlayerSlot = ({
  seat,
  isHost,
  onSeatClick,
  isCurrentUser,
  canManageBots = false,
  onAddBot,
  onRemoveBot,
  onUpdateBotDifficulty,
  onUpdateBotName,
}: PlayerSlotProps) => {
  const actorName = getSeatActorName(seat);
  const isBot = isBotSeat(seat);
  const avatarColor = getSeatAvatarColor(seat);

  if (!seat?.actor) {
    return (
      <div
        className={`absolute ${positionStyles[seat.index]} w-12 h-12
                    flex items-center justify-center cursor-pointer
                    transition-all duration-300 hover:scale-110`}
        onClick={(event) => {
          event.stopPropagation();
          if (canManageBots && onAddBot) {
            onAddBot(seat.index);
          } else {
            onSeatClick(seat.index);
          }
        }}
      >
        <div
          className="w-8 h-8 rounded-full bg-gray-800/80 border border-gray-700
                      flex items-center justify-center hover:border-blue-500/50"
        >
          {canManageBots ? (
            <Bot className="w-4 h-4 text-gray-500" />
          ) : (
            <User className="w-4 h-4 text-gray-600" />
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      className={`absolute ${positionStyles[seat.index]} min-w-[48px]
                  flex items-center justify-center`}
    >
      <div className="relative group">
        {/* Avatar Container with Glow Effect when Ready or Current User */}
        <div
          className={`relative p-1 rounded-full
          ${
            seat.ready
              ? "animate-pulse bg-gradient-to-r from-green-500/0 via-green-500/20 to-green-500/0"
              : ""
          }
          ${
            isCurrentUser
              ? "bg-blue-500/20 ring-2 ring-blue-500/50 ring-offset-1 ring-offset-gray-900"
              : ""
          }`}
        >
          <Avatar
            className={`w-8 h-8 border transition-all duration-300 group-hover:scale-110
            ${
              seat.ready
                ? "border-green-400/50 shadow-lg shadow-green-500/20"
                : isCurrentUser
                ? "border-blue-400/50 shadow-lg shadow-blue-500/20"
                : isBot
                ? "border-amber-400/50"
                : "border-gray-700"
            }`}
          >
            <AvatarFallback
              className="text-xs text-white"
              style={avatarColor ? { backgroundColor: avatarColor } : undefined}
            >
              {isBot ? <Bot className="w-4 h-4" /> : getSeatInitial(seat)}
            </AvatarFallback>
          </Avatar>

          {/* Crown for host */}
          {isHost && (
            <Crown className="w-3 h-3 text-yellow-500 absolute -top-1 -right-1" />
          )}

          {isBot && canManageBots && (
            <button
              className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-gray-900 border border-gray-600 flex items-center justify-center text-gray-300 hover:text-white hover:border-red-500"
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                onRemoveBot?.(seat.index);
              }}
              aria-label={`Remove ${actorName}`}
            >
              <X className="w-2.5 h-2.5" />
            </button>
          )}

          {isBot && canManageBots && (
            <button
              className="absolute -bottom-1 -left-1 min-w-4 h-4 rounded-full bg-amber-500 text-[10px] leading-none text-gray-950 font-bold border border-gray-900"
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                if (seat.actor?.kind !== "bot") return;
                onUpdateBotDifficulty?.(
                  seat.index,
                  nextBotDifficulty(seat.actor.bot.difficulty)
                );
              }}
              aria-label={`Change ${actorName} difficulty`}
            >
              {seat.actor?.kind === "bot"
                ? getDifficultyLabel(seat.actor.bot.difficulty)
                : ""}
            </button>
          )}

          {/* Ready Checkmark Animation */}
          {seat.ready && (
            <div
              className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500
                           rounded-full flex items-center justify-center
                           border-2 border-gray-800"
            >
              <svg
                className="w-2 h-2 text-white"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
          )}
        </div>

        {/* Hover tooltip for name */}
        <div
          className="absolute -top-6 left-1/2 -translate-x-1/2
                    opacity-0 group-hover:opacity-100
                    transition-opacity duration-200"
        >
          <div
            className="bg-gray-800/95 px-2 py-0.5 rounded text-xs
                       text-gray-200 whitespace-nowrap"
            onClick={(event) => event.stopPropagation()}
          >
            {isBot && canManageBots && onUpdateBotName ? (
              <BotNameInput
                name={actorName}
                onRename={(name) => onUpdateBotName(seat.index, name)}
                className="h-6 w-24 bg-gray-950"
              />
            ) : (
              actorName
            )}
            {isCurrentUser && getSeatActorId(seat) && " (You)"}
            {isBot && !(canManageBots && onUpdateBotName) && " CPU"}
          </div>
        </div>
      </div>
    </div>
  );
};
