import { Events, ServerPayloads } from "../../sim/events";
import { GameEvent, GameSnapshot, GameState, RoundStartPayload } from "../../sim/types";
import {
  GameStatus,
  GameStatusType,
  OperationResult,
  RoomType,
  UserState,
} from "@arcade/protocol";
import type { GameRoomState, RoomState } from "@arcade/protocol";
import type { Socket } from "socket.io-client";
import type { ClientPayloads } from "../../sim/events";
import type { TypedEmit } from "@arcade/transport/client";
import { SnapshotBuffer } from "@arcade/netcode";
import { RefObject, createContext, useEffect, useRef, useState } from "react";

const SNAPSHOT_BUFFER_MAX = 6;

interface GameContextType {
  socket: Socket | null;
  status?: GameStatus;
  snapshotBufferRef: RefObject<SnapshotBuffer<GameSnapshot>>;
  /** Event buffer drained each frame by the controller. */
  eventsRef: RefObject<GameEvent[]>;
  /** Latest resync bundle. Controller consumes once on mount / on change. */
  resyncRef: RefObject<ServerPayloads["game:resync"] | undefined>;
  roundStart?: RoundStartPayload;
  state?: GameState;
  start: () => Promise<OperationResult>;
}

export const GameContext = createContext<GameContextType | null>(null);

interface GameProviderProps {
  socket: Socket | null;
  room?: RoomState<GameState>;
  me: UserState;
  emit: TypedEmit<ClientPayloads, ServerPayloads>;
  children: React.ReactNode;
}

export const GameProivder = ({
  socket,
  room,
  me,
  emit,
  children,
}: GameProviderProps) => {
  const [status, setStatus] = useState<GameStatus>();
  const [state, setState] = useState<GameState>();
  const snapshotBufferRef = useRef(
    new SnapshotBuffer<GameSnapshot>(SNAPSHOT_BUFFER_MAX)
  );
  const eventsRef = useRef<GameEvent[]>([]);
  const resyncRef = useRef<ServerPayloads["game:resync"] | undefined>(undefined);
  const [roundStart, setRoundStart] = useState<RoundStartPayload>();

  const start = async () => {
    if (
      !socket ||
      !room ||
      room.type !== RoomType.GAME ||
      (room as GameRoomState<GameState>).hostId !== me?.id ||
      (room as GameRoomState<GameState>).status.type !== GameStatusType.WAITING
    )
      return { success: false, message: "Invalid operation" };

    return emit(Events.START_GAME, null);
  };

  useEffect(() => {
    if (!socket || !room || room.type !== RoomType.GAME) return;
    const gameRoom = room as GameRoomState<GameState>;
    setStatus(gameRoom.status);
    setState(gameRoom.gameState);

    socket.on(
      Events.GAME_SNAPSHOT,
      (snapshot: ServerPayloads["game:snapshot"]) => {
        snapshotBufferRef.current.push(snapshot);
      }
    );
    socket.on(
      Events.ROUND_STARTED,
      (payload: ServerPayloads["game:roundStarted"]) => {
        snapshotBufferRef.current.clear();
        eventsRef.current.length = 0;
        resyncRef.current = undefined;
        setRoundStart(payload);
      }
    );
    socket.on(
      Events.GAME_RESYNC,
      (payload: ServerPayloads["game:resync"]) => {
        snapshotBufferRef.current.reset(payload.snapshot);
        eventsRef.current.length = 0;
        resyncRef.current = payload;
        setRoundStart(payload.roundStart);
      }
    );

    const pushEvent = (event: GameEvent) => eventsRef.current.push(event);
    socket.on(Events.BOMB_PLACED, (e: ServerPayloads["bomb:placed"]) =>
      pushEvent({ kind: "bomb:placed", ...e })
    );
    socket.on(Events.BOMB_EXPLODED, (e: ServerPayloads["bomb:exploded"]) =>
      pushEvent({ kind: "bomb:exploded", ...e })
    );
    socket.on(Events.BLOCK_DESTROYED, (e: ServerPayloads["block:destroyed"]) =>
      pushEvent({ kind: "block:destroyed", ...e })
    );
    socket.on(Events.POWERUP_SPAWNED, (e: ServerPayloads["powerup:spawned"]) =>
      pushEvent({ kind: "powerup:spawned", ...e })
    );
    socket.on(
      Events.POWERUP_COLLECTED,
      (e: ServerPayloads["powerup:collected"]) =>
        pushEvent({ kind: "powerup:collected", ...e })
    );
    socket.on(Events.PLAYER_DIED, (e: ServerPayloads["player:died"]) =>
      pushEvent({ kind: "player:died", ...e })
    );

    return () => {
      socket.off(Events.GAME_SNAPSHOT);
      socket.off(Events.ROUND_STARTED);
      socket.off(Events.GAME_RESYNC);
      socket.off(Events.BOMB_PLACED);
      socket.off(Events.BOMB_EXPLODED);
      socket.off(Events.BLOCK_DESTROYED);
      socket.off(Events.POWERUP_SPAWNED);
      socket.off(Events.POWERUP_COLLECTED);
      socket.off(Events.PLAYER_DIED);
    };
  }, [room, socket]);

  return (
    <GameContext
      value={{
        socket,
        status,
        state,
        snapshotBufferRef,
        eventsRef,
        resyncRef,
        roundStart,
        start,
      }}
    >
      {children}
    </GameContext>
  );
};
