import { useEffect, useRef } from "react";
import { SCREEN_HEIGHT, SCREEN_WIDTH } from "@/game/constants";
import { useGame } from "@/hooks/useGame";
import { OnlineGameController } from "@/controller/OnlineGameController";

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
  const { snapshot } = useGame();

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

  useEffect(() => {
    if (controllerRef.current && snapshot) {
      controllerRef.current.updateFromServer(snapshot);
    }
  }, [snapshot]);

  return <div ref={containerRef} className="game-container" />;
};
