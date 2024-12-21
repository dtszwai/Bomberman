import { useState, useEffect } from "react";

import { useSocket } from "./useSocket";
import { Events } from "@/events";
import { RoomState, Position } from "@/server/types";

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

  const joinRoom = (position: Position) => emit(Events.JOIN_ROOM, position);
  const leaveRoom = () => emit(Events.LEAVE_ROOM, null);

  return { room, joinRoom, leaveRoom };
};
