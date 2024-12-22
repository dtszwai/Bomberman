import { GameStatus } from "@/server/types";
import { OnlineGameContainer } from "./OnlineGameContainer";
import { LocalGameContainer } from "./LocalGameContainer";
import GameLobby from "../Lobby";
import { useRoom } from "@/hooks/useRoom";

export const GameContainer = () => {
  const { room } = useRoom();

  if (!room || room.gameStatus === GameStatus.WAITING) {
    return <GameLobby />;
  }

  return (
    <div className="h-screen bg-black">
      <OnlineGameContainer />
    </div>
  );
};

export { OnlineGameContainer, LocalGameContainer };
