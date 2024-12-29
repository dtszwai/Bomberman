import { use, useEffect, useRef } from "react";
import { Events } from "../events";
import { useSocket } from "./useSocket";
import { ControlState, KeyTracker } from "@/utils/KeyTracker";
import { GameStatusType } from "@/server/types";
import { GameContext } from "@/contexts/GameContext";

export const useGame = () => {
  const { socket, emit } = useSocket();
  const context = use(GameContext);
  if (!context) {
    throw new Error("useRoom must be used within a RoomProvider");
  }
  const keyTracker = useRef(new KeyTracker());
  const previousState = useRef<string>("");

  // Handle keyboard controls only during active gameplay
  useEffect(() => {
    if (context.status?.type === GameStatusType.WAITING || !socket) return;

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
      keyTracker.current.reset();
    };
  }, [socket, emit, context.status?.type]);

  return context;
};
