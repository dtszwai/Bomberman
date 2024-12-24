import { SocketProvider } from "./contexts/SocketContext";
import { ChatProvider } from "./contexts/ChatContext";
import { TooltipProvider } from "./components/ui/tooltip";
import { AppLayout } from "./components/layout/AppLayout";
import { GameContainer } from "./components/GameContainer";

const Provider = ({ children }: { children: React.ReactNode }) => {
  return (
    <TooltipProvider>
      <SocketProvider>
        <ChatProvider>{children}</ChatProvider>
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
