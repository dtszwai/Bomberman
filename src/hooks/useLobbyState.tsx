import { useState } from "react";
import { RoomSettings, RoomState, UserState } from "@/server/types";
import { useLobby } from "@/hooks/useLobby";
import { useRoom } from "./useRoom";

export const useLobbyState = () => {
  const {
    lobbyState: { rooms, users },
  } = useLobby();
  const { createRoom } = useRoom();

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState<RoomState>();
  const [selectedUser, setSelectedUser] = useState<UserState>();

  const handleCreateRoom = (settings?: Partial<RoomSettings>) => {
    createRoom(settings);
  };

  const handleRoomClick = (roomId: string) => {
    const room = rooms[roomId];
    if (!room) return;
    setSelectedRoom((prevRoom) =>
      prevRoom?.id === room.id ? undefined : room
    );
  };

  const handleDrawerOpen = () => setIsDrawerOpen(true);
  const handleDrawerClose = () => setIsDrawerOpen(false);
  const handleUserSelect = (userId?: string) =>
    setSelectedUser(userId ? users[userId] : undefined);
  const handleRoomClose = () => setSelectedRoom(undefined);

  return {
    isDrawerOpen,
    selectedRoom,
    selectedUser,
    handleCreateRoom,
    handleRoomClick,
    handleDrawerOpen,
    handleDrawerClose,
    handleUserSelect,
    handleRoomClose,
  };
};
