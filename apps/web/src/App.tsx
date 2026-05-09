import { SocketProvider } from "./contexts/SocketContext";
import { ChatProvider } from "./contexts/ChatContext";
import { TooltipProvider } from "./components/ui/tooltip";
import { AppLayout } from "./components/layout/AppLayout";
import { RoomProvider } from "./contexts/RoomContext";
import { GameProivder } from "@arcade/games-bomberman/ui";
import { BombermanRoute } from "./routes/BombermanRoute";
import { useSocket } from "./hooks/useSocket";
import { useRoom } from "./hooks/useRoom";

const ConnectedGameProvider = ({ children }: { children: React.ReactNode }) => {
  const { socket, me, emit } = useSocket();
  const { room } = useRoom();
  return (
    <GameProivder socket={socket} me={me} emit={emit} room={room}>
      {children}
    </GameProivder>
  );
};

const Provider = ({ children }: { children: React.ReactNode }) => {
  return (
    <TooltipProvider>
      <SocketProvider>
        <RoomProvider>
          <ChatProvider>
            <ConnectedGameProvider>{children}</ConnectedGameProvider>
          </ChatProvider>
        </RoomProvider>
      </SocketProvider>
    </TooltipProvider>
  );
};

const App = () => {
  return (
    <Provider>
      <AppLayout>
        <BombermanRoute />
      </AppLayout>
    </Provider>
  );
};

export default App;
