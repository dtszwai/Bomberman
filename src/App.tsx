import { SocketProvider } from "./contexts/SocketContext";
import { ChatProvider } from "./contexts/ChatContext";
import { TooltipProvider } from "./components/ui/tooltip";
import { AppLayout } from "./components/layout/AppLayout";
import { GameContainer } from "./components/GameContainer";
import { RoomProvider } from "./contexts/RoomContext";
import { GameProivder } from "./contexts/GameContext";

const Provider = ({ children }: { children: React.ReactNode }) => {
  return (
    <TooltipProvider>
      <SocketProvider>
        <RoomProvider>
          <ChatProvider>
            <GameProivder>{children}</GameProivder>
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
        <GameContainer />
      </AppLayout>
    </Provider>
  );
};

export default App;
