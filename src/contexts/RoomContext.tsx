import { Events, ServerPayloads } from "@/events";
import { useSocket } from "@/hooks/useSocket";
import {
  GameRoomState,
  OperationResult,
  RoomSettings,
  RoomState,
} from "@/server/types";
import { createContext, useEffect, useState } from "react";

interface RoomContextType {
  room?: RoomState;
  joinRoom: (
    roomId: string,
    seatIndex: number
  ) => Promise<OperationResult<GameRoomState>>;
  leaveRoom: () => Promise<OperationResult<void>>;
  createRoom: (
    settings?: Partial<RoomSettings>
  ) => Promise<OperationResult<GameRoomState>>;
  toggleReady: () => Promise<OperationResult<void>>;
}

export const RoomContext = createContext<RoomContextType | null>(null);

export const RoomProvider = ({ children }: { children: React.ReactNode }) => {
  const { socket, emit } = useSocket();
  const [room, setRoom] = useState<RoomState>();

  const joinRoom = (roomId: string, seatIndex: number) =>
    emit(Events.JOIN_ROOM, { roomId, seatIndex });
  const leaveRoom = () => emit(Events.LEAVE_ROOM, null);
  const createRoom = (settings: Partial<RoomSettings> = {}) =>
    emit(Events.CREATE_ROOM, settings);
  const toggleReady = () => emit(Events.ROOM_READY, null);

  useEffect(() => {
    if (!socket) return;
    socket.on(Events.ROOM_STATE, (state: ServerPayloads["room:state"]) =>
      setRoom(state)
    );

    return () => {
      socket.off(Events.ROOM_STATE);
    };
  }, [socket]);

  return (
    <RoomContext value={{ room, joinRoom, leaveRoom, createRoom, toggleReady }}>
      {children}
    </RoomContext>
  );
};
