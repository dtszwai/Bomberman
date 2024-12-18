import { Player, RoomState } from "@/server/types";
import styles from "./Room.module.css";
import Timer from "./Timer";

interface RoomProps {
  room: RoomState;
  currentPlayer: Player | null;
  handleJoinRoom: (roomId: string) => void;
  handleLeaveRoom: () => void;
  handleStartGame: () => void;
}

const Room = ({
  room,
  currentPlayer,
  handleJoinRoom,
  handleLeaveRoom,
  handleStartGame,
}: RoomProps) => {
  const isPlayerInRoom = currentPlayer?.roomId === room.id;
  const isHost = room.hostId === currentPlayer?.id;
  const canStartGame = isHost && room.players.length >= 2 && !room.started;

  // Organize players into positions
  const positions = Array(4).fill(null);
  room.players.forEach((player, index) => {
    positions[index] = player;
  });

  const [top, right, bottom, left] = positions;

  const handleSeatClick = (position: number) => {
    if (!room.started && !isPlayerInRoom && !positions[position]) {
      handleJoinRoom(room.id);
    }
  };

  return (
    <div
      className={`${styles.room} ${isPlayerInRoom ? styles.currentRoom : ""}`}
      data-started={room.started}
    >
      <div className={styles.roomInfo}>
        <span className={styles.roomName}>Room#{room.id}</span>
        {room.started && (
          <div className={styles.gameStatus}>
            <span className={styles.gameStarted}>Game in Progress</span>
            <Timer startTime={room.startTime || Date.now()} />
          </div>
        )}
      </div>

      <div className={styles.tableContainer}>
        {/* Top player */}
        <div
          className={styles.playerTop}
          onClick={() => handleSeatClick(0)}
          role="button"
          tabIndex={0}
        >
          {top ? (
            <PlayerSeat
              player={top}
              isHost={room.hostId === top.id}
              isCurrentPlayer={top.id === currentPlayer?.id}
            />
          ) : (
            <EmptySeat />
          )}
        </div>

        <div className={styles.middleRow}>
          {/* Left player */}
          <div
            className={styles.playerLeft}
            onClick={() => handleSeatClick(3)}
            role="button"
            tabIndex={0}
          >
            {left ? (
              <PlayerSeat
                player={left}
                isHost={room.hostId === left.id}
                isCurrentPlayer={left.id === currentPlayer?.id}
              />
            ) : (
              <EmptySeat />
            )}
          </div>

          <div className={styles.table}>{room.started ? "🎮" : "💣"}</div>

          {/* Right player */}
          <div
            className={styles.playerRight}
            onClick={() => handleSeatClick(1)}
            role="button"
            tabIndex={0}
          >
            {right ? (
              <PlayerSeat
                player={right}
                isHost={room.hostId === right.id}
                isCurrentPlayer={right.id === currentPlayer?.id}
              />
            ) : (
              <EmptySeat />
            )}
          </div>
        </div>

        {/* Bottom player */}
        <div
          className={styles.playerBottom}
          onClick={() => handleSeatClick(2)}
          role="button"
          tabIndex={0}
        >
          {bottom ? (
            <PlayerSeat
              player={bottom}
              isHost={room.hostId === bottom.id}
              isCurrentPlayer={bottom.id === currentPlayer?.id}
            />
          ) : (
            <EmptySeat />
          )}
        </div>
      </div>

      {isPlayerInRoom && (
        <div className={styles.roomActions}>
          <button className={styles.leaveButton} onClick={handleLeaveRoom}>
            Leave Room
          </button>
          {canStartGame && (
            <button className={styles.startButton} onClick={handleStartGame}>
              Start Game
            </button>
          )}
        </div>
      )}
    </div>
  );
};

interface PlayerSeatProps {
  player: Player;
  isHost: boolean;
  isCurrentPlayer: boolean;
}

const PlayerSeat = ({ player, isHost, isCurrentPlayer }: PlayerSeatProps) => (
  <div
    className={`${styles.seat} ${isCurrentPlayer ? styles.currentPlayer : ""}`}
  >
    <div className={styles.playerAvatar}>
      <span className={styles.playerName}>{player.id || "Player"}</span>
      {isHost && <span className={styles.hostBadge}>Host</span>}
    </div>
  </div>
);

const EmptySeat = () => (
  <div className={`${styles.seat} ${styles.emptySeat}`}>
    <div className={styles.emptyIcon}>+</div>
  </div>
);

export default Room;
