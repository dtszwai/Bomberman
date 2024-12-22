import { RoomState } from "@/server/types";
import { RoomCard } from "./RoomCard";

interface RoomGridProps {
  rooms: RoomState[];
  onRoomClick: (roomId: string) => void;
}

export const RoomGrid = ({ rooms, onRoomClick }: RoomGridProps) => {
  return (
    <div className="grid grid-cols-3 gap-4">
      {rooms.map((room) => (
        <RoomCard key={room.id} room={room} onRoomClick={onRoomClick} />
      ))}
    </div>
  );
};
