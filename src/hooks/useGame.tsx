import { useCallback, useEffect, useRef, useState } from "react";
import { Events, ServerPayloads } from "../events";
import { useSocket } from "./useSocket";
import { ControlState, KeyTracker } from "@/utils/KeyTracker";
import { GameSnapshot } from "@/game/types";
import { GameStatus, GameStatusType, RoomType } from "@/server/types";

export const useGame = () => {
  const { socket, emit } = useSocket();
  const [snapshot, setSnapshot] = useState<GameSnapshot>();
  const [status, setStatus] = useState<GameStatus>();
  const keyTracker = useRef(new KeyTracker());
  const previousState = useRef<string>("");

  useEffect(() => {
    if (!socket) return;

    const handleGameSnapshot = (snapshot: ServerPayloads["game:snapshot"]) => {
      setSnapshot(snapshot);
    };

    const handleGameStatus = (roomState: ServerPayloads["room:state"]) => {
      if (roomState.type === RoomType.GAME) {
        setStatus(roomState.status);
      }
    };

    socket.on(Events.GAME_SNAPSHOT, handleGameSnapshot);
    socket.on(Events.ROOM_STATE, handleGameStatus);

    return () => {
      socket.off(Events.GAME_SNAPSHOT);
      keyTracker.current.reset();
    };
  }, [socket]);

  // Handle keyboard controls only during active gameplay
  useEffect(() => {
    if (status?.type === GameStatusType.WAITING || !socket) return;

    const sendControlUpdate = (state: ControlState) => {
      const stateHash = JSON.stringify(state);
      if (stateHash !== previousState.current) {
        emit(Events.USER_CONTROLS, state);
        previousState.current = stateHash;
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      const state = keyTracker.current.handleKeyDown(event.code);
      if (state) {
        event.preventDefault();
        sendControlUpdate(state);
      }
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      const state = keyTracker.current.handleKeyUp(event.code);
      if (state) {
        event.preventDefault();
        sendControlUpdate(state);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [status, socket, emit]);

  const startGame = useCallback(() => {
    keyTracker.current.reset();
    emit(Events.START_GAME, null);
  }, [emit]);

  const setReady = useCallback(() => {
    emit(Events.ROOM_READY, null);
  }, [emit]);

  return {
    snapshot,
    status,
    startGame,
    setReady,
    isActive: status?.type !== GameStatusType.WAITING,
  };
};
