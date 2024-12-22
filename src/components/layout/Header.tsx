import { RoomSettings } from "@/server/types";
import { Bomb, Flame, LayoutGrid, Plus, Users, WifiOff } from "lucide-react";
import { Badge } from "../ui/badge";
import { useSocket } from "@/hooks/useSocket";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface HeaderProps {
  onlineCount: number;
  roomsCount: number;
  onCreateRoom: (settings?: Partial<RoomSettings>) => void;
  onOpenPlayerList: () => void;
}

export const Header = ({
  onlineCount,
  roomsCount,
  onCreateRoom,
  onOpenPlayerList,
}: HeaderProps) => {
  const { connected, me: user } = useSocket();

  return (
    <header className="relative bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 border-b border-cyan-900/30">
      <div
        className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r transition-colors duration-1000 
        ${
          connected
            ? "from-cyan-500 via-purple-500 to-cyan-500"
            : "from-red-500 via-orange-500 to-red-500"
        } 
        ${connected ? "animate-pulse" : "animate-none"}`}
      />

      <div className="container mx-auto flex justify-between items-center px-6 py-4">
        <div className="flex items-center space-x-6">
          <div className="relative">
            <div className="relative">
              <Bomb
                className={`w-10 h-10 ${
                  connected ? "text-cyan-400" : "text-gray-400"
                } 
                ${connected ? "animate-pulse" : "animate-none"}`}
              />
              <Flame className="w-4 h-4 text-purple-400 absolute -top-1 -right-1" />
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h1
                className={`text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r
                ${
                  connected
                    ? "from-cyan-400 to-purple-400"
                    : "from-gray-500 to-gray-400"
                }`}
              >
                Bomberman Arena
              </h1>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    {!connected && (
                      <WifiOff className="w-5 h-5 text-red-400 animate-pulse" />
                    )}
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{!connected && "Disconnected from server"}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <div className="flex items-center gap-4 mt-2">
              <Badge
                className={`${
                  connected
                    ? "bg-cyan-950/40 text-cyan-400 border-cyan-800/50"
                    : "bg-gray-950/40 text-gray-400 border-gray-800/50"
                } border`}
              >
                <Users className="w-4 h-4 mr-1" />
                {onlineCount} Online
              </Badge>
              <Badge
                className={`${
                  connected
                    ? "bg-purple-950/40 text-purple-400 border-purple-800/50"
                    : "bg-gray-950/40 text-gray-400 border-gray-800/50"
                } border`}
              >
                <LayoutGrid className="w-4 h-4 mr-1" />
                {roomsCount} Rooms Active
              </Badge>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <button
            onClick={() => onCreateRoom()}
            disabled={!connected}
            className={`px-4 py-2 rounded-lg bg-gradient-to-r text-white 
              transition-all duration-300 flex items-center shadow-lg
              ${
                connected
                  ? "from-cyan-600 to-purple-600 hover:from-cyan-500 hover:to-purple-500 shadow-cyan-900/20 hover:shadow-cyan-900/40"
                  : "from-gray-600 to-gray-700 cursor-not-allowed shadow-gray-900/20"
              }`}
          >
            <Plus size={16} className="mr-1" />
            Create Room
          </button>
          <div className="px-3 py-1.5 rounded-lg bg-gray-800/50 border border-gray-700/50">
            <span className="text-gray-300">{user.name}</span>
          </div>
          <button
            onClick={onOpenPlayerList}
            disabled={!connected}
            className={`p-2 rounded-lg transition-colors
              ${
                connected
                  ? "text-cyan-400 hover:text-cyan-300 hover:bg-cyan-900/20"
                  : "text-gray-500 cursor-not-allowed"
              }`}
          >
            <Users size={20} />
          </button>
        </div>
      </div>
    </header>
  );
};
