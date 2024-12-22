import { RoomSettings, UserState } from "@/server/types";
import { Bomb, Flame, LayoutGrid, Plus, Users } from "lucide-react";
import { Badge } from "../ui/badge";

interface HeaderProps {
  onlineCount: number;
  roomsCount: number;
  user: UserState;
  onCreateRoom: (settings?: Partial<RoomSettings>) => void;
  onOpenPlayerList: () => void;
}

export const Header = ({
  onlineCount,
  roomsCount,
  user,
  onCreateRoom,
  onOpenPlayerList,
}: HeaderProps) => {
  return (
    <header className="relative bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 border-b border-cyan-900/30">
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-500 via-purple-500 to-cyan-500 animate-pulse" />

      <div className="container mx-auto flex justify-between items-center px-6 py-4">
        <div className="flex items-center space-x-6">
          <div className="relative">
            <div className="relative">
              <Bomb className="w-10 h-10 text-cyan-400 animate-pulse" />
              <Flame className="w-4 h-4 text-purple-400 absolute -top-1 -right-1" />
            </div>
          </div>

          <div>
            <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400">
              Bomberman Arena
            </h1>
            <div className="flex items-center gap-4 mt-2">
              <Badge className="bg-cyan-950/40 text-cyan-400 border border-cyan-800/50">
                <Users className="w-4 h-4 mr-1" />
                {onlineCount} Online
              </Badge>
              <Badge className="bg-purple-950/40 text-purple-400 border border-purple-800/50">
                <LayoutGrid className="w-4 h-4 mr-1" />
                {roomsCount} Rooms Active
              </Badge>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <button
            onClick={() => onCreateRoom()}
            className="px-4 py-2 rounded-lg bg-gradient-to-r from-cyan-600 to-purple-600 text-white 
                 hover:from-cyan-500 hover:to-purple-500 
                 transition-all duration-300 flex items-center
                 shadow-lg shadow-cyan-900/20 hover:shadow-cyan-900/40"
          >
            <Plus size={16} className="mr-1" />
            Create Room
          </button>
          <div className="px-3 py-1.5 rounded-lg bg-gray-800/50 border border-gray-700/50">
            <span className="text-gray-300">{user.name}</span>
          </div>
          <button
            onClick={onOpenPlayerList}
            className="p-2 hover:bg-cyan-900/20 rounded-lg transition-colors
                 text-cyan-400 hover:text-cyan-300"
          >
            <Users size={20} />
          </button>
        </div>
      </div>
    </header>
  );
};
