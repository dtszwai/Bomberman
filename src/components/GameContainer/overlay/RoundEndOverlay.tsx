import { useState, useEffect } from "react";
import { Trophy, Timer, Crown } from "lucide-react";
import { RoundEndedStatus } from "@/server/types";

interface RoundEndOverlayProps {
  status: RoundEndedStatus;
  onNextRound?: () => void;
  onGameEnd?: () => void;
}

export const RoundEndOverlay = ({
  status,
  onNextRound = () => console.log("Starting next round..."),
  onGameEnd = () => console.log("Ending game..."),
}: RoundEndOverlayProps) => {
  const [timeRemaining, setTimeRemaining] = useState<number>(() => {
    if ("isGameOver" in status.state && status.state.isGameOver) {
      return Math.max(
        0,
        Math.ceil((status.state.terminationTime - Date.now()) / 1000)
      );
    } else {
      return Math.max(
        0,
        Math.ceil((status.state.nextRoundStartTime - Date.now()) / 1000)
      );
    }
  });

  useEffect(() => {
    // Update the countdown every second
    const timer = setInterval(() => {
      setTimeRemaining((prevTime) => {
        const newTime = Math.max(0, prevTime - 1);

        // Handle countdown completion
        if (newTime === 0) {
          if (status.state.isGameOver) {
            onGameEnd();
          } else {
            onNextRound();
          }
        }

        return newTime;
      });
    }, 1000);

    // Cleanup on unmount
    return () => clearInterval(timer);
  }, [status.state.isGameOver, onGameEnd, onNextRound]);

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center">
      <div className="bg-slate-900 border-4 border-yellow-500 p-8 max-w-md w-full mx-4 text-center relative">
        {/* Pixel corners */}
        <div className="absolute -top-2 -left-2 w-4 h-4 border-t-4 border-l-4 border-yellow-500" />
        <div className="absolute -top-2 -right-2 w-4 h-4 border-t-4 border-r-4 border-yellow-500" />
        <div className="absolute -bottom-2 -left-2 w-4 h-4 border-b-4 border-l-4 border-yellow-500" />
        <div className="absolute -bottom-2 -right-2 w-4 h-4 border-b-4 border-r-4 border-yellow-500" />

        {/* Round Header */}
        <div className="mb-6">
          <h1 className="text-4xl font-bold text-yellow-500 mb-2">
            {status.state.isGameOver
              ? "GAME OVER"
              : `ROUND ${status.roundNumber} COMPLETE`}
          </h1>
        </div>

        {/* Winner Display */}
        <div className="mb-8">
          <div className="inline-block bg-yellow-500/20 p-6 rounded-lg mb-4">
            <Crown className="w-16 h-16 text-yellow-500 mb-2 mx-auto" />
            <div className="text-white font-bold text-xl">
              {status.winner.name}
            </div>
            <div className="text-yellow-500">WINNER!</div>
          </div>
        </div>

        {/* Game Over Stats */}
        {status.state.isGameOver && (
          <div className="mb-8">
            <h2 className="text-xl text-yellow-500 mb-4">Final Scores</h2>
            <div className="space-y-2">
              {status.state.scoreboard
                .sort((a, b) => b.wins - a.wins)
                .map((result, index) => (
                  <div
                    key={index}
                    className="flex justify-between items-center bg-slate-800/50 p-3"
                  >
                    <div className="flex items-center">
                      {index === 0 && (
                        <Trophy className="w-5 h-5 text-yellow-500 mr-2" />
                      )}
                      <span
                        className={
                          index === 0 ? "text-yellow-500" : "text-white"
                        }
                      >
                        {result.user.name}
                      </span>
                    </div>
                    <span
                      className={`font-mono ${
                        index === 0 ? "text-yellow-500" : "text-white"
                      }`}
                    >
                      {result.wins}
                    </span>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Next Round / Game End Countdown */}
        <div className="text-center">
          <div className="inline-block bg-green-600 px-6 py-3 relative">
            <div className="flex items-center space-x-2">
              <Timer className="w-5 h-5 text-white" />
              <span className="text-white">
                {status.state.isGameOver
                  ? "RETURNING TO LOBBY IN"
                  : "NEXT ROUND IN"}
              </span>
              <span className="text-2xl font-bold font-mono text-white">
                {timeRemaining}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
