import { UserState } from "@/server/types";
import { User, Users, X } from "lucide-react";
import { Button } from "../ui/button";
import { useSocket } from "@/hooks/useSocket";

interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  players: UserState[];
  onSelectUser: (userId: string) => void;
}

export const PlayerDrawer = ({
  isOpen,
  onClose,
  players,
  onSelectUser: onPlayerSelect,
}: DrawerProps) => {
  const { me } = useSocket();

  // Sort players to show current user first, then sort others by name
  const sortedPlayers = [...players].sort((a, b) => {
    if (a.id === me?.id) return -1;
    if (b.id === me?.id) return 1;
    return a.name.localeCompare(b.name);
  });

  const renderUserCard = (user: UserState) => {
    const isCurrentUser = user.id === me?.id;
    const isActive = user.lastActivityAt > Date.now() - 1000 * 60 * 5;

    return (
      <div
        key={user.id}
        className={`p-4 border-b border-white/10 hover:bg-white/5 transition-colors group ${
          isCurrentUser ? "bg-white/5" : ""
        }`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="relative">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  isCurrentUser
                    ? "bg-gradient-to-br from-indigo-400 to-purple-500"
                    : "bg-gradient-to-br from-teal-400 to-indigo-500"
                }`}
              >
                <User size={20} className="text-white" />
              </div>
              <div
                className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-black/50 ${
                  isActive ? "bg-teal-400" : "bg-amber-400"
                }`}
              />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-medium text-white">{user.name}</span>
                {isCurrentUser && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                    You
                  </span>
                )}
              </div>
              <div className="text-sm text-gray-400">
                {user.position?.roomId ? "In Room" : "In Lobby"}
              </div>
            </div>
          </div>
        </div>
        {!isCurrentUser && (
          <div className="mt-2 hidden group-hover:flex justify-end space-x-2">
            <Button
              className="px-3 py-1 rounded-full text-xs bg-teal-500/20 text-teal-300 border border-teal-500/30 hover:bg-teal-500/30 transition-colors"
              onClick={() => {
                onPlayerSelect(user.id);
                onClose();
              }}
            >
              Message
            </Button>
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/20 backdrop-blur-sm transition-opacity z-40 ${
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
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
            <h2 className="text-lg font-semibold text-white">
              Active Users ({players.length})
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-white/10 rounded-full transition-colors"
          >
            <X size={20} className="text-gray-300" />
          </button>
        </div>

        <div className="overflow-y-auto h-full pb-20">
          {sortedPlayers.map(renderUserCard)}
        </div>
      </div>
    </>
  );
};
