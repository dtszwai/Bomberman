import { createServer } from "http";
import { Server, Socket } from "socket.io";
import { ClientEvents, Events, ServerEvents } from "@/events";
import { logger } from "./utils/logger";
import { EventBroadcaster } from "./utils/EventBroadcaster";
import { User } from "./models/User";
import { GameRoom } from "./models/GameRoom";
import { GameStatus } from "./types";
import { LobbyMessage } from "./models/Message/LobbyMessage";
import { RoomMessage } from "./models/Message/RoomMessage";
import { PrivateMessage } from "./models/Message/PrivateMessage";

const Config = {
  CORS_ORIGIN: process.env.CORS_ORIGIN || "*",
  HOST: process.env.HOST || "0.0.0.0",
  PORT: Number(process.env.PORT) || 3000,
} as const;

class GameServer {
  private readonly httpServer;
  private readonly io: Server;
  private readonly emitter: EventBroadcaster;
  private readonly users: Map<string, User>;
  private readonly rooms: Map<string, GameRoom>;
  private readonly messages: LobbyMessage[];

  constructor() {
    this.httpServer = createServer((_, res) => {
      res.writeHead(200, { "Content-Type": "text/plain" });
      res.end("Socket.IO server is running");
    });
    this.io = new Server(this.httpServer, {
      cors: { origin: Config.CORS_ORIGIN },
    });

    this.users = new Map<string, User>();
    this.rooms = new Map<string, GameRoom>();
    this.messages = [];
    this.emitter = new EventBroadcaster(this.io, this.users, this.rooms);

    this.setupSocketConnection();
    this.setupErrorHandling();
    this.handleDisconnectedCleanup();
  }

  private setupSocketConnection() {
    this.io.on("connection", (socket) => {
      let user: User;
      const auth = socket.handshake.auth;

      try {
        if (auth.userId && this.users.has(auth.userId)) {
          // Retrieve existing user and update their socket ID
          user = this.users.get(auth.userId)!;
          user.updateSocketId(socket.id);
          user.updateActivity();
          logger.info(`User reconnected: ${user}`);
        } else {
          // Create new user with generated persistent ID
          const userName = auth.userName || undefined;
          user = new User(socket.id, userName);
          this.users.set(user.id, user);
          logger.info(`New user connected: ${user}`);
        }

        this.emitter.whoami(user);
        this.emitter.lobby();
        this.emitter.chatHistory(user, this.messages);
        this.setupEventListeners(socket, user);
      } catch (error) {
        logger.error(`Error during user connection: ${error}`);
        // Create new user as fallback
        user = new User(socket.id);
        this.users.set(user.id, user);
        this.emitter.whoami(user);
        this.setupEventListeners(socket, user);
      }
    });
  }

  private setupEventListeners(socket: Socket, user: User) {
    socket.on(
      Events.CREATE_ROOM,
      (
        settings: ClientEvents["createRoom"],
        callback: (result: ServerEvents["createRoom"]) => void
      ) => this.handleCreateRoom(socket, user, settings, callback)
    );

    socket.on(
      Events.JOIN_ROOM,
      (
        payload: ClientEvents["joinRoom"],
        callback: (result: ServerEvents["joinRoom"]) => void
      ) => this.handleJoinRoom(socket, user, payload, callback)
    );

    socket.on(
      Events.LEAVE_ROOM,
      (_, callback: (result: ServerEvents["leaveRoom"]) => void) =>
        this.handleLeaveRoom(socket, user, callback)
    );

    socket.on(
      Events.TOGGLE_READY,
      (_, callback: (result: ServerEvents["toggleReady"]) => void) =>
        this.handleToggleReady(user, callback)
    );

    socket.on(
      Events.START_GAME,
      (_, callback: (result: ServerEvents["startGame"]) => void) =>
        this.handleStartGame(user, callback)
    );

    socket.on(Events.USER_CONTROLS, (input: ClientEvents["userControls"]) =>
      this.handleUserInput(user, input)
    );

    socket.on(
      Events.LOBBY_STATE,
      (_, callback: (state: ServerEvents["lobbyState"]) => void) =>
        this.handleLobbyState(callback)
    );

    socket.on(
      Events.LOBBY_MESSAGE,
      (
        payload: ClientEvents["lobby:message"],
        callback: (result: ServerEvents["createMessage"]) => void
      ) => this.handleLobbyMessage(user, payload, callback)
    );

    socket.on(
      Events.ROOM_MESSAGE,
      (
        payload: ClientEvents["room:message"],
        callback: (result: ServerEvents["createMessage"]) => void
      ) => this.handleRoomMessage(user, payload, callback)
    );

    socket.on(
      Events.PRIVATE_MESSAGE,
      (
        payload: ClientEvents["user:message"],
        callback: (result: ServerEvents["createMessage"]) => void
      ) => this.handlePrivateMessage(user, payload, callback)
    );

    socket.on("disconnect", () => this.handleDisconnect(user));
  }

  private handleCreateRoom(
    socket: Socket,
    user: User,
    settings: ClientEvents["createRoom"] = {},
    callback: (result: ServerEvents["createRoom"]) => void
  ) {
    if (user.position) {
      const oldRoom = this.rooms.get(user.position.roomId);
      if (oldRoom) {
        oldRoom.removeUser(user);
        if (oldRoom.getUserCount() === 0) {
          this.rooms.delete(oldRoom.id);
        }
      } else {
        logger.warn(
          `${user} was in room ${user.position.roomId} but the room was not found`
        );
      }
    }

    const result = GameRoom.create(user, settings?.name, settings);
    if (result.success) {
      const room = result.data!;
      socket.join(room.id);
      this.rooms.set(room.id, room);
      emitter.lobby();
      emitter.whoami(user);
      emitter.room(room);
      logger.info(`${user} created room ${room.id}`);
    }
    callback({ ...result, data: result.data?.getState() });
  }

  private handleJoinRoom(
    socket: Socket,
    user: User,
    payload: ClientEvents["joinRoom"],
    callback: (result: ServerEvents["joinRoom"]) => void
  ) {
    const room = this.rooms.get(payload.roomId);
    if (!room) {
      callback({ success: false, message: "Room not found" });
      return;
    }
    if (room.id === user.position?.roomId) {
      // TODO: Allow user to change seat
      callback({ success: false, message: "User is already in the room" });
      return;
    }
    if (user.position) {
      const oldRoom = this.rooms.get(user.position.roomId);
      if (!oldRoom) {
        logger.warn(
          `${user} was in room ${user.position.roomId} but the room was not found`
        );
      } else {
        oldRoom.removeUser(user);
        if (oldRoom?.getUserCount() === 0) {
          this.rooms.delete(oldRoom.id);
        }
      }
    }
    const result = room.addUser(user, payload.seatIndex);
    if (result.success) {
      socket.join(payload.roomId);
      emitter.lobby();
      emitter.whoami(user);
      emitter.room(room);
    }
    callback(result);
  }

  private handleLeaveRoom(
    socket: Socket,
    user: User,
    callback: (result: ServerEvents["leaveRoom"]) => void
  ) {
    if (!user.position) {
      callback({ success: false, message: "User not in a room" });
      return;
    }

    const room = this.rooms.get(user.position.roomId);
    if (!room) {
      callback({ success: false, message: "Room not found" });
      return;
    }

    const result = room.removeUser(user);
    if (result.success) {
      socket.leave(room.id);
      if (room.getUserCount() === 0) {
        this.rooms.delete(room.id);
      }
      emitter.lobby();
      emitter.whoami(user);
      emitter.room(room);
    }
    callback(result);
  }

  private handleStartGame(
    user: User,
    callback: (result: ServerEvents["startGame"]) => void
  ) {
    if (!user.position) {
      callback({ success: false, message: "User not in a room" });
      return;
    }

    const room = this.rooms.get(user.position.roomId);
    if (!room) {
      callback({ success: false, message: "Room not found" });
      return;
    }

    if (room instanceof GameRoom) {
      const result = room.startGame(user);
      if (result.success) {
        emitter.lobby();
        emitter.room(room);
      }
      callback(result);
    } else {
      callback({ success: false, message: "Room is not a game room" });
    }
  }

  private handleUserInput(user: User, input: ClientEvents["userControls"]) {
    if (!user.position) return;

    const room = this.rooms.get(user.position.roomId);
    if (!room || !(room instanceof GameRoom)) return;

    room.handleUserInput(user, input);
  }

  private handleLobbyState(
    callback: (state: ServerEvents["lobbyState"]) => void
  ) {
    callback({
      rooms: Object.fromEntries(
        [...this.rooms].map(([id, r]) => [id, r.getState()])
      ),
      users: Object.fromEntries(
        [...this.users]
          .filter(([_, user]) => user.online)
          .map(([id, u]) => [id, u.getState()])
      ),
    });
  }

  private handleToggleReady(
    user: User,
    callback: (result: ServerEvents["toggleReady"]) => void
  ) {
    if (!user.position) return;

    const room = this.rooms.get(user.position.roomId);
    if (!room) {
      callback({ success: false, message: "Room not found" });
    } else {
      callback(room.setReady(user));
      emitter.room(room);
      emitter.whoami(user);
      emitter.lobby();
    }
  }

  private handleLobbyMessage(
    user: User,
    payload: ClientEvents["lobby:message"],
    callback: (result: ServerEvents["createMessage"]) => void
  ) {
    if (!payload.content) {
      callback({ success: false, message: "Message content is required" });
      return;
    }

    const result = LobbyMessage.create(user, payload.content);
    if (result.success && result.data) {
      this.messages.push(result.data);
      this.emitter.chat(result.data);
      callback({ success: true, data: result.data.toChatMessage() });
    } else {
      callback({ success: false, message: result.message });
    }
  }

  private handleRoomMessage(
    user: User,
    payload: ClientEvents["room:message"],
    callback: (result: ServerEvents["createMessage"]) => void
  ) {
    if (!user.position?.roomId) {
      callback({ success: false, message: "User is not in a room" });
      return;
    }

    const room = this.rooms.get(user.position.roomId);
    if (!room) {
      callback({ success: false, message: "Room not found" });
      return;
    }

    if (!payload.content) {
      callback({ success: false, message: "Message content is required" });
      return;
    }

    const result = RoomMessage.create(payload.content, user, room);
    if (result.success && result.data) {
      this.emitter.chat(result.data);
      callback({ success: true, data: result.data.toChatMessage() });
    } else {
      callback({ success: false, message: result.message });
    }
  }

  private handlePrivateMessage(
    user: User,
    payload: ClientEvents["user:message"],
    callback: (result: ServerEvents["createMessage"]) => void
  ) {
    if (!payload.content || !payload.to) {
      callback({
        success: false,
        message: "Message content and recipient ID are required",
      });
      return;
    }

    const recipient = this.users.get(payload.to);
    if (!recipient || !recipient.online) {
      callback({
        success: false,
        message: "Recipient not found or offline",
      });
      return;
    }

    const result = PrivateMessage.create(payload.content, user, recipient);
    if (result.success && result.data) {
      this.emitter.chat(result.data);
      callback({ success: true, data: result.data.toChatMessage() });
    } else {
      callback({ success: false, message: result.message });
    }
  }

  private handleDisconnect(user: User) {
    user.setOffline();

    // Handle room-related cleanup
    if (user.position) {
      const room = this.rooms.get(user.position.roomId);
      if (!room) {
        logger.warn(
          `${user} was in room ${user.position.roomId} but the room was not found`
        );
        return;
      }
      room.removeUser(user);
      if (room.getUserCount() === 0) {
        this.rooms.delete(room.id);
      }
      emitter.room(room);
    }
    // Do not remove user from map to allow reconnection
    // this.users.delete(user.id);
    emitter.lobby();
    logger.info(`User disconnected: ${user}`);
  }

  private handleDisconnectedCleanup() {
    const IDLE_CHECK_INTERVAL = 60 * 1000 * 15; // 15 minutes
    const DISCONNECTION_THRESHOLD = 1000 * 60 * 30; // 30 minutes

    setInterval(() => {
      for (const [_, user] of this.users) {
        if (user.online && user.isIdle()) {
          user.setOffline();

          const room = user.position && this.rooms.get(user.position.roomId);
          if (!room) continue;
          const isWaitingGame =
            room instanceof GameRoom && room.gameStatus === GameStatus.WAITING;
          const shouldRemoveUser = !(room instanceof GameRoom) || isWaitingGame;

          if (shouldRemoveUser) {
            room.removeUser(user);
            if (room.getUserCount() === 0) {
              this.rooms.delete(room.id);
            }
            emitter.room(room);
          }
        }

        // Clean up long-disconnected users
        const disconnectedTime = Date.now() - user.lastActivityAt;
        if (!user.online && disconnectedTime > DISCONNECTION_THRESHOLD) {
          this.users.delete(user.id);
        }
      }
      emitter.lobby();
    }, IDLE_CHECK_INTERVAL);
  }

  private setupErrorHandling() {
    this.httpServer.on("error", (error) => {
      logger.error(`Failed to start server: ${error.message}`);
      process.exit(1);
    });

    process.on("SIGTERM", () => {
      logger.info("SIGTERM received. Shutting down gracefully...");
      this.httpServer.close(() => {
        logger.info("Server closed");
        process.exit(0);
      });
    });
  }

  public start() {
    this.httpServer.listen(Config.PORT, Config.HOST, () => {
      logger.info(
        `Server started and listening on http://${Config.HOST}:${Config.PORT}`
      );
      process.send?.("ready");
    });
  }
}

// Initialize and start the server
const gameServer = new GameServer();
gameServer.start();

export const emitter = EventBroadcaster.getInstance();
