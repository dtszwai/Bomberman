import { useLobby } from "@/hooks/useLobby";
import { RoomModal } from "../Room/RoomModal";
import { useLobbyState } from "@/hooks/useLobbyState";
import { Header } from "../layout/header";
import { RoomGrid } from "../Room";
import { ChatSession } from "../chat";
import { PlayerDrawer } from "../Player";
import { MessageSquare, X } from "lucide-react";
import { useState } from "react";

export const Lobby = () => {
  const { lobbyState, me: user } = useLobby();
  const {
    isDrawerOpen,
    selectedRoom,
    selectedUser,
    handleCreateRoom,
    handleRoomClick,
    handleDrawerOpen,
    handleDrawerClose,
    handleUserSelect,
    handleRoomClose,
  } = useLobbyState();

  const [isChatVisible, setIsChatVisible] = useState(false);

  const toggleChat = () => {
    setIsChatVisible(!isChatVisible);
  };

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <Header
        onlineCount={Object.keys(lobbyState.users).length}
        roomsCount={Object.keys(lobbyState.rooms).length}
        onCreateRoom={handleCreateRoom}
        onOpenPlayerList={handleDrawerOpen}
      />

      <main className="flex-1 container mx-auto p-2 lg:p-4 overflow-hidden">
        <div className="relative h-full min-h-0">
          {/* Mobile Chat Toggle Button */}
          <button
            onClick={toggleChat}
            className="fixed bottom-4 right-4 z-50 lg:hidden bg-blue-500 text-white p-3 rounded-full shadow-lg"
          >
            {isChatVisible ? <X size={24} /> : <MessageSquare size={24} />}
          </button>

          {/* Desktop Layout */}
          <div className="hidden lg:grid lg:grid-cols-4 gap-4 h-full min-h-0">
            <section className="col-span-3 overflow-auto rounded-xl">
              <RoomGrid
                rooms={Object.values(lobbyState.rooms)}
                onRoomClick={handleRoomClick}
              />
            </section>

            <aside className="h-full min-h-0">
              <ChatSession
                currentUser={user}
                currentRoom={
                  user.position?.roomId
                    ? lobbyState.rooms[user.position.roomId]
                    : undefined
                }
                selectedUser={selectedUser}
                onSelectUser={handleUserSelect}
              />
            </aside>
          </div>

          {/* Mobile Layout */}
          <div className="block lg:hidden h-full">
            <div
              className={`absolute inset-0 transition-transform duration-300 ${
                isChatVisible ? "translate-x-0" : "-translate-x-0"
              }`}
            >
              <div className="h-full overflow-auto rounded-xl">
                <RoomGrid
                  rooms={Object.values(lobbyState.rooms)}
                  onRoomClick={handleRoomClick}
                />
              </div>
            </div>

            {/* Mobile Chat Overlay */}
            <div
              className={`absolute inset-0 bg-gray-900 transition-all duration-300 ${
                isChatVisible
                  ? "opacity-100 translate-x-0"
                  : "opacity-0 translate-x-full pointer-events-none"
              }`}
            >
              <div className="h-full">
                <ChatSession
                  currentUser={user}
                  currentRoom={
                    user.position?.roomId
                      ? lobbyState.rooms[user.position.roomId]
                      : undefined
                  }
                  selectedUser={selectedUser}
                  onSelectUser={handleUserSelect}
                />
              </div>
            </div>
          </div>
        </div>
      </main>

      <PlayerDrawer
        isOpen={isDrawerOpen}
        onClose={handleDrawerClose}
        players={Object.values(lobbyState.users)}
        onSelectUser={(user) => {
          handleUserSelect(user);
          // Open chat when selecting a user on mobile
          if (window.innerWidth < 1024) {
            setIsChatVisible(true);
          }
        }}
      />

      {selectedRoom && (
        <RoomModal
          user={user}
          room={lobbyState.rooms[selectedRoom.id]}
          onClose={handleRoomClose}
        />
      )}
    </div>
  );
};

export default Lobby;
