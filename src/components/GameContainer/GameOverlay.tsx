import { useEffect, useState } from "react";
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  Keyboard,
  Loader,
  MenuIcon,
  Space,
  Timer,
} from "lucide-react";
import {
  GameStatus,
  GameStatusType,
  PausedStatus,
  RoundEndedStatus,
} from "@/server/types";

interface OverlayProps {
  status?: GameStatus;
  showMenu: boolean;
  onMenuToggle: (show: boolean) => void;
}

const KeyControls = () => (
  <div className="bg-zinc-800 p-3 border border-zinc-700 font-mono text-sm rounded-md">
    <div className="flex items-center gap-2 mb-2 text-yellow-400">
      <Keyboard size={18} />
      <span>CONTROLS</span>
    </div>
    <div className="space-y-3 text-gray-400">
      <div className="flex items-center gap-2">
        <span>MOVE:</span>
        <div className="flex items-center gap-1 text-yellow-400">
          <ArrowUp
            size={16}
            className="border border-yellow-400/50 rounded p-0.5"
          />
          <ArrowDown
            size={16}
            className="border border-yellow-400/50 rounded p-0.5"
          />
          <ArrowLeft
            size={16}
            className="border border-yellow-400/50 rounded p-0.5"
          />
          <ArrowRight
            size={16}
            className="border border-yellow-400/50 rounded p-0.5"
          />
        </div>
      </div>
      <div className="flex items-center gap-2">
        <span>BOMB:</span>
        <div className="flex items-center text-yellow-400">
          <Space
            size={16}
            className="border border-yellow-400/50 rounded px-4 py-0.5"
          />
          <span className="text-xs">&nbsp;SPACE</span>
        </div>
      </div>
    </div>
  </div>
);

const WaitingOverlay = () => (
  <div className="fixed inset-0 flex items-center justify-center bg-black/80">
    <div className="text-center font-mono">
      <div className="flex items-center justify-center gap-3 text-yellow-400 mb-4">
        <Loader className="animate-spin" size={24} />
        <h2 className="text-2xl">WAITING FOR PLAYERS</h2>
      </div>
      <p className="text-gray-400">The game will start once all players join</p>
    </div>
  </div>
);

const PausedOverlay = ({ status }: { status: PausedStatus }) => {
  const getPauseMessage = () => {
    switch (status.reason) {
      case "host_paused":
        return "Game paused by host";
      case "player_disconnected":
        return `Waiting for ${status.disconnectedPlayers?.join(", ")}`;
      case "system":
        return "Game paused by system";
      default:
        return "Game paused";
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/80">
      <div className="text-center font-mono">
        <div className="flex items-center justify-center gap-3 text-yellow-400 mb-4">
          <Timer size={24} />
          <h2 className="text-2xl">GAME PAUSED</h2>
        </div>
        <p className="text-gray-400">{getPauseMessage()}</p>
        {status.autoResumeTime && (
          <p className="text-gray-400 mt-2">
            Auto-resuming in{" "}
            {Math.ceil((status.autoResumeTime - status.timestamp) / 1000)}s
          </p>
        )}
      </div>
    </div>
  );
};

const RoundEndOverlay = ({ status }: { status: RoundEndedStatus }) => {
  const [timeLeft, setTimeLeft] = useState(() => {
    if (status.state.isGameOver) {
      return Math.ceil(
        (status.state.terminationTime - status.timestamp) / 1000
      );
    }
    return Math.ceil(
      (status.state.nextRoundStartTime - status.timestamp) / 1000
    );
  });

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft((prev) => Math.max(0, prev - 1));
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/80">
      <div className="text-center font-mono">
        <h2 className="text-4xl text-yellow-400 mb-8">
          {status.state.isGameOver ? "GAME OVER" : "ROUND OVER"}
        </h2>
        <p className="text-2xl text-gray-200 mb-4">
          WINNER:{" "}
          <span className="text-yellow-400">
            PLAYER {status.winner.seatIndex + 1}
          </span>
        </p>
        {status.state.isGameOver ? (
          <>
            <div className="space-y-2 mb-8">
              <p className="text-xl text-gray-200">FINAL SCORES</p>
              {status.state.finalScores.map(
                (score, index) =>
                  // Display only scores greater than or equal to 0
                  // negative scores are used to indicate empty seats
                  score >= 0 && (
                    <p key={index} className="text-gray-400">
                      PLAYER {index + 1}:{" "}
                      <span className="text-yellow-400">{score}</span>
                    </p>
                  )
              )}
            </div>
            <p className="text-gray-200">
              RETURNING TO LOBBY IN:{" "}
              <span className="text-yellow-400">{timeLeft}</span>
            </p>
          </>
        ) : (
          <p className="text-2xl text-gray-200">
            NEXT ROUND IN: <span className="text-yellow-400">{timeLeft}</span>
          </p>
        )}
      </div>
    </div>
  );
};

const GameMenu = ({
  isVisible,
  onClose,
}: {
  isVisible: boolean;
  onClose: () => void;
}) => {
  if (!isVisible) return null;

  const options = [{ label: "RESUME GAME", action: onClose }];

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/80">
      <div className="w-80 bg-zinc-900 border border-zinc-700 p-6 rounded-lg">
        <h2 className="font-mono text-gray-200 text-center text-xl mb-6">
          MENU
        </h2>
        <div className="space-y-4">
          <KeyControls />
          {options.map((option, i) => (
            <button
              key={i}
              onClick={option.action}
              className="w-full px-3 py-2 font-mono text-sm text-gray-200
                border border-zinc-700 hover:bg-zinc-800 rounded"
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
  const [messages, _setMessages] = useState<string[]>([]);

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
  status,
  showMenu,
  onMenuToggle,
}) => {
  return (
    <>
      <MessageLog />
      <button
        onClick={() => onMenuToggle(!showMenu)}
        className="fixed top-4 right-4 px-3 py-2 font-mono text-sm 
          text-gray-200 bg-zinc-900/75 border border-zinc-700 
          hover:bg-zinc-800 flex items-center gap-2"
      >
        <MenuIcon size={16} />
        <span>MENU</span>
      </button>
      <GameMenu isVisible={showMenu} onClose={() => onMenuToggle(false)} />

      {status?.type === GameStatusType.WAITING && <WaitingOverlay />}
      {status?.type === GameStatusType.PAUSED && (
        <PausedOverlay status={status} />
      )}
      {status?.type === GameStatusType.ROUND_ENDED && (
        <RoundEndOverlay status={status} />
      )}
    </>
  );
};
