import { useState } from "react";
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  Keyboard,
  Loader,
  MenuIcon,
  Space,
} from "lucide-react";
import {
  GameStatusType,
  type GameStatus,
  type PausedStatus,
  type RoomSettings,
  type RoundEndedStatus,
} from "@arcade/protocol";
import { PausedOverlay, RoundEndOverlay } from "./overlay";
import { BOMBERMAN_MAPS, POWERUP_PRESETS } from "../../../sim/constants";

interface OverlayProps {
  status?: GameStatus;
  settings?: RoomSettings;
  showMenu: boolean;
  onMenuToggle: (show: boolean) => void;
}

const getMapName = (mapId: string) =>
  BOMBERMAN_MAPS.find((map) => map.id === mapId)?.name ?? "Classic";

const getPowerupPresetName = (presetId: string) =>
  POWERUP_PRESETS.find((preset) => preset.id === presetId)?.name ?? "Classic";

const formatRoundTime = (seconds: number) => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${String(remainingSeconds).padStart(2, "0")}`;
};

const GameInfo = ({ settings }: { settings?: RoomSettings }) => {
  if (!settings) return null;

  return (
    <div className="fixed top-4 left-4 max-w-[calc(100vw-8rem)] rounded-md border border-zinc-700 bg-zinc-950/80 px-3 py-2 font-mono text-xs text-gray-300">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <span>{getMapName(settings.mapId)}</span>
        <span>{settings.tournamentMode ? "Tournament" : "Casual"}</span>
        <span>First to {settings.maxWins}</span>
        <span>{formatRoundTime(settings.roundTimeSeconds)}</span>
        <span>{getPowerupPresetName(settings.powerupPreset)} power-ups</span>
      </div>
    </div>
  );
};

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

const MessageLog = () => {
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

export const GameOverlay = ({
  status,
  settings,
  showMenu,
  onMenuToggle,
}: OverlayProps) => {
  const renderOverlay = () => {
    if (!status) return null;
    switch (status.type) {
      case GameStatusType.WAITING:
        return <WaitingOverlay />;
      case GameStatusType.PAUSED:
        return <PausedOverlay status={status as PausedStatus} />;
      case GameStatusType.ROUND_ENDED:
        return <RoundEndOverlay status={status as RoundEndedStatus} />;
      default:
        return null;
    }
  };

  return (
    <>
      <GameInfo settings={settings} />
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
      {renderOverlay()}
    </>
  );
};
