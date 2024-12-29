import { GameStatusType } from "@/server/types";
import { OnlineGameContainer } from "./OnlineGameContainer";
import { LocalGameContainer } from "./LocalGameContainer";
import { Lobby } from "../Lobby/Lobby";
import { useRoom } from "@/hooks/useRoom";

export const GameContainer = () => {
  const { room } = useRoom();

  console.log(room);

  if (!room || room.status.type === GameStatusType.WAITING) {
    return <Lobby />;
  }

  return (
    <div className="h-screen bg-black">
      <OnlineGameContainer />
    </div>
  );
};

export { OnlineGameContainer, LocalGameContainer };
