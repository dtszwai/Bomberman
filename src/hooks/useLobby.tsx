import { useState, useEffect } from "react";
import { useSocket } from "./useSocket";
import { Events } from "@/events";
import { GlobalState, RoomSettings } from "@/server/types";

export const useLobby = () => {
  const { socket, emit } = useSocket();
  const [lobbyState, setLobbyState] = useState<GlobalState>({
    rooms: {},
    users: {},
  });

  useEffect(() => {
    if (!socket) return;

    socket.on(Events.GLOBAL_STATE, setLobbyState);

    return () => {
      socket.off(Events.GLOBAL_STATE);
    };
  }, [socket]);

  const createRoom = (settings: Partial<RoomSettings>) =>
    emit(Events.CREATE_ROOM, settings);

  return { lobbyState, createRoom };
};
