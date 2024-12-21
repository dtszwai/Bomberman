import styles from "./Room.module.css";
import Timer from "./Timer";
import { AnyRoomState, GameStatus, UserState } from "@/server/types";

interface RoomProps {
  room: AnyRoomState;
  currentUser: UserState | null;
  handleJoinRoom: (roomId: string, seat: number) => void;
  handleLeaveRoom: () => void;
  handleStartGame: () => void;
  handleReady: () => void;
}

interface UserSeatProps {
  user: UserState;
  isHost: boolean;
  isCurrentUser: boolean;
  isReady: boolean;
}

const Room = ({
  room,
  currentUser,
  handleJoinRoom,
  handleLeaveRoom,
  handleStartGame,
  handleReady,
}: RoomProps) => {
  const isUserInRoom = currentUser?.position?.roomId === room.id;
  const isHost = room.hostId === currentUser?.id;
  const canStartGame =
    isHost && room.seats.filter((seat) => seat.user).length > 1;
  const gameStarted =
    room.type === "game" && room.gameStatus !== GameStatus.WAITING;
  const currentUserSeat = room.seats.find(
    (seat) => seat.user?.id === currentUser?.id
  );
  const allUsersReady = room.seats.every(
    (seat) => !seat.user || seat.ready || seat.user.id === room.hostId
  );

  // Organize users into positions
  const positions = room.seats.map((seat) => seat.user);
  const [top, right, bottom, left] = positions;

  const handleSeatClick = (position: number) => {
    if (positions[position] || isUserInRoom || gameStarted) {
      return;
    }
    handleJoinRoom(room.id, position);
  };

  return (
    <div
      className={`${styles.room} ${isUserInRoom ? styles.currentRoom : ""}`}
      data-started={gameStarted}
    >
      <div className={styles.roomInfo}>
        <span className={styles.roomName}>{room.name}</span>
        {gameStarted && (
          <div className={styles.gameStatus}>
            <span className={styles.gameStarted}>Game in Progress</span>
            {room.startTime && <Timer startTime={room.startTime} />}
          </div>
        )}
      </div>

      <div className={styles.tableContainer}>
        {/* Top user */}
        <div
          className={styles.userTop}
          onClick={() => handleSeatClick(0)}
          role="button"
          tabIndex={0}
        >
          {top ? (
            <UserSeat
              user={top}
              isHost={room.hostId === top.id}
              isCurrentUser={top.id === currentUser?.id}
              isReady={room.seats[0].ready}
            />
          ) : (
            <EmptySeat />
          )}
        </div>

        <div className={styles.middleRow}>
          {/* Left user */}
          <div
            className={styles.userLeft}
            onClick={() => handleSeatClick(3)}
            role="button"
            tabIndex={0}
          >
            {left ? (
              <UserSeat
                user={left}
                isHost={room.hostId === left.id}
                isCurrentUser={left.id === currentUser?.id}
                isReady={room.seats[3].ready}
              />
            ) : (
              <EmptySeat />
            )}
          </div>

          <div className={styles.table}>{gameStarted ? "🎮" : "💣"}</div>

          {/* Right user */}
          <div
            className={styles.userRight}
            onClick={() => handleSeatClick(1)}
            role="button"
            tabIndex={0}
          >
            {right ? (
              <UserSeat
                user={right}
                isHost={room.hostId === right.id}
                isCurrentUser={right.id === currentUser?.id}
                isReady={room.seats[1].ready}
              />
            ) : (
              <EmptySeat />
            )}
          </div>
        </div>

        {/* Bottom user */}
        <div
          className={styles.userBottom}
          onClick={() => handleSeatClick(2)}
          role="button"
          tabIndex={0}
        >
          {bottom ? (
            <UserSeat
              user={bottom}
              isHost={room.hostId === bottom.id}
              isCurrentUser={bottom.id === currentUser?.id}
              isReady={room.seats[2].ready}
            />
          ) : (
            <EmptySeat />
          )}
        </div>
      </div>

      {isUserInRoom && (
        <div className={styles.roomActions}>
          <button className={styles.leaveButton} onClick={handleLeaveRoom}>
            Leave Room
          </button>
          {!isHost && !gameStarted && (
            <button
              className={styles.readyButton}
              onClick={handleReady}
              data-ready={currentUserSeat?.ready}
              disabled={gameStarted}
            >
              {currentUserSeat?.ready ? (
                <>
                  <span className={styles.readyIcon}>✓</span>
                  Ready
                </>
              ) : (
                <>
                  <span className={styles.readyIcon}>!</span>
                  Click to Ready
                </>
              )}
            </button>
          )}
          {canStartGame && (
            <button
              className={styles.startButton}
              onClick={handleStartGame}
              disabled={!allUsersReady}
            >
              Start Game
            </button>
          )}
        </div>
      )}
    </div>
  );
};

const UserSeat = ({ user, isHost, isCurrentUser, isReady }: UserSeatProps) => (
  <div
    className={`${styles.seat} ${isCurrentUser ? styles.currentuser : ""}`}
    data-ready={isReady}
  >
    <div className={styles.userAvatar}>
      <span className={styles.userName}>{user.name || "User"}</span>
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
