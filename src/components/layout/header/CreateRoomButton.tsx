import { Plus } from "lucide-react";
import { useSocket } from "@/hooks/useSocket";
import { RoomSettings } from "@/server/types";

interface CreateRoomButtonProps {
  isMobile?: boolean;
  onCreateRoom: (settings?: Partial<RoomSettings>) => void;
}

export const CreateRoomButton = ({
  isMobile = false,
  onCreateRoom,
}: CreateRoomButtonProps) => {
  const { connected, connecting } = useSocket();

  return (
    <button
      onClick={() => onCreateRoom()}
      disabled={!connected || connecting}
      className={`group px-4 ${
        isMobile ? "py-3 w-full" : "py-2"
      } rounded-lg bg-gradient-to-r text-white 
        transition-all duration-300 flex items-center justify-center shadow-lg relative overflow-hidden
        ${
          connected && !connecting
            ? "from-cyan-600 to-purple-600 hover:from-cyan-500 hover:to-purple-500 shadow-cyan-900/20"
            : "from-gray-600 to-gray-700 cursor-not-allowed opacity-50"
        }`}
    >
      <Plus
        size={isMobile ? 18 : 16}
        className={`${
          isMobile ? "mr-2" : "mr-1"
        } transition-transform duration-300 group-hover:rotate-180`}
      />
      Create Room
      <div
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent
        translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000"
      />
    </button>
  );
};
