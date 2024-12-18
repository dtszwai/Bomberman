import { useState } from "react";
import { useLobby } from "../../hooks/useLobby";
import styles from "./Lobby.module.css";
import Room from "../Room";
import Toast from "../Toast";
import ConnectionStatus from "../ConnectionStatus";

interface ToastMessage {
  message: string;
  type: "success" | "error" | "info";
}

interface LobbyProps {
  onStartLocalGame: () => void;
}

const Lobby = ({ onStartLocalGame }: LobbyProps) => {
  const { state, joinRoom, createRoom, leaveRoom, startGame } = useLobby();
  const { rooms, players, currentPlayer, isConnected, reconnectAttempts } =
    state;
  const [toast, setToast] = useState<ToastMessage | null>(null);

  const showToast = (
    message: string,
    type: "success" | "error" | "info" = "error"
  ) => {
    setToast({ message, type });
  };

  const handleJoinRoom = async (roomId: string, seat: number) => {
    try {
      await joinRoom({ roomId, seat });
      showToast("Successfully joined the room", "success");
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Failed to join room");
    }
  };

  const handleCreateRoom = async () => {
    try {
      await createRoom({ name: `Room ${Object.keys(rooms).length + 1}` });
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

  return (
    <div className={styles.lobby}>
      <ConnectionStatus
        isConnected={isConnected}
        reconnectAttempts={reconnectAttempts}
      />
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
              currentPlayer={currentPlayer}
              handleJoinRoom={handleJoinRoom}
              handleLeaveRoom={handleLeaveRoom}
              handleStartGame={handleStartGame}
            />
          ))}
        </div>
        <div className={styles.sidebar}>
          <h2>Players Online: {Object.keys(players).length}</h2>
          <div className={styles.playersList}>
            {Object.values(players).map((player) => (
              <div key={player.id} className={styles.playerItem}>
                <span className={styles.playerName}>{player.id}</span>
                <span className={styles.playerStatus}>
                  {!player.roomId
                    ? "In Lobby"
                    : player.roomId && rooms[player.roomId]?.started
                    ? "In Game"
                    : "In Room"}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Lobby;
