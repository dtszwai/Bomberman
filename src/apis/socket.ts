import { io, Socket } from "socket.io-client";
import { Events, ServerEvents } from "@/events";

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || "ws://localhost:3000";

class SocketClient {
  private static instance: SocketClient;
  public socket: Socket;
  private userId: string | null = null;

  private constructor() {
    // Initialize socket with stored user data
    this.socket = io(SOCKET_URL, {
      autoConnect: false,
      auth: {
        userId: localStorage.getItem("userId"),
        userName: localStorage.getItem("userName"),
      },
    });

    this.setupEventHandlers();
  }

  public static getInstance(): SocketClient {
    if (!SocketClient.instance) {
      SocketClient.instance = new SocketClient();
    }
    return SocketClient.instance;
  }

  private setupEventHandlers() {
    // Handle WHOAMI events to sync user state
    this.socket.on(Events.WHOAMI, (response: ServerEvents["whoami"]) => {
      if (response) {
        this.userId = response.id;
        localStorage.setItem("userId", response.id);
        localStorage.setItem("userName", response.name);
      }
    });

    // Handle disconnection
    this.socket.on("disconnect", () => {
      // TODO: Notify user
      console.log(
        "Disconnected from server. Will attempt to reconnect with same identity."
      );
    });

    // Handle connection errors
    this.socket.on("connect_error", (error: Error) => {
      console.error("Connection error:", error.message);
    });
  }

  public connect() {
    setTimeout(() => {
      this.socket.connect();
    }, 100);
  }

  public disconnect() {
    this.socket.disconnect();
  }

  public getUserId(): string | null {
    return this.userId;
  }
}

// Create and export the singleton instance
const socketClient = SocketClient.getInstance();
export const socket = socketClient.socket;

// Connect to the server
socketClient.connect();
