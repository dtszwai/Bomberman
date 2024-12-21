import { useCallback, useEffect, useRef, useState } from "react";
import { Events, ServerPayloads } from "../events";

import { useSocket } from "./useSocket";
import { ControlState, KeyTracker } from "@/utils/KeyTracker";
import { GameSnapshot } from "@/game/types";
import { GameStatus } from "@/server/types";

export const useGame = () => {
  const { socket, emit } = useSocket();
  const [snapshot, setSnapshot] = useState<GameSnapshot | null>(null);
  const [status, setStatus] = useState<GameStatus>(GameStatus.WAITING);
  const keyTracker = useRef(new KeyTracker());
  const previousState = useRef<string>("");

  useEffect(() => {
    if (!socket) return;

    const handleGameSnapshot = (snapshot: ServerPayloads["game:snapshot"]) => {
      setSnapshot(snapshot);
      setStatus(snapshot.status);
    };

    const handleGamePaused = () => setStatus(GameStatus.PAUSED);
    const handleGameResumed = () => setStatus(GameStatus.ACTIVE);
    const handleGameEnded = () => {
      setStatus(GameStatus.WAITING);
      keyTracker.current.reset();
    };

    socket.on(Events.GAME_SNAPSHOT, handleGameSnapshot);
    socket.on(Events.GAME_PAUSE, handleGamePaused);
    socket.on(Events.GAME_RESUME, handleGameResumed);
    socket.on(Events.GAME_END, handleGameEnded);

    return () => {
      socket.off(Events.GAME_SNAPSHOT);
      socket.off(Events.GAME_PAUSE);
      socket.off(Events.GAME_RESUME);
      socket.off(Events.GAME_END);
      keyTracker.current.reset();
    };
  }, [socket]);

  // Handle keyboard controls only during active gameplay
  useEffect(() => {
    if (status === GameStatus.WAITING || !socket) return;

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
    isActive: status !== GameStatus.WAITING,
  };
};
