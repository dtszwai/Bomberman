import {
  BidirectionalEvent,
  ClientPayloads,
  Events,
  ServerPayloads,
} from "@/events";
import { UserState } from "@/server/types";
import { createContext, useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";

interface SocketContextValue {
  socket: Socket | null;
  me: UserState;
  connected: boolean;
  error: Error | null;
  emit: <E extends BidirectionalEvent>(
    event: E,
    arg: ClientPayloads[E] extends void ? undefined : ClientPayloads[E]
  ) => Promise<ServerPayloads[E]>;
}

const SocketContext = createContext<SocketContextValue | null>(null);

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || "ws://localhost:3000";

const SocketProvider = ({ children }: { children: React.ReactNode }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [me, setMe] = useState<UserState>({} as UserState);

  useEffect(() => {
    const newSocket = io(SOCKET_URL, {
      autoConnect: true,
      auth: {
        userId: localStorage.getItem("userId"),
        userName: localStorage.getItem("userName"),
      },
    });

    newSocket.on("connect", () => setConnected(true));
    newSocket.on(Events.USER_STATE, (user: ServerPayloads["user:state"]) => {
      localStorage.setItem("userId", user.id);
      localStorage.setItem("userName", user.name);
      setMe(user);
    });
    newSocket.on("disconnect", () => setConnected(false));
    newSocket.on("connect_error", (err) => setError(err));

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, []);

  const emit: SocketContextValue["emit"] = async (event, arg) => {
    if (!socket) {
      throw new Error("Socket is not connected");
    }

    return new Promise((resolve, reject) => {
      socket.emit(event, arg, (response: ServerPayloads[typeof event]) => {
        if (response instanceof Error) {
          reject(response);
        } else {
          resolve(response);
        }
      });
    });
  };

  return (
    <SocketContext value={{ socket, connected, error, emit, me }}>
      {children}
    </SocketContext>
  );
};

export { SocketContext, SocketProvider };
