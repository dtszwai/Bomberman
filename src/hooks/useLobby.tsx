import { useState, useEffect } from "react";
import { useSocket } from "./useSocket";
import { Events } from "@/events";
import { GlobalState, RoomSettings } from "@/server/types";

export const useLobby = () => {
  const { socket, emit, me } = useSocket();
  const [lobbyState, setLobbyState] = useState<GlobalState>({
    rooms: {},
    users: {},
  });

  useEffect(() => {
    if (!socket) return;

    socket.emit(Events.GLOBAL_STATE, null, setLobbyState);
    socket.on(Events.GLOBAL_STATE, setLobbyState);

    return () => {
      socket.off(Events.GLOBAL_STATE);
    };
  }, [emit, socket]);

  const createRoom = (settings: Partial<RoomSettings> = {}) =>
    emit(Events.CREATE_ROOM, settings);

  return { lobbyState, createRoom, me };
};
