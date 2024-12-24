import {
  BidirectionalEvent,
  ClientPayloads,
  Events,
  ServerPayloads,
} from "@/events";
import { UserState } from "@/server/types";
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
  emit: <E extends BidirectionalEvent>(
    event: E,
    arg: ClientPayloads[E] extends void ? undefined : ClientPayloads[E]
  ) => Promise<ServerPayloads[E]>;
  reconnect: () => void;
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

  const emit = useCallback<SocketContextValue["emit"]>(
    async (event, arg) => {
      if (!socket) {
        throw new Error("Socket is not connected");
      }

      return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error("Socket request timed out"));
        }, 10000); // 10 second timeout

        socket.emit(event, arg, (response: ServerPayloads[typeof event]) => {
          clearTimeout(timeout);
          if (response instanceof Error) {
            reject(response);
          } else {
            resolve(response);
          }
        });
      });
    },
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
