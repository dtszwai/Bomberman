import { UserState } from "@/server/types";
import { User, Users, X } from "lucide-react";
import { Button } from "../ui/button";

interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  players: UserState[];
  onPlayerSelect: (player: UserState) => void;
}

export const PlayerDrawer = ({
  isOpen,
  onClose,
  players,
  onPlayerSelect,
}: DrawerProps) => {
  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/20 backdrop-blur-sm transition-opacity z-40 ${
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }
            `}
        onClick={onClose}
      />

      {/* Drawer */}
      <div
        className={`
            fixed top-0 right-0 h-full w-80 bg-white/10 backdrop-blur-xl
            border-l border-white/20 shadow-2xl transform transition-transform duration-300
            ${isOpen ? "translate-x-0" : "translate-x-full"}
            z-50
          `}
      >
        <div className="p-4 border-b border-white/20 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <Users size={20} className="text-teal-300" />
            <h2 className="text-lg font-semibold text-white">Active Users</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-white/10 rounded-full transition-colors"
          >
            <X size={20} className="text-gray-300" />
          </button>
        </div>

        <div className="overflow-y-auto h-full pb-20">
          {players.map((player) => (
            <div
              key={player.id}
              className="p-4 border-b border-white/10 hover:bg-white/5 transition-colors group"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="relative">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-teal-400 to-indigo-500 flex items-center justify-center">
                      <User size={20} className="text-white" />
                    </div>
                    <div
                      className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-black/50 ${
                        player.lastActivityAt > Date.now() - 1000 * 60 * 5
                          ? "bg-teal-400"
                          : "bg-amber-400"
                      }`}
                    />
                  </div>
                  <div>
                    <div className="font-medium text-white">{player.name}</div>
                    <div className="text-sm text-gray-400">
                      {player.position?.roomId ? `In Room` : "In Lobby"}
                    </div>
                  </div>
                </div>
                {/* {player.inGame && (
                  <span className="px-2 py-1 rounded-full text-xs bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                    In Game
                  </span>
                )} */}
              </div>
              <div className="mt-2 hidden group-hover:flex justify-end space-x-2">
                <Button
                  className="px-3 py-1 rounded-full text-xs bg-teal-500/20 text-teal-300 border border-teal-500/30 hover:bg-teal-500/30 transition-colors"
                  onClick={() => {
                    onPlayerSelect(player);
                    onClose();
                  }}
                >
                  Message
                </Button>
                {/* <button className="px-3 py-1 rounded-full text-xs bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 hover:bg-indigo-500/30 transition-colors">
                  Invite
                </button> */}
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
};
