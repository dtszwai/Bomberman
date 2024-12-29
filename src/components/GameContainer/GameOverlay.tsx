import { useEffect, useState } from "react";

interface OverlayProps {
  isVisible: boolean;
  showMenu: boolean;
  onMenuToggle: (show: boolean) => void;
  winner?: string;
}

interface RoundEndProps {
  winner: string;
  nextRoundTime: number;
}

const KeyControls = () => (
  <div className="fixed top-4 left-1/2 -translate-x-1/2 bg-zinc-900/75 p-2 border border-zinc-700 font-mono text-sm">
    <div className="flex items-center gap-4 text-gray-400">
      <div>PRESS ↑ ↓ ← → TO MOVE</div>
      <div>PRESS SPACE TO PLACE BOMB</div>
    </div>
  </div>
);

const RoundEndOverlay: React.FC<RoundEndProps> = ({
  winner,
  nextRoundTime,
}) => (
  <div className="fixed inset-0 flex items-center justify-center bg-black/80">
    <div className="text-center font-mono">
      <h2 className="text-4xl text-yellow-400 mb-8">ROUND OVER</h2>
      <p className="text-2xl text-gray-200 mb-4">
        WINNER: <span className="text-yellow-400">{winner}</span>
      </p>
      <p className="text-2xl text-gray-200">
        NEXT ROUND IN: <span className="text-yellow-400">{nextRoundTime}</span>
      </p>
    </div>
  </div>
);

const GameMenu: React.FC<{
  isVisible: boolean;
  onClose: () => void;
}> = ({ isVisible, onClose }) => {
  if (!isVisible) return null;

  const options = [
    { label: "RESUME GAME", action: onClose },
    { label: "QUIT MATCH", action: () => console.log("Quit") },
  ];

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/80">
      <div className="w-64 bg-zinc-900 border border-zinc-700 p-4">
        <h2 className="font-mono text-gray-200 text-center mb-6">MENU</h2>
        <div className="space-y-2">
          {options.map((option, i) => (
            <button
              key={i}
              onClick={option.action}
              className="w-full px-3 py-2 font-mono text-sm text-gray-200
                border border-zinc-700 hover:bg-zinc-800"
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

const MessageLog: React.FC = () => {
  const [messages, setMessages] = useState<string[]>([]);

  useEffect(() => {
    const demoMessages = [
      "Server: Connection established",
      "Server: Waiting for players...",
      "Player2 joined the game",
    ];

    const interval = setInterval(() => {
      const message =
        demoMessages[Math.floor(Math.random() * demoMessages.length)];
      setMessages((prev) => [...prev.slice(-2), message]);
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed bottom-4 left-4 space-y-1">
      {messages.map((message, i) => (
        <div key={i} className="font-mono text-sm text-gray-200">
          {message}
        </div>
      ))}
    </div>
  );
};

export const GameOverlay: React.FC<OverlayProps> = ({
  isVisible,
  showMenu,
  onMenuToggle,
  winner = "PLAYER 1", // Default value for demo
}) => {
  const [nextRoundTime, setNextRoundTime] = useState(10);

  // Countdown timer for round end
  useEffect(() => {
    if (!isVisible || nextRoundTime <= 0) return;

    const interval = setInterval(() => {
      setNextRoundTime((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [isVisible, nextRoundTime]);

  return (
    <>
      <KeyControls />
      <MessageLog />
      <button
        onClick={() => onMenuToggle(!showMenu)}
        className="fixed top-4 right-4 px-3 py-1 font-mono text-sm 
          text-gray-200 bg-zinc-900/75 border border-zinc-700 
          hover:bg-zinc-800"
      >
        MENU
      </button>
      <GameMenu isVisible={showMenu} onClose={() => onMenuToggle(false)} />
      {isVisible && (
        <RoundEndOverlay winner={winner} nextRoundTime={nextRoundTime} />
      )}
    </>
  );
};
