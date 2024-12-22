import { useLobby } from "@/hooks/useLobby";
import { useState } from "react";
import { Header } from "./layout/Header";
import { RoomGrid, RoomModal } from "./Room";
import { PlayerDrawer } from "./Player";
import { ChatSession } from "./Chat/ChatSession";
import { RoomSettings, RoomState, UserState } from "@/server/types";

export const GameLobby = () => {
  const { lobbyState, createRoom, me: user } = useLobby();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState<RoomState>();
  const [selectedUser, setSelectedUser] = useState<UserState>();

  const handleCreateRoom = async (settings?: Partial<RoomSettings>) => {
    await createRoom(settings);
  };

  const handleRoomClick = (roomId: string) => {
    setSelectedRoom(lobbyState.rooms[roomId]);
  };

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 overflow-hidden">
      <Header
        onlineCount={Object.keys(lobbyState.users).length}
        roomsCount={Object.keys(lobbyState.rooms).length}
        onCreateRoom={handleCreateRoom}
        onOpenPlayerList={() => setIsDrawerOpen(true)}
      />

      <div className="flex-1 container mx-auto p-4 overflow-hidden">
        <div className="grid grid-cols-4 gap-4 h-full min-h-0">
          <div className="col-span-3 overflow-auto rounded-xl">
            <RoomGrid
              rooms={Object.values(lobbyState.rooms)}
              onRoomClick={handleRoomClick}
            />
          </div>
          <div className="h-full min-h-0">
            <ChatSession
              currentUser={user}
              currentRoom={
                user.position?.roomId
                  ? lobbyState.rooms[user.position.roomId]
                  : undefined
              }
              selectedUser={selectedUser}
              onSelectUser={setSelectedUser}
            />
          </div>
        </div>
      </div>

      <PlayerDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        players={Object.values(lobbyState.users)}
        onPlayerSelect={setSelectedUser}
      />

      {selectedRoom && (
        <RoomModal
          user={user}
          // trigger the re-render when the room state changes
          room={lobbyState.rooms[selectedRoom.id]}
          onClose={() => setSelectedRoom(undefined)}
        />
      )}
    </div>
  );
};

export default GameLobby;
