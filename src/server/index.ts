import { createServer } from "http";
import { Server, Socket } from "socket.io";
import { logger } from "./utils/logger";
import { EventBroadcaster } from "./utils/EventBroadcaster";
import { User, RoomService, MessageService } from "./models";
import { SocketHandler } from "./handlers";
import { UserService } from "./models/user";
import { GameService } from "./models/room/game.service";

const Config = {
  CORS_ORIGIN: process.env.CORS_ORIGIN || "*",
  HOST: process.env.HOST || "0.0.0.0",
  PORT: Number(process.env.PORT) || 3000,
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

    // Initialize services
    this.userService = new UserService();
    const roomService = new RoomService(this.userService);
    const messageService = new MessageService(this.userService, roomService);
    new EventBroadcaster(this.io, this.userService, roomService);

    // Initialize handlers
    const gameService = new GameService(roomService);
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
    const userId = socket.handshake.auth.userId;
    if (userId && this.userService.getUser(userId)) {
      const user = this.userService.getUser(userId)!;
      user.updateSocketId(socket.id);
      return user;
    }
    return this.userService.createUser(socket.id);
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

// Initialize and start the server
const gameServer = new GameServer();
gameServer.start();

export const emitter = EventBroadcaster.getInstance();
