import { User, Crown } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Seat } from "@/server/types";

interface PlayerSlotProps {
  seat: Seat;
  isHost: boolean;
  onSeatClick: (seatIndex: number) => void;
  isCurrentUser: boolean;
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
}: PlayerSlotProps) => {
  if (!seat?.user) {
    return (
      <div
        className={`absolute ${positionStyles[seat.index]} w-12 h-12 
                    flex items-center justify-center cursor-pointer
                    transition-all duration-300 hover:scale-110`}
        onClick={() => onSeatClick(seat.index)}
      >
        <div
          className="w-8 h-8 rounded-full bg-gray-800/80 border border-gray-700 
                      flex items-center justify-center hover:border-blue-500/50"
        >
          <User className="w-4 h-4 text-gray-600" />
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
                : "border-gray-700"
            }`}
          >
            <AvatarFallback className="text-xs">
              {seat.user.name[0]}
            </AvatarFallback>
          </Avatar>

          {/* Crown for host */}
          {isHost && (
            <Crown className="w-3 h-3 text-yellow-500 absolute -top-1 -right-1" />
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
                    transition-opacity duration-200 pointer-events-none"
        >
          <div
            className="bg-gray-800/95 px-2 py-0.5 rounded text-xs 
                       text-gray-200 whitespace-nowrap"
          >
            {seat.user.name}
            {isCurrentUser && " (You)"}
          </div>
        </div>
      </div>
    </div>
  );
};
