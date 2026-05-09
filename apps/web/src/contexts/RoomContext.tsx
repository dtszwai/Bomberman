import { Events, ServerPayloads } from "@arcade/games-bomberman/sim";
import { useSocket } from "@/hooks/useSocket";
import {
  BotDifficulty,
  GameRoomState,
  OperationResult,
  RoomSettings,
  RoomState,
} from "@/types";
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
  updateRoomSettings: (
    roomId: string,
    settings: Partial<RoomSettings>
  ) => Promise<OperationResult<GameRoomState>>;
  toggleReady: () => Promise<OperationResult<void>>;
  addBot: (
    roomId: string,
    seatIndex?: number
  ) => Promise<OperationResult<GameRoomState>>;
  removeBot: (
    roomId: string,
    seatIndex: number
  ) => Promise<OperationResult<GameRoomState>>;
  updateBot: (
    roomId: string,
    seatIndex: number,
    payload: { difficulty?: BotDifficulty; name?: string }
  ) => Promise<OperationResult<GameRoomState>>;
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
  const updateRoomSettings = (
    roomId: string,
    settings: Partial<RoomSettings>
  ) => emit(Events.UPDATE_ROOM_SETTINGS, { roomId, settings });
  const toggleReady = () => emit(Events.ROOM_READY, null);
  const addBot = (roomId: string, seatIndex?: number) =>
    emit(Events.ADD_BOT, { roomId, seatIndex });
  const removeBot = (roomId: string, seatIndex: number) =>
    emit(Events.REMOVE_BOT, { roomId, seatIndex });
  const updateBot = (
    roomId: string,
    seatIndex: number,
    payload: { difficulty?: BotDifficulty; name?: string }
  ) => emit(Events.UPDATE_BOT, { roomId, seatIndex, ...payload });

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
    <RoomContext
      value={{
        room,
        joinRoom,
        leaveRoom,
        createRoom,
        updateRoomSettings,
        toggleReady,
        addBot,
        removeBot,
        updateBot,
      }}
    >
      {children}
    </RoomContext>
  );
};
