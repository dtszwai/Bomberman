import { useEffect, useState } from "react";
import Lobby from "./components/Lobby";
import { useLobby } from "./hooks/useLobby";
import { OnlineGameContainer } from "./components/GameContainer/OnlineGameContainer";
import { LocalGameContainer } from "./components/GameContainer/LocalGameContainer";
import { GameStatus } from "./server/types";

type GameMode = "none" | "local" | "online";

export default function App() {
  const { state } = useLobby();
  const [gameMode, setGameMode] = useState<GameMode>("none");

  const room = state.currentRoom;

  useEffect(() => {
    if (room?.type === "game" && room.gameStatus !== GameStatus.WAITING) {
      setGameMode("online");
    } else if (!room && gameMode === "online") {
      setGameMode("none");
    }
  }, [gameMode, room]);

  const handleStartLocalGame = () => {
    setGameMode("local");
  };

  if (gameMode === "local") {
    return <LocalGameContainer />;
  }

  if (gameMode === "online") {
    return <OnlineGameContainer />;
  }

  return <Lobby onStartLocalGame={handleStartLocalGame} />;
}
