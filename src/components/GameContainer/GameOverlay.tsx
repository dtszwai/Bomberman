import { Card } from "@/components/ui/card";
import { GameSnapshot } from "@/game/types";
import { GameStatus } from "@/server/types";
import { useEffect } from "react";

interface GameOverlayProps {
  status: GameStatus;
  isVisible: boolean;
  gameData?: GameSnapshot;
}

export const GameOverlay: React.FC<GameOverlayProps> = ({
  status,
  isVisible,
  gameData,
}) => {
  // Prevent keyboard/gamepad input when overlay is active
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isVisible) {
        e.preventDefault();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isVisible]);

  if (!isVisible) return null;

  const renderContent = () => {
    switch (status) {
      case GameStatus.WAITING:
        return (
          <Card className="bg-slate-900/95 border-0 text-white p-8 max-w-md w-full">
            <h2 className="text-2xl font-bold text-center mb-4">Game Ended</h2>
            <p className="text-center text-gray-300">Returning to lobby...</p>
          </Card>
        );

      case GameStatus.PAUSED:
        return (
          <Card className="bg-slate-900/95 border-0 text-white p-8 max-w-md w-full">
            <h2 className="text-2xl font-bold text-center mb-4">Game Paused</h2>
            <p className="text-center text-gray-300">Press ESC to resume</p>
          </Card>
        );

      case GameStatus.ROUND_ENDED:
        return (
          <Card className="bg-slate-900/95 border-0 text-white p-8 max-w-md w-full">
            <h2 className="text-2xl font-bold text-center mb-4">
              Round Complete!
            </h2>
            <div className="space-y-4">
              <div className="flex justify-center items-center space-x-8">
                <div className="text-center">
                  <p className="text-lg font-semibold">Winner</p>
                  <p className="text-xl text-blue-400">
                    {gameData?.winner || "N/A"}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-semibold">Score</p>
                  <p className="text-xl text-blue-400">
                    {gameData?.score || 0}
                  </p>
                </div>
              </div>
              <p className="text-center text-gray-300">
                Next round starting soon...
              </p>
            </div>
          </Card>
        );

      default:
        return null;
    }
  };

  return (
    <div
      className={`fixed inset-0 flex items-center justify-center backdrop-blur-sm z-50 transition-opacity duration-300 ${
        isVisible ? "opacity-100" : "opacity-0 pointer-events-none"
      }`}
    >
      {renderContent()}
    </div>
  );
};
