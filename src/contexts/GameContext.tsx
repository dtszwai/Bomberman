import { Events, ServerPayloads } from "@/events";
import { GameSnapshot, GameState } from "@/game/types";
import { useRoom } from "@/hooks/useRoom";
import { useSocket } from "@/hooks/useSocket";
import {
  GameStatus,
  GameStatusType,
  OperationResult,
  RoomType,
} from "@/server/types";
import { createContext, useEffect, useState } from "react";

interface GameContextType {
  status?: GameStatus;
  snapshot?: GameSnapshot;
  state?: GameState;
  start: () => Promise<OperationResult>;
  //   state: GameState;
}

export const GameContext = createContext<GameContextType | null>(null);

export const GameProivder = ({ children }: { children: React.ReactNode }) => {
  const { socket, emit, me } = useSocket();
  const { room } = useRoom();
  const [status, setStatus] = useState<GameStatus>();
  const [state, setState] = useState<GameState>();
  const [snapshot, setSnapshot] = useState<GameSnapshot>();

  const start = async () => {
    if (
      !socket ||
      !room ||
      room.type !== RoomType.GAME ||
      room.hostId !== me?.id ||
      room.status.type !== GameStatusType.WAITING
    )
      return { success: false, message: "Invalid operation" };

    return emit(Events.START_GAME, null);
  };

  useEffect(() => {
    if (!socket || !room || room.type !== RoomType.GAME) return;
    setStatus(room.status);
    setState(room.gameState);

    socket.on(
      Events.GAME_SNAPSHOT,
      (snapshot: ServerPayloads["game:snapshot"]) => {
        setSnapshot(snapshot);
      }
    );

    return () => {
      socket.off(Events.GAME_SNAPSHOT);
    };
  }, [room, socket]);

  return (
    <GameContext value={{ status, state, snapshot, start }}>
      {children}
    </GameContext>
  );
};
