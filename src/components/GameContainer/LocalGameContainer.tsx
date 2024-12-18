import { useEffect, useRef } from "react";
import { SCREEN_HEIGHT, SCREEN_WIDTH } from "@/game/constants";
import { LocalGameController } from "@/controller/LocalGameController";

interface LocalGameContainerProps {
  width?: number;
  height?: number;
}

export const LocalGameContainer = ({
  width = SCREEN_WIDTH,
  height = SCREEN_HEIGHT,
}: LocalGameContainerProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const controllerRef = useRef<LocalGameController | null>(null);

  useEffect(() => {
    if (!containerRef.current || controllerRef.current) return;

    controllerRef.current = new LocalGameController({
      container: containerRef.current,
      width,
      height,
    });

    controllerRef.current.start();

    return () => {
      controllerRef.current?.stop();
      controllerRef.current = null;
    };
  }, [height, width]);

  return <div ref={containerRef} className="game-container" />;
};
