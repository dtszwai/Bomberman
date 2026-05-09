import { BotDifficulty, GameStatusType, RoomState } from "@/types";
import { Card, CardContent } from "../ui/card";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";
import {
  CheckCircle2,
  DoorOpen,
  Gamepad,
  PlayCircle,
  Timer,
} from "lucide-react";
import { useRoom } from "@/hooks/useRoom";
import { useGame } from "@arcade/games-bomberman/ui";
import { PlayerSlot } from "./PlayerSlot";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { useEffect, useState } from "react";
import { useSocket } from "@/hooks/useSocket";
import { formatTime } from "@/lib/utils";
import {
  isHumanSeat,
  isOccupiedSeat,
  getSeatActorId,
} from "@/lib/roomActors";
import {
  getMapName,
  getMatchModeName,
  getPowerupPresetName,
} from "@/lib/bombermanSettings";

interface RoomCardProps {
  room: RoomState;
  onRoomClick?: (roomId: string) => void;
}

export const RoomCard = ({ room, onRoomClick }: RoomCardProps) => {
  const { me: currentUser } = useSocket();
  const {
    joinRoom,
    leaveRoom,
    toggleReady: setReady,
    addBot,
    removeBot,
    updateBot,
  } = useRoom();
  const { start: startGame } = useGame();
  const isCurrentRoom = currentUser.position?.roomId === room.id;
  const isHost = isCurrentRoom && room.hostId === currentUser.id;
  const [elapsedTime, setElapsedTime] = useState<string>(
    formatTime(Date.now() - (room.startTime ?? Date.now()))
  );

  // Find current user's seat to check ready status
  const currentUserSeat = room.seats.find(
    (seat) =>
      seat.actor?.kind === "human" && seat.actor.user.id === currentUser.id
  );
  const isReady = currentUserSeat?.ready;
  const connectedPlayers = room.seats.filter(isOccupiedSeat).length;
  const canStartGame =
    connectedPlayers >= 2 &&
    room.seats.some(isHumanSeat) &&
    room.seats
      .filter(
        (seat) =>
          seat.actor?.kind === "human" && seat.actor.user.id !== room.hostId
      )
      .every((seat) => seat.ready);

  // Game timer logic
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
  }, [room.status.type, room.startTime]);

  const handleJoinRoom = (e: React.MouseEvent, seatIndex?: number) => {
    e.stopPropagation();
    if (seatIndex !== undefined) {
      joinRoom(room.id, seatIndex);
      return;
    }
    const firstEmptySeat = room.seats.findIndex((seat) => !seat.actor);
    if (firstEmptySeat !== -1) {
      joinRoom(room.id, firstEmptySeat);
    } else {
      throw new Error("Room is full");
    }
  };

  const handleLeaveRoom = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isCurrentRoom) {
      leaveRoom();
    }
  };

  const handleReadyToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isCurrentRoom) {
      setReady();
    }
  };

  const handleStartGame = (e: React.MouseEvent) => {
    e.stopPropagation();
    startGame();
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

  return (
    <Card
      className={`w-full bg-gray-800/50 border-gray-700 transition-all duration-300
        ${
          isCurrentRoom
            ? "ring-2 ring-blue-500/50"
            : "opacity-75 hover:opacity-100"
        }`}
      onClick={() => onRoomClick?.(room.id)}
    >
      <CardContent className="p-2 sm:p-4">
        {/* Room Header */}
        <div className="flex flex-col gap-1 mb-2 sm:mb-4">
          <div className="flex items-start justify-between">
            <h3 className="font-semibold text-base sm:text-lg text-gray-200 truncate">
              {room.name}
            </h3>
            <Badge
              className={`text-xs whitespace-nowrap ml-2 shrink-0 ${
                room.status.type === GameStatusType.WAITING
                  ? "bg-purple-600/50"
                  : "bg-green-600/50"
              }`}
            >
              {room.status.type === GameStatusType.WAITING
                ? "Open"
                : "In Progress"}
            </Badge>
          </div>
          <div className="flex flex-wrap items-center gap-1">
            <Badge className="bg-gray-700 text-xs">
              {getMapName(room.settings.mapId)}
            </Badge>
            <Badge className="bg-gray-700 text-xs">
              {getMatchModeName(room.settings.tournamentMode)}
            </Badge>
            <Badge className="bg-gray-700 text-xs">
              {getPowerupPresetName(room.settings.powerupPreset)}
            </Badge>
            <Badge className="bg-gray-700 text-xs">
              First to {room.settings.maxWins}
            </Badge>
            <Badge className="bg-blue-600/50 text-xs">
              {room.settings.isPrivate ? "Private" : "Public"}
            </Badge>
            {room.status.type !== GameStatusType.WAITING && (
              <Tooltip delayDuration={200}>
                <TooltipTrigger asChild>
                  <Badge className="bg-purple-600/50 text-xs flex items-center gap-1 cursor-help">
                    <Timer className="w-3 h-3" />
                    {elapsedTime}
                  </Badge>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Game running time</p>
                </TooltipContent>
              </Tooltip>
            )}
          </div>
        </div>

        {/* Game Table */}
        <div className="relative w-full aspect-square mb-2 sm:mb-4 bg-gray-800 rounded-lg max-h-32 sm:max-h-40">
          {/* Center Table */}
          <div className="absolute inset-1/4 bg-gray-700 rounded-lg border border-gray-600 flex items-center justify-center">
            <Gamepad className="w-4 h-4 sm:w-6 sm:h-6 text-white" />
          </div>

          {/* Player Slots */}
          {room.seats.map((seat, index) => (
            <PlayerSlot
              key={index}
              seat={seat}
              onSeatClick={(seatIndex) =>
                handleJoinRoom(
                  new MouseEvent("click") as unknown as React.MouseEvent,
                  seatIndex
                )
              }
              isHost={getSeatActorId(seat) === room.hostId}
              isCurrentUser={getSeatActorId(seat) === currentUser.id}
              canManageBots={
                isHost && room.status.type === GameStatusType.WAITING
              }
              onAddBot={handleAddBot}
              onRemoveBot={handleRemoveBot}
              onUpdateBotDifficulty={handleUpdateBotDifficulty}
              onUpdateBotName={handleUpdateBotName}
            />
          ))}
        </div>

        {/* Room Actions */}
        <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
          {isCurrentRoom ? (
            <>
              {isHost ? (
                <Button
                  className="bg-green-600 hover:bg-green-700 flex-1 h-8 text-xs"
                  disabled={!canStartGame}
                  onClick={handleStartGame}
                >
                  <PlayCircle className="w-3 h-3 mr-1" />
                  <span className="hidden sm:inline">Start Game</span>
                  <span className="sm:hidden">Start</span>
                </Button>
              ) : (
                <Button
                  className={`flex-1 h-8 text-xs ${
                    isReady
                      ? "bg-gray-600 hover:bg-gray-700"
                      : "bg-green-600 hover:bg-green-700"
                  }`}
                  onClick={handleReadyToggle}
                >
                  <CheckCircle2
                    className={`w-3 h-3 mr-1 ${
                      isReady ? "text-green-400" : "text-white"
                    }`}
                  />
                  {isReady ? "Ready!" : "Ready"}
                </Button>
              )}
              <Button
                variant="outline"
                className="border-red-600 text-red-500 hover:bg-red-600 hover:text-white h-8 px-2"
                onClick={handleLeaveRoom}
              >
                <DoorOpen className="w-3 h-3" />
              </Button>
            </>
          ) : (
            <Button
              className="bg-blue-600 hover:bg-blue-700 w-full h-8 text-xs"
              onClick={(e) => handleJoinRoom(e)}
              disabled={room.seats.every(isOccupiedSeat)}
            >
              Join Room
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
