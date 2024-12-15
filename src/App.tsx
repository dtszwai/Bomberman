import { useEffect, useRef } from "react";
import { BombermanGame } from "./BombermanGame";

function App() {
  const containerRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<BombermanGame | null>(null);

  useEffect(() => {
    if (containerRef.current && !gameRef.current) {
      gameRef.current = new BombermanGame(containerRef.current);
      gameRef.current.start();
    }

    return () => {
      gameRef.current?.stop();
      gameRef.current = null;
    };
  }, []);

  return <div ref={containerRef} className="game-container" />;
}

export default App;
