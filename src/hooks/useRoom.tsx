import { useState, useEffect } from "react";

import { useSocket } from "./useSocket";
import { Events } from "@/events";
import { RoomState } from "@/server/types";

export const useRoom = () => {
  const { socket, emit } = useSocket();
  const [room, setRoom] = useState<RoomState | null>(null);

  useEffect(() => {
    if (!socket) return;

    socket.on(Events.ROOM_STATE, setRoom);

    return () => {
      socket.off(Events.ROOM_STATE);
    };
  }, [socket]);

  const joinRoom = (roomId: string, seatIndex: number) =>
    emit(Events.JOIN_ROOM, { roomId, seatIndex });

  const leaveRoom = () => emit(Events.LEAVE_ROOM, null);

  return { room, joinRoom, leaveRoom };
};
