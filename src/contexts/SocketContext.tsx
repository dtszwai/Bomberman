import {
  BidirectionalEvent,
  ClientPayloads,
  Events,
  ServerPayloads,
} from "@/events";
import { createContext, useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";

interface SocketContextValue {
  socket: Socket | null;
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

  useEffect(() => {
    const newSocket = io(SOCKET_URL, {
      autoConnect: true,
      auth: {
        userId: localStorage.getItem("userId"),
        userName: localStorage.getItem("userName"),
      },
    });

    newSocket.on("connect", () => setConnected(true));
    newSocket.on("disconnect", () => setConnected(false));
    newSocket.on("connect_error", (err) => setError(err));

    newSocket.on(
      Events.USER_STATE,
      (response: ServerPayloads["user:state"]) => {
        if (response) {
          localStorage.setItem("userId", response.id);
          localStorage.setItem("userName", response.name);
        }
      }
    );

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
    <SocketContext value={{ socket, connected, error, emit }}>
      {children}
    </SocketContext>
  );
};

export { SocketContext, SocketProvider };
