import { use, useEffect, useRef } from "react";
import { Events } from "../../sim/events";
import { ControlState, KeyTracker } from "@arcade/realtime-core";
import { KEY_BINDINGS } from "../../sim/config/bindings";
import { GameStatusType } from "@arcade/protocol";
import { GameContext } from "../contexts/GameContext";

export const useGame = () => {
  const context = use(GameContext);
  if (!context) {
    throw new Error("useGame must be used within a GameProvider");
  }
  const { socket } = context;
  const keyTracker = useRef(new KeyTracker(KEY_BINDINGS));
  const previousState = useRef<string>("");
  const seqRef = useRef<number>(0);

  // Handle keyboard controls only during active gameplay
  useEffect(() => {
    if (context.status?.type === GameStatusType.WAITING || !socket) return;

    // Fire-and-forget — no ack. The server drops packets whose seq is not
    // greater than the last accepted one, so lost or reordered packets
    // self-heal on the next send.
    const sendControlUpdate = (state: ControlState) => {
      const stateHash = JSON.stringify(state);
      if (stateHash !== previousState.current) {
        socket.emit(Events.USER_CONTROLS, { ...state, seq: ++seqRef.current });
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
  }, [socket, context.status?.type]);

  return context;
};
