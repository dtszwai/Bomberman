import { createServer } from "http";
import { Server, Socket } from "socket.io";
import {
  EventBroadcaster,
  GameService,
  MessageService,
  RoomService,
  Storage,
  User,
  UserService,
  logger,
} from "@arcade/lobby";
import { createDb } from "@arcade/storage";
import type { GameState } from "@arcade/games-bomberman/sim";
import { SocketHandler } from "./handlers";
import { BombermanRoom } from "@arcade/games-bomberman/room";

const Config = {
  CORS_ORIGIN: process.env.CORS_ORIGIN || "*",
  HOST: process.env.HOST || "0.0.0.0",
  PORT: Number(process.env.PORT) || 3000,
  DATABASE_URL: process.env.DATABASE_URL,
} as const;

class GameServer {
  private readonly httpServer;
  private readonly io: Server;
  private readonly socketHandler: SocketHandler;
  private userService: UserService;

  constructor() {
    this.httpServer = createServer((_, res) => {
      res.writeHead(200, { "Content-Type": "text/plain" });
      res.end("Socket.IO server is running");
    });
    this.io = new Server(this.httpServer, {
      cors: { origin: Config.CORS_ORIGIN },
    });

    const storage = Config.DATABASE_URL
      ? new Storage(
          createDb(Config.DATABASE_URL).db,
          (err) => logger.error("storage write failed", err)
        )
      : undefined;
    if (storage) {
      logger.info("Storage: connected to Postgres");
    } else {
      logger.warn("Storage: DATABASE_URL unset — replays disabled");
    }

    this.userService = new UserService();
    const roomService = new RoomService<GameState>(
      this.userService,
      (host, name, settings) =>
        BombermanRoom.create(host, name, settings, storage)
    );
    const messageService = new MessageService(
      this.userService,
      roomService as RoomService<unknown>
    );
    new EventBroadcaster(
      this.io,
      this.userService,
      roomService as RoomService<unknown>
    );

    const gameService = new GameService<GameState>(roomService);
    this.socketHandler = new SocketHandler(
      this.userService,
      roomService,
      messageService,
      gameService
    );

    this.setupSocketConnection();
    this.setupErrorHandling();
  }

  private setupSocketConnection() {
    this.io.on("connection", (socket) => {
      try {
        const user = this.authenticateUser(socket);
        this.socketHandler.bindEvents(socket, user);
      } catch (error) {
        logger.error(`Error during user connection: ${error}`);
        socket.disconnect();
      }
    });
  }

  private authenticateUser(socket: Socket): User {
    const userId = this.readAuthString(socket.handshake.auth.userId);
    const userName = this.readAuthString(socket.handshake.auth.userName);
    const avatarColor = this.readAuthString(socket.handshake.auth.avatarColor);

    if (userId && this.userService.getUser(userId)) {
      const user = this.userService.getUser(userId)!;
      user.updateSocketId(socket.id);
      return user;
    }
    try {
      return this.userService.createUser(socket.id, userName, avatarColor);
    } catch {
      return this.userService.createUser(socket.id);
    }
  }

  private readAuthString(value: unknown): string | undefined {
    return typeof value === "string" && value.trim().length > 0
      ? value.trim()
      : undefined;
  }

  private setupErrorHandling() {
    this.httpServer.on("error", (error) => {
      logger.error(`Failed to start server: ${error.message}`);
      process.exit(1);
    });

    process.on("SIGTERM", () => {
      logger.info("SIGTERM received. Shutting down...");
      this.httpServer.close(() => {
        logger.info("Server closed");
        process.exit(0);
      });
    });
  }

  public start() {
    this.httpServer.listen(Config.PORT, Config.HOST, () => {
      logger.info(`Server started on http://${Config.HOST}:${Config.PORT}`);
      process.send?.("ready");
    });
  }
}

const gameServer = new GameServer();
gameServer.start();
