import { useState, useEffect } from "react";
import { useSocket } from "@/hooks/useSocket";
import {
  AnimatedLogo,
  UserInfo,
  StatusBadge,
  CreateRoomButton,
  MobileMenu,
} from ".";
import { RoomSettings } from "@/server/types";
import { Users } from "lucide-react";

export interface HeaderProps {
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
  const { connected, connecting } = useSocket();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <>
      <div className="h-24" />
      <header
        className={`fixed top-0 left-0 right-0 z-40 h-24 transition-all duration-300
          ${
            scrolled
              ? "bg-gray-900/95 backdrop-blur-sm shadow-xl"
              : "bg-gray-900"
          }
          border-b border-cyan-900/30`}
      >
        <div
          className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r transition-colors duration-1000 
            ${
              connecting
                ? "from-yellow-500 via-orange-500 to-yellow-500"
                : connected
                ? "from-cyan-500 via-purple-500 to-cyan-500"
                : "from-red-500 via-orange-500 to-red-500"
            } 
            ${connected ? "animate-pulse" : "animate-none"}`}
        />

        <div className="container mx-auto flex justify-between items-center h-full px-4 md:px-6">
          <div className="flex items-center space-x-4 md:space-x-6">
            <AnimatedLogo />

            <div>
              <div className="flex items-center gap-2">
                <h1
                  className={`text-xl md:text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r
                    ${
                      connecting
                        ? "from-yellow-400 to-orange-400"
                        : connected
                        ? "from-cyan-400 to-purple-400"
                        : "from-gray-500 to-gray-400"
                    }`}
                >
                  Bomberman Arena
                </h1>
              </div>

              <div className="hidden md:flex items-center gap-3 mt-2">
                <StatusBadge
                  onlineCount={onlineCount}
                  roomsCount={roomsCount}
                  onOpenPlayerList={onOpenPlayerList}
                />
              </div>
            </div>
          </div>

          <div className="hidden md:flex items-center space-x-4">
            <CreateRoomButton onCreateRoom={onCreateRoom} />
            <UserInfo />
            <button
              onClick={onOpenPlayerList}
              disabled={!connected || connecting}
              className={`p-2 rounded-lg transition-all duration-200
                  ${
                    connected && !connecting
                      ? "text-cyan-400 hover:text-cyan-300 hover:bg-cyan-900/20 hover:scale-110"
                      : "text-gray-500 cursor-not-allowed"
                  }`}
            >
              <Users size={20} />
            </button>
          </div>

          <div className="md:hidden">
            <MobileMenu
              onlineCount={onlineCount}
              roomsCount={roomsCount}
              onCreateRoom={onCreateRoom}
              onOpenPlayerList={onOpenPlayerList}
            />
          </div>
        </div>
      </header>
    </>
  );
};

export default Header;
