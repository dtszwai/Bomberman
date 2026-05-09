import { GameStatusType } from "@arcade/protocol";
import { OnlineGameContainer } from "@arcade/games-bomberman/ui";
import { Lobby } from "../components/Lobby/Lobby";
import { useRoom } from "../hooks/useRoom";

export const BombermanRoute = () => {
  const { room } = useRoom();

  if (!room || room.status.type === GameStatusType.WAITING) {
    return <Lobby />;
  }

  return (
    <div className="h-screen bg-black">
      <OnlineGameContainer settings={room.settings} />
    </div>
  );
};
