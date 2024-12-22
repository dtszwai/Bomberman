import { GameStatus, RoomState } from "@/server/types";
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
import { useGame } from "@/hooks/useGame";
import { PlayerSlot } from "./PlayerSlot";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { useEffect, useState } from "react";
import { useSocket } from "@/hooks/useSocket";
import { formatTime } from "@/lib/utils";

interface RoomCardProps {
  room: RoomState;
  onRoomClick?: (roomId: string) => void;
}

export const RoomCard = ({ room, onRoomClick }: RoomCardProps) => {
  const { me: currentUser } = useSocket();
  const { joinRoom, leaveRoom } = useRoom();
  const { setReady, startGame } = useGame();
  const isCurrentRoom = currentUser.position?.roomId === room.id;
  const isHost = isCurrentRoom && room.hostId === currentUser.id;
  const [elapsedTime, setElapsedTime] = useState<string>(
    formatTime(Date.now() - (room.startTime ?? Date.now()))
  );

  // Find current user's seat to check ready status
  const currentUserSeat = room.seats.find(
    (seat) => seat.user?.id === currentUser.id
  );
  const isReady = currentUserSeat?.ready;

  // Game timer logic
  useEffect(() => {
    if (
      room.gameStatus !== GameStatus.WAITING &&
      room.startTime !== undefined
    ) {
      const timer = setInterval(() => {
        setElapsedTime(formatTime(Date.now() - room.startTime!));
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [room.gameStatus, room.startTime]);

  const handleJoinRoom = (e: React.MouseEvent, seatIndex?: number) => {
    e.stopPropagation();
    if (seatIndex !== undefined) {
      joinRoom(room.id, seatIndex);
      return;
    }
    const firstEmptySeat = room.seats.findIndex((seat) => !seat.user);
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

  return (
    <Card
      className={`bg-gray-800/50 border-gray-700 transition-all duration-300
        ${
          isCurrentRoom
            ? "ring-2 ring-blue-500/50"
            : "opacity-75 hover:opacity-100"
        }`}
      onClick={() => onRoomClick?.(room.id)}
    >
      <CardContent className="p-4">
        {/* Room Header */}
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="font-semibold text-lg text-gray-200">{room.name}</h3>
            <div className="flex items-center gap-1 mt-0.5">
              <Badge className="bg-gray-700 text-xs">Classic</Badge>
              <Badge className="bg-blue-600/50 text-xs">
                {room.settings.isPrivate ? "Private" : "Public"}
              </Badge>
              {room.gameStatus !== GameStatus.WAITING && (
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
          <Badge
            className={`text-xs ${
              room.gameStatus === GameStatus.WAITING
                ? "bg-purple-600/50"
                : "bg-green-600/50"
            }`}
          >
            {room.gameStatus === GameStatus.WAITING ? "Open" : "In Progress"}
          </Badge>
        </div>

        {/* Game Table */}
        <div className="relative w-full aspect-square mb-4 bg-gray-800 rounded-lg max-h-40">
          {/* Center Table */}
          <div
            className="absolute inset-1/4 bg-gray-700 rounded-lg border border-gray-600 
                        flex items-center justify-center"
          >
            <Gamepad className="w-6 h-6 text-white" />
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
              isHost={seat?.user?.id === room.hostId}
              isCurrentUser={seat?.user?.id === currentUser.id}
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
                  disabled={
                    room.seats.filter((seat) => seat.user).length < 2 || // Less than 2 players
                    room.seats
                      .filter(
                        (seat) => seat.user && seat.user.id !== room.hostId
                      ) // Get all seated players except host
                      .some((seat) => !seat.ready) // Check if any non-host player is not ready
                  }
                  onClick={handleStartGame}
                >
                  <PlayCircle className="w-3 h-3 mr-1" />
                  Start Game
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
              disabled={room.seats.every((seat) => seat.user)}
            >
              Join Room
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
