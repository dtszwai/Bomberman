import { Menu, Users, X } from "lucide-react";
import { useSocket } from "@/hooks/useSocket";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
  SheetClose,
} from "@/components/ui/sheet";
import { UserInfo } from "./UserInfo";
import { StatusBadge } from "./StatusBadge";
import { CreateRoomButton } from "./CreateRoomButton";
import { AnimatedLogo } from "./Logo";
import { HeaderProps } from "./Header";

export const MobileMenu = ({
  onlineCount,
  roomsCount,
  onCreateRoom,
  onOpenPlayerList,
}: HeaderProps) => {
  const { connected, connecting } = useSocket();

  return (
    <Sheet>
      <SheetTrigger
        className="md:hidden p-2 rounded-lg hover:bg-gray-800/50 
        transition-colors duration-200"
      >
        <Menu className="w-6 h-6 text-gray-400" />
      </SheetTrigger>
      <SheetContent
        side="right"
        className="w-80 bg-gradient-to-b from-gray-900 to-gray-950 border-gray-800 [&>button]:hidden"
      >
        <SheetTitle>
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-3">
              <AnimatedLogo />
              <h2 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400">
                Arena
              </h2>
            </div>
            <SheetClose className="p-2 rounded-lg hover:bg-gray-800 transition-colors duration-200">
              <X className="w-5 h-5 text-gray-400" />
            </SheetClose>
          </div>
        </SheetTitle>
        <div className="pb-4">
          <UserInfo isMobile={true} />
        </div>
        <div className="space-y-6">
          <div>
            <h3 className="text-sm font-medium text-gray-400 mb-2">
              Game Status
            </h3>
            <StatusBadge
              isMobile={true}
              onlineCount={onlineCount}
              roomsCount={roomsCount}
              onOpenPlayerList={onOpenPlayerList}
            />
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-400 mb-2">
              Quick Actions
            </h3>
            <div className="space-y-3">
              <CreateRoomButton isMobile={true} onCreateRoom={onCreateRoom} />
              <button
                onClick={onOpenPlayerList}
                disabled={!connected || connecting}
                className="w-full p-3 rounded-lg bg-gray-800/50 border border-gray-700/50 
                  text-gray-300 hover:bg-gray-800 transition-colors duration-200 flex items-center"
              >
                <Users size={18} className="mr-2 text-cyan-400" />
                View All Players
              </button>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};
