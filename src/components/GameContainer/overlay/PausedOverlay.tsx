import { PausedStatus } from "@/server/types";
import { WifiOff, Clock, Home, Vote, Play } from "lucide-react";

interface PauseOverlayProps {
  status: PausedStatus;
  onUnpause?: () => void;
  onQuit?: () => void;
  onVoteKick?: (playerId: string) => void;
}

export const PausedOverlay = ({
  status,
  onUnpause = () => console.log("Unpausing game..."),
  onQuit = () => console.log("Quitting to main menu..."),
  onVoteKick = (playerId: string) =>
    console.log("Voting to kick player:", playerId),
}: PauseOverlayProps) => {
  const getRemainingTime = () => {
    if (!status.autoResumeTime) return 0;
    const remaining = Math.max(0, status.autoResumeTime - Date.now());
    return Math.ceil(remaining / 1000);
  };

  const getPauseStatusText = () => {
    switch (status.reason) {
      case "user_paused":
        return `Paused by ${
          typeof status.pausedBy !== "string" ? status.pausedBy.name : "System"
        }`;
      case "player_disconnected":
        return "Player Disconnected";
      case "system":
        return "System Pause";
      default:
        return "Game Paused";
    }
  };

  const isDisconnectPause = status.reason === "player_disconnected";
  const remainingTime = getRemainingTime();

  return (
    <div className="fixed inset-0 bg-black/90 flex items-center justify-center">
      <div className="bg-slate-900 border-4 border-red-500 p-8 max-w-md w-full mx-4 text-center relative">
        {/* Pixel corners */}
        <div className="absolute -top-2 -left-2 w-4 h-4 border-t-4 border-l-4 border-red-500" />
        <div className="absolute -top-2 -right-2 w-4 h-4 border-t-4 border-r-4 border-red-500" />
        <div className="absolute -bottom-2 -left-2 w-4 h-4 border-b-4 border-l-4 border-red-500" />
        <div className="absolute -bottom-2 -right-2 w-4 h-4 border-b-4 border-r-4 border-red-500" />

        {/* Header */}
        <div className="mb-6">
          <h1 className="text-4xl font-bold text-red-500 mb-2">GAME PAUSED</h1>
          <div className="text-yellow-400 font-bold">
            {getPauseStatusText()}
          </div>
        </div>

        {/* Pause Timer */}
        {status.autoResumeTime && (
          <div className="mb-6 bg-slate-800/50 p-4 rounded-sm">
            <div className="flex items-center justify-center mb-3">
              <Clock className="w-5 h-5 text-yellow-400 mr-2" />
              <span className="text-yellow-400">
                Auto-resume in {remainingTime}s
              </span>
            </div>
            <div className="w-full bg-slate-700 h-2">
              <div
                className="h-full bg-yellow-500 transition-all duration-1000"
                style={{
                  width: `${(remainingTime / 30) * 100}%`,
                }}
              />
            </div>
          </div>
        )}

        {/* Disconnected Players */}
        {isDisconnectPause &&
          status.disconnectedPlayers &&
          status.disconnectedPlayers.length > 0 && (
            <div className="mb-8">
              <div className="bg-red-500/10 border border-red-500/30 p-4 rounded-sm">
                {status.disconnectedPlayers.map((player) => (
                  <div key={player.id} className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <WifiOff className="w-5 h-5 text-red-400 mr-2" />
                        <span className="text-white font-bold">
                          {player.name}
                        </span>
                      </div>
                      <div className="text-sm text-slate-400">
                        ID: {player.id.slice(0, 8)}
                      </div>
                    </div>

                    {/* Vote Kick UI */}
                    <div className="bg-slate-800/50 p-3">
                      <button
                        onClick={() => onVoteKick(player.id)}
                        className="w-full px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white flex items-center justify-center text-sm"
                      >
                        <Vote className="w-4 h-4 mr-2" />
                        Vote to Kick
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        {/* Action Buttons */}
        <div className="space-y-3">
          {status.reason === "user_paused" && (
            <button
              onClick={onUnpause}
              className="w-full px-6 py-2 bg-green-600 hover:bg-green-700 text-white flex items-center justify-center"
            >
              <Play className="w-5 h-5 mr-2" />
              Resume Game
            </button>
          )}

          <button
            onClick={onQuit}
            className="w-full px-6 py-2 bg-red-600 hover:bg-red-700 text-white flex items-center justify-center"
          >
            <Home className="w-5 h-5 mr-2" />
            Quit to Menu
          </button>
        </div>
      </div>
    </div>
  );
};
