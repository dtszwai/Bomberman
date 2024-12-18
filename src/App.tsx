import { useEffect, useState } from "react";
import Lobby from "./components/Lobby";
import { useLobby } from "./hooks/useLobby";
import { OnlineGameContainer } from "./components/GameContainer/OnlineGameContainer";
import { LocalGameContainer } from "./components/GameContainer/LocalGameContainer";

type GameMode = "none" | "local" | "online";

export default function App() {
  const { state } = useLobby();
  const [gameMode, setGameMode] = useState<GameMode>("none");

  useEffect(() => {
    if (state.currentRoom?.started) {
      setGameMode("online");
    } else if (!state.currentRoom && gameMode === "online") {
      setGameMode("none");
    }
  }, [state.currentRoom, gameMode]);

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
