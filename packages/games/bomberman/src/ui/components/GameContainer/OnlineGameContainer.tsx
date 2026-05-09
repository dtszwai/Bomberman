import { useEffect, useRef, useState } from "react";
import { SCREEN_HEIGHT, SCREEN_WIDTH } from "../../../sim/constants";
import { useGame } from "../../hooks/useGame";
import { OnlineGameController } from "../../controller/OnlineGameController";
import { GameOverlay } from "./GameOverlay";
import type { RoomSettings } from "@arcade/protocol";

interface OnlineGameContainerProps {
  width?: number;
  height?: number;
  settings?: RoomSettings;
}

export const OnlineGameContainer = ({
  width = SCREEN_WIDTH,
  height = SCREEN_HEIGHT,
  settings,
}: OnlineGameContainerProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const controllerRef = useRef<OnlineGameController | null>(null);
  const { snapshotBufferRef, eventsRef, resyncRef, status, roundStart } =
    useGame();
  const [showMenu, setShowMenu] = useState(false);

  // Initialize game controller and its RAF loop
  useEffect(() => {
    const container = containerRef.current;
    if (!container || controllerRef.current) return;

    controllerRef.current = new OnlineGameController({
      container,
      width,
      height,
      getBuffer: () => snapshotBufferRef.current.values(),
      getEvents: () => eventsRef.current,
      getResync: () => resyncRef.current,
    });
    controllerRef.current.start();

    return () => {
      controllerRef.current?.stop();
      controllerRef.current = null;
    };
  }, [width, height, snapshotBufferRef, eventsRef, resyncRef]);

  // Install static round data when a round starts
  useEffect(() => {
    if (controllerRef.current && roundStart) {
      controllerRef.current.setRoundData(roundStart);
    }
  }, [roundStart]);

  // Handle ESC key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setShowMenu((prev) => !prev);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <div className="relative w-full h-full">
      <div ref={containerRef} className="p-0 m-0 h-full flex" />
      <GameOverlay
        showMenu={showMenu}
        settings={settings}
        onMenuToggle={setShowMenu}
        status={status}
      />
    </div>
  );
};
