import { Users, LayoutGrid } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface StatusBadgeProps {
  isMobile?: boolean;
  onlineCount: number;
  roomsCount: number;
  onOpenPlayerList: () => void;
}

export const StatusBadge = ({
  isMobile = false,
  onlineCount,
  roomsCount,
  onOpenPlayerList,
}: StatusBadgeProps) => {
  return (
    <div
      className={`${
        isMobile ? "grid grid-cols-2 gap-2" : "flex items-center gap-3"
      }`}
    >
      <div
        onClick={onOpenPlayerList}
        className={`${
          isMobile
            ? "bg-gray-800/50 rounded-lg p-3 border border-gray-700/50"
            : ""
        }`}
      >
        {isMobile ? (
          <>
            <div className="text-2xl font-bold text-cyan-400">
              {onlineCount}
            </div>
            <div className="text-sm text-gray-400">Players Online</div>
          </>
        ) : (
          <Badge
            variant="secondary"
            className="bg-cyan-950/40 text-cyan-400 border-cyan-800/50 border hover:bg-cyan-900/30 cursor-pointer"
            onClick={onOpenPlayerList}
          >
            <Users className="w-4 h-4 mr-1" />
            {onlineCount} Online
          </Badge>
        )}
      </div>
      <div
        className={`${
          isMobile
            ? "bg-gray-800/50 rounded-lg p-3 border border-gray-700/50"
            : ""
        }`}
      >
        {isMobile ? (
          <>
            <div className="text-2xl font-bold text-purple-400">
              {roomsCount}
            </div>
            <div className="text-sm text-gray-400">Active Rooms</div>
          </>
        ) : (
          <Badge
            variant="secondary"
            className="bg-purple-950/40 text-purple-400 border-purple-800/50 border hover:bg-purple-900/30"
          >
            <LayoutGrid className="w-4 h-4 mr-1" />
            {roomsCount} Rooms
          </Badge>
        )}
      </div>
    </div>
  );
};
