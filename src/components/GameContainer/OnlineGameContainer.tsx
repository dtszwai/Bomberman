import { useEffect, useRef, useState } from "react";
import { SCREEN_HEIGHT, SCREEN_WIDTH } from "@/game/constants";
import { useGame } from "@/hooks/useGame";
import { OnlineGameController } from "@/controller/OnlineGameController";
import { GameOverlay } from "./GameOverlay";
import { GameStatus } from "@/server/types";

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
  const [showOverlay, setShowOverlay] = useState(false);

  // Initialize game controller
  useEffect(() => {
    if (!containerRef.current || controllerRef.current) return;

    controllerRef.current = new OnlineGameController({
      container: containerRef.current,
      width,
      height,
    });

    return () => {
      controllerRef.current?.stop();
      controllerRef.current = null;
    };
  }, [height, width]);

  // Handle game snapshot updates
  useEffect(() => {
    if (controllerRef.current && snapshot) {
      controllerRef.current.updateFromServer(snapshot);
    }
  }, [snapshot]);

  // Handle round end transition
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    if (status === GameStatus.ROUND_ENDED) {
      setShowOverlay(true);
      timeoutId = setTimeout(() => {
        setShowOverlay(false);
      }, 3000);
    } else {
      setShowOverlay(status === GameStatus.PAUSED);
    }

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [status]);

  return (
    <div className="relative w-full h-full">
      <div ref={containerRef} className="p-0 m-0 h-full flex" />
      <GameOverlay
        status={status}
        isVisible={
          showOverlay ||
          status === GameStatus.PAUSED ||
          status === GameStatus.WAITING
        }
        gameData={snapshot}
      />
    </div>
  );
};
