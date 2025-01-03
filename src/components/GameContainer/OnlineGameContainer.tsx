import { useEffect, useRef, useState } from "react";
import { SCREEN_HEIGHT, SCREEN_WIDTH } from "@/game/constants";
import { useGame } from "@/hooks/useGame";
import { OnlineGameController } from "@/controller/OnlineGameController";
import { GameOverlay } from "./GameOverlay";

interface OnlineGameContainerProps {
  width?: number;
  height?: number;
}

export const OnlineGameContainer = ({
  width = SCREEN_WIDTH,
  height = SCREEN_HEIGHT,
}: OnlineGameContainerProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const controllerRef = useRef<OnlineGameController | null>(null);
  const { snapshot, status } = useGame();
  const [showMenu, setShowMenu] = useState(false);

  // Initialize game controller
  useEffect(() => {
    const container = containerRef.current;
    if (!container || controllerRef.current) return;

    controllerRef.current = new OnlineGameController({
      container,
      width,
      height,
    });

    return () => {
      controllerRef.current?.stop();
      controllerRef.current = null;
    };
  }, [width, height]);

  // Handle game snapshot updates
  useEffect(() => {
    if (controllerRef.current && snapshot) {
      controllerRef.current.updateFromServer(snapshot);
    }
  }, [snapshot]);

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
        onMenuToggle={setShowMenu}
        status={status}
      />
    </div>
  );
};
