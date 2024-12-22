import { useState, useEffect, useCallback } from "react";
import { useSocket } from "./useSocket";
import { Events } from "@/events";
import { RoomState } from "@/server/types";

export const useRoom = () => {
  const { socket, emit } = useSocket();
  const [room, setRoom] = useState<RoomState>();

  const handleRoomState = useCallback((roomState: RoomState) => {
    setRoom(roomState);
  }, []);

  useEffect(() => {
    if (!socket) return;

    socket.on(Events.ROOM_STATE, handleRoomState);

    return () => {
      socket.off(Events.ROOM_STATE, handleRoomState);
    };
  }, [socket, handleRoomState]);

  const joinRoom = useCallback(
    (roomId: string, seatIndex: number) =>
      emit(Events.JOIN_ROOM, { roomId, seatIndex }),
    [emit]
  );

  const leaveRoom = useCallback(() => emit(Events.LEAVE_ROOM, null), [emit]);

  return { room, joinRoom, leaveRoom };
};
