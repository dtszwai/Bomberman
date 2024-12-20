import { useState } from "react";
import { useLobby } from "../../hooks/useLobby";
import styles from "./Lobby.module.css";
import Room from "../Room";
import Toast from "../Toast";
import ConnectionStatus from "../ConnectionStatus";
import { GameStatus, UserState } from "@/server/types";

interface ToastMessage {
  message: string;
  type: "success" | "error" | "info";
}

interface LobbyProps {
  onStartLocalGame: () => void;
}

const Lobby = ({ onStartLocalGame }: LobbyProps) => {
  const { state, joinRoom, createRoom, leaveRoom, startGame, toggleReady } =
    useLobby();
  const { rooms, users, currentUser } = state;
  const [toast, setToast] = useState<ToastMessage | null>(null);

  const showToast = (
    message: string,
    type: "success" | "error" | "info" = "error"
  ) => {
    setToast({ message, type });
  };

  const handleJoinRoom = async (roomId: string, seat: number) => {
    try {
      await joinRoom({ roomId, seatIndex: seat });
      showToast("Successfully joined the room", "success");
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Failed to join room");
    }
  };

  const handleCreateRoom = async () => {
    try {
      await createRoom();
      showToast("Room created successfully", "success");
    } catch (error) {
      showToast(
        error instanceof Error ? error.message : "Failed to create room"
      );
    }
  };

  const handleLeaveRoom = async () => {
    try {
      await leaveRoom();
      showToast("Left the room", "info");
    } catch (error) {
      showToast(
        error instanceof Error ? error.message : "Failed to leave room"
      );
    }
  };

  const handleStartGame = async () => {
    try {
      await startGame();
      showToast("Game started!", "success");
    } catch (error) {
      showToast(
        error instanceof Error ? error.message : "Failed to start game"
      );
    }
  };

  const handleReady = async () => {
    try {
      console.log("Toggling ready status");
      await toggleReady();
    } catch (error) {
      showToast(
        error instanceof Error ? error.message : "Failed to toggle ready status"
      );
    }
  };

  const getUserStatus = (user: UserState) => {
    if (!user.position) return "In Lobby";
    const room = rooms[user.position.roomId];
    if (room.type === "game" && room.gameStatus !== GameStatus.WAITING) {
      return "In Game";
    }
    return "In Room";
  };

  return (
    <div className={styles.lobby}>
      <ConnectionStatus {...state} />
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
      <div className={styles.header}>
        <h1>Bomberman Lobby</h1>
        <div className={styles.headerButtons}>
          <button
            className={`${styles.createButton} ${styles.localPlayButton}`}
            onClick={onStartLocalGame}
          >
            Play Local
          </button>
          <button className={styles.createButton} onClick={handleCreateRoom}>
            Create Room
          </button>
        </div>
      </div>
      <div className={styles.content}>
        <div className={styles.roomsGrid}>
          {Object.values(rooms).map((room) => (
            <Room
              key={room.id}
              room={room}
              currentUser={currentUser}
              handleJoinRoom={handleJoinRoom}
              handleLeaveRoom={handleLeaveRoom}
              handleStartGame={handleStartGame}
              handleReady={handleReady}
            />
          ))}
        </div>
        <div className={styles.sidebar}>
          <h2>Users Online: {Object.keys(users).length}</h2>
          <div className={styles.usersList}>
            {Object.values(users).map((user) => (
              <div key={user.id} className={styles.userItem}>
                <span
                  className={styles.userName}
                  data-currentuser={currentUser?.id === user.id}
                >
                  {user.name}
                </span>
                <span className={styles.userStatus}>{getUserStatus(user)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Lobby;
