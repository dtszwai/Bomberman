import { SocketProvider } from "./contexts/SocketContext";
import { ChatProvider } from "./contexts/ChatContext";
import { TooltipProvider } from "./components/ui/tooltip";
import { GameContainer } from "./components/GameContainer";

const App = () => {
  return (
    <TooltipProvider>
      <SocketProvider>
        <ChatProvider>
          <GameContainer />
        </ChatProvider>
      </SocketProvider>
    </TooltipProvider>
  );
};

export default App;
