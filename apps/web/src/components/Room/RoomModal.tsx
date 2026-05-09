import { useGame } from "@arcade/games-bomberman/ui";
import { useRoom } from "@/hooks/useRoom";
import {
  BotDifficulty,
  GameStatusType,
  RoomSettings,
  RoomState,
  UserState,
} from "@/types";
import { motion } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  X,
  Crown,
  Share2,
  Users,
  MessageSquare,
  Swords,
  Sparkles,
  Gamepad2,
  Timer,
  MessageCircle,
  Bot,
  Settings,
} from "lucide-react";
import { formatTime } from "@/lib/utils";
import { useEffect, useState } from "react";
import { ChatSession } from "../chat";
import { BotNameInput } from "./BotNameInput";
import { RoomSettingsForm } from "./RoomSettingsForm";
import {
  getSeatActorId,
  getSeatActorName,
  getSeatAvatarColor,
  getSeatInitial,
  getDifficultyLabel,
  isBotSeat,
  isHumanSeat,
  isOccupiedSeat,
  nextBotDifficulty,
} from "@/lib/roomActors";
import {
  getMapName,
  getMatchModeName,
  getPowerupPresetName,
} from "@/lib/bombermanSettings";

interface RoomModalProps {
  user: UserState;
  room: RoomState;
  onClose: () => void;
}

interface PlayerAvatarProps {
  seat: RoomState["seats"][number];
  isHost: boolean;
  isCurrentUser: boolean;
  canManageBots: boolean;
  onRemoveBot: (seatIndex: number) => void;
  onUpdateBotDifficulty: (
    seatIndex: number,
    difficulty: BotDifficulty
  ) => void;
  onUpdateBotName: (seatIndex: number, name: string) => void;
}

const PlayerAvatar = ({
  seat,
  isHost,
  isCurrentUser,
  canManageBots,
  onRemoveBot,
  onUpdateBotDifficulty,
  onUpdateBotName,
}: PlayerAvatarProps) => {
  const actorName = getSeatActorName(seat);
  const isBot = isBotSeat(seat);
  const avatarColor = getSeatAvatarColor(seat);

  return (
    <div
      className={`relative group transition-all duration-300 ${
        seat.actor ? "opacity-100" : "opacity-50 hover:opacity-80"
      }`}
    >
      <div
        className={`
      w-12 h-12 md:w-16 md:h-16 rounded-xl relative overflow-hidden
      ${
        seat.actor
          ? "bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-indigo-500/30"
          : "bg-gray-800/40 border border-gray-700/50"
      }
      ${
        isCurrentUser
          ? "ring-2 ring-indigo-500 ring-offset-2 ring-offset-gray-900"
          : ""
      }
    `}
        style={avatarColor ? { backgroundColor: avatarColor } : undefined}
      >
        {seat.actor ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <span
              className={`text-lg md:text-xl font-bold ${
                avatarColor
                  ? "text-white"
                  : "bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-400"
              }`}
            >
              {isBot ? (
                <Bot className="w-5 h-5 text-amber-300" />
              ) : (
                getSeatInitial(seat)
              )}
            </span>
            {seat.ready && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute -bottom-1 w-full pb-1 bg-green-500/20 backdrop-blur-sm"
              >
                <span className="text-[10px] font-medium text-green-400 uppercase tracking-wider">
                  Ready
                </span>
              </motion.div>
            )}
          </div>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            {canManageBots ? (
              <Bot className="w-4 h-4 md:w-5 md:h-5 text-gray-500" />
            ) : (
              <Users className="w-4 h-4 md:w-5 md:h-5 text-gray-600" />
            )}
          </div>
        )}
      </div>

      {seat.actor && (
        <>
          <div className="absolute -top-1 -right-1 flex items-center justify-center">
            {isHost && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="bg-gradient-to-r from-amber-400 to-orange-400 p-1 rounded-full"
              >
                <Crown className="w-3 h-3 text-white" />
              </motion.div>
            )}
            {isBot && canManageBots && (
              <button
                className="bg-gray-900 border border-gray-600 p-1 rounded-full text-gray-300 hover:text-white hover:border-red-500"
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  onRemoveBot(seat.index);
                }}
                aria-label={`Remove ${actorName}`}
              >
                <X className="w-3 h-3" />
              </button>
            )}
            {isBot && canManageBots && (
              <button
                className="absolute -bottom-1 -left-1 min-w-5 h-5 rounded-full bg-amber-500 text-[11px] leading-none text-gray-950 font-bold border border-gray-900"
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  if (seat.actor?.kind !== "bot") return;
                  onUpdateBotDifficulty(
                    seat.index,
                    nextBotDifficulty(seat.actor.bot.difficulty)
                  );
                }}
                aria-label={`Change ${actorName} difficulty`}
              >
                {seat.actor?.kind === "bot"
                  ? getDifficultyLabel(seat.actor.bot.difficulty)
                  : ""}
              </button>
            )}
          </div>
          <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 whitespace-nowrap">
            {isBot && canManageBots ? (
              <BotNameInput
                name={actorName}
                onRename={(name) => onUpdateBotName(seat.index, name)}
                className="h-6 w-24 md:w-28"
              />
            ) : (
              <span className="text-xs md:text-sm font-medium text-gray-400">
                {actorName}
              </span>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export const RoomModal = ({ user, room, onClose }: RoomModalProps) => {
  const {
    joinRoom,
    leaveRoom,
    toggleReady: setReady,
    addBot,
    removeBot,
    updateBot,
    updateRoomSettings,
  } = useRoom();
  const { start: startGame } = useGame();
  const [showChat, setShowChat] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [settingsError, setSettingsError] = useState<string | null>(null);

  const isHost = room.hostId === user.id;
  const currentUserSeat = room.seats.find(
    (seat) => seat.actor?.kind === "human" && seat.actor.user.id === user.id
  );
  const isReady = currentUserSeat?.ready;
  const connectedPlayers = room.seats.filter(isOccupiedSeat).length;
  const isCurrentRoom = user.position?.roomId === room.id;
  const [elapsedTime, setElapsedTime] = useState<string>(
    formatTime(Date.now() - (room.startTime ?? Date.now()))
  );

  useEffect(() => {
    if (
      room.status.type !== GameStatusType.WAITING &&
      room.startTime !== undefined
    ) {
      const timer = setInterval(() => {
        setElapsedTime(formatTime(Date.now() - room.startTime!));
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [room.startTime, room.status.type]);

  const canStartGame =
    connectedPlayers >= 2 &&
    room.seats.some(isHumanSeat) &&
    room.seats
      .filter(
        (seat) =>
          seat.actor?.kind === "human" && seat.actor.user.id !== room.hostId
      )
      .every((seat) => seat.ready);

  const handleJoinRoom = (seatIndex: number) => {
    joinRoom(room.id, seatIndex);
  };

  const handleLeaveRoom = () => {
    if (isCurrentRoom) {
      leaveRoom();
    }
  };

  const handleReadyToggle = () => {
    if (isCurrentRoom) {
      setReady();
    }
  };

  const handleAddBot = (seatIndex: number) => {
    addBot(room.id, seatIndex);
  };

  const handleRemoveBot = (seatIndex: number) => {
    removeBot(room.id, seatIndex);
  };

  const handleUpdateBotDifficulty = (
    seatIndex: number,
    difficulty: BotDifficulty
  ) => {
    updateBot(room.id, seatIndex, { difficulty });
  };

  const handleUpdateBotName = (seatIndex: number, name: string) => {
    updateBot(room.id, seatIndex, { name });
  };

  const handleUpdateRoomSettings = async (
    settings: Partial<RoomSettings>
  ) => {
    setSettingsError(null);
    const result = await updateRoomSettings(room.id, settings);
    if (!result.success) {
      setSettingsError(result.message ?? "Could not update room settings");
      return;
    }
    setShowSettings(false);
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-[1400px] h-[90vh] p-0 bg-gradient-to-b from-gray-900 to-gray-950 border-gray-800/50 rounded-xl overflow-hidden [&>button]:hidden flex flex-col">
        <DialogTitle className="sr-only">{room.name} - Game Room</DialogTitle>
        <DialogDescription id="room-description" className="sr-only">
          Game room with {connectedPlayers} out of {room.seats.length} players.
        </DialogDescription>

        {/* Top Bar */}
        <div className="relative h-16 sm:h-20 px-4 sm:px-8 flex items-center justify-between border-b border-gray-800/50 flex-shrink-0">
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/5 via-purple-500/5 to-pink-500/5" />

          <div className="relative flex items-center gap-3 md:gap-6">
            <div>
              <div className="flex items-center gap-2 md:gap-3 mb-1">
                <h2 className="text-xl md:text-2xl font-bold text-white">
                  {room.name}
                </h2>
                {room.settings.isPrivate && (
                  <Badge
                    variant="outline"
                    className="hidden md:inline-flex border-indigo-500/30 text-indigo-400"
                  >
                    Private Room
                  </Badge>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-2 md:gap-3">
                <div className="flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-gray-500" />
                  <span className="text-sm text-gray-400">
                    {connectedPlayers}/{room.seats.length} Players
                  </span>
                </div>
                <Badge
                  className={`${
                    room.status.type === GameStatusType.WAITING
                      ? "bg-purple-500/10 text-purple-400 border-purple-500/20"
                      : "bg-green-500/10 text-green-400 border-green-500/20"
                  }`}
                >
                  {room.status.type === GameStatusType.WAITING
                    ? "Lobby"
                    : "Playing"}
                </Badge>
                {room.status.type !== GameStatusType.WAITING && (
                  <Badge className="bg-purple-500/10 text-purple-400 border-purple-500/20 flex items-center gap-1">
                    <Timer className="w-3 h-3" />
                    {elapsedTime}
                  </Badge>
                )}
                <Badge className="bg-gray-800 text-gray-300 border-gray-700">
                  {getMapName(room.settings.mapId)}
                </Badge>
                <Badge className="bg-gray-800 text-gray-300 border-gray-700">
                  {getMatchModeName(room.settings.tournamentMode)}
                </Badge>
                <Badge className="bg-gray-800 text-gray-300 border-gray-700">
                  {getPowerupPresetName(room.settings.powerupPreset)}
                </Badge>
                <Badge className="bg-gray-800 text-gray-300 border-gray-700">
                  First to {room.settings.maxWins}
                </Badge>
              </div>
            </div>
          </div>

          <div className="relative flex items-center gap-2">
            {isHost && room.status.type === GameStatusType.WAITING && (
              <Button
                variant="ghost"
                className="hidden md:inline-flex text-gray-400 hover:text-white gap-2"
                onClick={() => setShowSettings(true)}
              >
                <Settings className="w-4 h-4" />
                Settings
              </Button>
            )}
            {room.settings.isPrivate && (
              <Button
                variant="ghost"
                className="hidden md:inline-flex text-gray-400 hover:text-white gap-2"
                onClick={() => navigator.clipboard.writeText(room.id)}
              >
                <Share2 className="w-4 h-4" />
                Share
              </Button>
            )}
            {isHost && room.status.type === GameStatusType.WAITING && (
              <Button
                variant="ghost"
                className="md:hidden text-gray-400 hover:text-white"
                onClick={() => setShowSettings(true)}
              >
                <Settings className="w-4 h-4" />
              </Button>
            )}
            <Button
              variant="ghost"
              className="md:hidden text-gray-400 hover:text-white"
              onClick={() => setShowChat(!showChat)}
            >
              <MessageCircle className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              className="text-gray-400 hover:text-white"
              onClick={onClose}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <div className="flex flex-1 min-h-0 overflow-hidden">
          {/* Main Game Area */}
          <div
            className={`flex-1 flex flex-col overflow-y-auto ${
              showChat ? "hidden sm:flex" : "flex"
            }`}
          >
            <div className="flex-1 p-4 sm:p-8 flex flex-col min-h-0">
              {/* Virtual Game Table */}
              <div className="relative aspect-square w-full max-w-xl sm:max-w-2xl mx-auto flex-shrink-0">
                {/* Center Table Design */}
                <div className="absolute inset-[20%] rounded-full bg-gradient-to-br from-gray-800/50 to-gray-900/50 border border-gray-700/30 backdrop-blur-sm flex items-center justify-center">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border border-indigo-500/20 flex items-center justify-center">
                    <Gamepad2 className="w-6 h-6 sm:w-8 sm:h-8 text-indigo-500/60" />
                  </div>
                </div>

                {/* Player Slots */}
                {room.seats.map((seat, index) => {
                  const startAngle = -90;
                  const angleOffset = index * (360 / room.seats.length);
                  const adjustedAngle =
                    index < room.seats.length / 2
                      ? startAngle + angleOffset
                      : startAngle + angleOffset + 30;
                  const angle = adjustedAngle * (Math.PI / 180);
                  const radius = index < room.seats.length / 2 ? 42 : 44;
                  const left = 50 + Math.cos(angle) * radius;
                  const top = 50 + Math.sin(angle) * radius;

                  return (
                    <div
                      key={index}
                      className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer"
                      style={{
                        left: `${left}%`,
                        top: `${top}%`,
                      }}
                      onClick={() => {
                        if (seat.actor) return;
                        if (isHost) {
                          handleAddBot(index);
                        } else {
                          handleJoinRoom(index);
                        }
                      }}
                    >
                      <PlayerAvatar
                        seat={seat}
                        isHost={getSeatActorId(seat) === room.hostId}
                        isCurrentUser={getSeatActorId(seat) === user.id}
                        canManageBots={
                          isHost && room.status.type === GameStatusType.WAITING
                        }
                        onRemoveBot={handleRemoveBot}
                        onUpdateBotDifficulty={handleUpdateBotDifficulty}
                        onUpdateBotName={handleUpdateBotName}
                      />
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Action Bar */}
            <div className="flex-shrink-0 p-4 sm:p-8 pt-0">
              <div className="inline-flex flex-wrap items-center justify-center gap-2 sm:gap-3 backdrop-blur-sm border border-gray-800/50 p-1.5 sm:p-2 rounded-2xl mx-auto">
                {isHost ? (
                  <Button
                    className={`px-4 md:px-8 h-10 md:h-12 rounded-full gap-2 transition-all duration-300 ${
                      canStartGame
                        ? "bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
                        : "bg-gray-800 text-gray-400"
                    }`}
                    onClick={() => startGame()}
                    disabled={!canStartGame}
                  >
                    <Swords className="w-4 h-4" />
                    <span className="hidden md:inline">Start Game</span>
                    <span className="md:hidden">Start</span>
                  </Button>
                ) : (
                  <>
                    {isCurrentRoom ? (
                      <>
                        <Button
                          className={`px-4 md:px-8 h-10 md:h-12 rounded-full gap-2 transition-all duration-300
                            ${
                              isReady
                                ? "bg-gray-800 text-gray-300 hover:bg-gray-700"
                                : "bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600"
                            }`}
                          onClick={handleReadyToggle}
                        >
                          <Sparkles className="w-4 h-4" />
                          <span className="hidden md:inline">
                            {isReady ? "Ready!" : "Ready Up"}
                          </span>
                          <span className="md:hidden">Ready</span>
                        </Button>
                        <Button
                          variant="outline"
                          className="h-10 md:h-12 rounded-full border-red-500/30 text-red-400 hover:bg-red-500/10 hover:text-red-300"
                          onClick={handleLeaveRoom}
                        >
                          <span className="hidden md:inline">Leave Room</span>
                          <span className="md:hidden">Leave</span>
                        </Button>
                      </>
                    ) : (
                      <Button
                        className="px-4 md:px-8 h-10 md:h-12 rounded-full gap-2 bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600"
                        onClick={() => {
                          const firstEmptySeat = room.seats.findIndex(
                            (seat) => !seat.actor
                          );
                          if (firstEmptySeat !== -1) {
                            handleJoinRoom(firstEmptySeat);
                          }
                        }}
                        disabled={room.seats.every(isOccupiedSeat)}
                      >
                        <Users className="w-4 h-4" />
                        <span className="hidden md:inline">Join Game</span>
                        <span className="md:hidden">Join</span>
                      </Button>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Chat Panel */}
          <div
            className={`w-full sm:w-[400px] border-l border-gray-800/50 bg-gray-900/30 flex flex-col ${
              showChat ? "flex sm:flex" : "hidden md:flex"
            }`}
          >
            <div className="p-3 md:p-4 border-b border-gray-800/50 flex justify-between items-center">
              <div className="flex items-center gap-2 text-gray-400">
                <MessageSquare className="w-4 h-4" />
                <span className="font-medium">Room Chat</span>
              </div>
              <Button
                variant="ghost"
                className="md:hidden text-gray-400 hover:text-white -mr-2"
                onClick={() => setShowChat(false)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            <div className="flex-1 overflow-hidden">
              <ChatSession
                currentUser={user}
                currentRoom={
                  user.position?.roomId === room.id ? room : undefined
                }
              />
            </div>
          </div>
        </div>

        <Dialog open={showSettings} onOpenChange={setShowSettings}>
          <DialogContent className="bg-gray-950 border-gray-800 text-gray-100 sm:max-w-md">
            <RoomSettingsForm
              description="Changes apply to the next game start."
              error={settingsError}
              initialSettings={room.settings}
              minPlayers={connectedPlayers}
              submitLabel="Save Settings"
              title="Edit Room Settings"
              onSubmit={handleUpdateRoomSettings}
            />
          </DialogContent>
        </Dialog>
      </DialogContent>
    </Dialog>
  );
};
