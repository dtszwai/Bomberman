import { RoomState } from "@/server/types";
import { RoomCard } from "./RoomCard";

interface RoomGridProps {
  rooms: RoomState[];
  onRoomClick: (roomId: string) => void;
}

export const RoomGrid = ({ rooms, onRoomClick }: RoomGridProps) => {
  return (
    <div className="w-full max-w-[1920px] mx-auto">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-4 p-4">
        {rooms.map((room) => (
          <RoomCard key={room.id} room={room} onRoomClick={onRoomClick} />
        ))}
      </div>
    </div>
  );
};
