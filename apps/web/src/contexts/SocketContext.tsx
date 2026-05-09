import { ClientPayloads, Events, ServerPayloads } from "@arcade/games-bomberman/sim";
import { OperationResult, UserState } from "@/types";
import { createTypedEmit, type TypedEmit } from "@arcade/transport/client";
import {
  createContext,
  useEffect,
  useState,
  useCallback,
  useMemo,
} from "react";
import { io, Socket } from "socket.io-client";

interface SocketContextValue {
  socket: Socket | null;
  me: UserState;
  connected: boolean;
  connecting: boolean;
  error: Error | null;
  emit: TypedEmit<ClientPayloads, ServerPayloads>;
  reconnect: () => void;
  updateProfile: (profile: {
    name?: string;
    avatarColor?: string;
  }) => Promise<OperationResult<UserState>>;
}

const SocketContext = createContext<SocketContextValue | null>(null);

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || "ws://localhost:3000";

const SocketProvider = ({ children }: { children: React.ReactNode }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const [connecting, setConnecting] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [me, setMe] = useState<UserState>(() => {
    return {
      id: localStorage.getItem("userId") || "",
      name: localStorage.getItem("userName") || "",
      avatarColor: localStorage.getItem("avatarColor") || "#22c55e",
    } as UserState;
  });

  // Socket initialization logic
  const initializeSocket = useCallback(() => {
    try {
      setConnecting(true);
      setError(null);

      const newSocket = io(SOCKET_URL, {
        autoConnect: true,
        auth: {
          userId: localStorage.getItem("userId"),
          userName: localStorage.getItem("userName"),
          avatarColor: localStorage.getItem("avatarColor"),
        },
      });

      // Connection event handlers
      newSocket.on("connect", () => {
        setConnected(true);
        setConnecting(false);
        setError(null);
      });

      newSocket.on(Events.USER_STATE, (user: ServerPayloads["user:state"]) => {
        localStorage.setItem("userId", user.id);
        localStorage.setItem("userName", user.name);
        localStorage.setItem("avatarColor", user.avatarColor);
        setMe(user);
      });

      newSocket.on("disconnect", () => {
        setConnected(false);
        setConnecting(false);
      });

      newSocket.on("connect_error", (err) => {
        setError(err);
        setConnecting(false);
      });

      setSocket(newSocket);

      return newSocket;
    } catch (error) {
      const errorInstance =
        error instanceof Error
          ? error
          : new Error("Failed to initialize socket connection");

      setError(errorInstance);
      setConnecting(false);
      setConnected(false);
      return null;
    }
  }, []);

  useEffect(() => {
    const currentSocket = initializeSocket();

    return () => {
      if (currentSocket) {
        currentSocket.close();
      }
    };
  }, [initializeSocket]);

  const emit = useMemo(
    () => createTypedEmit<ClientPayloads, ServerPayloads>(socket),
    [socket]
  );

  const contextValue = useMemo(
    () => ({
      socket,
      connected,
      connecting,
      error,
      emit,
      me,
      reconnect: initializeSocket,
      updateProfile: (profile: { name?: string; avatarColor?: string }) =>
        emit(Events.UPDATE_PROFILE, profile),
    }),
    [socket, connected, connecting, error, emit, me, initializeSocket]
  );

  return (
    <SocketContext.Provider value={contextValue}>
      {children}
    </SocketContext.Provider>
  );
};

export { SocketContext, SocketProvider };
