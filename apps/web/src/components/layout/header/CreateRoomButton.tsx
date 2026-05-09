import { Plus } from "lucide-react";
import { useSocket } from "@/hooks/useSocket";
import { RoomSettings } from "@/types";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { RoomSettingsForm } from "@/components/Room/RoomSettingsForm";
import { useState } from "react";

interface CreateRoomButtonProps {
  isMobile?: boolean;
  onCreateRoom: (settings?: Partial<RoomSettings>) => void;
}

export const CreateRoomButton = ({
  isMobile = false,
  onCreateRoom,
}: CreateRoomButtonProps) => {
  const { connected, connecting } = useSocket();
  const [open, setOpen] = useState(false);

  const disabled = !connected || connecting;

  const handleSubmit = (settings: Partial<RoomSettings>) => {
    onCreateRoom(settings);
    setOpen(false);
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        disabled={disabled}
        className={`group px-4 ${
          isMobile ? "py-3 w-full" : "py-2"
        } rounded-lg bg-gradient-to-r text-white
          transition-all duration-300 flex items-center justify-center shadow-lg relative overflow-hidden
          ${
            !disabled
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

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="bg-gray-950 border-gray-800 text-gray-100 sm:max-w-md">
          <RoomSettingsForm
            description="Choose match rules before creating the room."
            submitLabel="Create Room"
            title="Room Settings"
            onSubmit={handleSubmit}
          />
        </DialogContent>
      </Dialog>
    </>
  );
};
