import { createServer } from "http";
import { Server } from "socket.io";
import { Lobby } from "./Lobby";
import { registerViteHmrServerRestart } from "./vite-hmr-restart";
import { ClientEvents, Events, ServerEvents } from "@/events";
import { logger } from "./logger";
import { EventBroadcaster } from "./broadcast";

const CORS_ORIGIN = process.env.CORS_ORIGIN || "*";
const HOST = process.env.HOST || "0.0.0.0";
const PORT = Number(process.env.PORT) || 3000;

const httpServer = createServer((_, res) => {
  res.writeHead(200, { "Content-Type": "text/plain" });
  res.end("Socket.IO server is running");
});

const io = new Server(httpServer, {
  cors: { origin: CORS_ORIGIN, methods: ["GET", "POST"] },
});

export const emitter = new EventBroadcaster(io);
const lobby = new Lobby();

io.on("connection", (socket) => {
  logger.info(`Player connected: ${socket.id}`);

  lobby.addPlayer(socket.id);
  emitter.broadcastPlayerState(socket.id, { id: socket.id });
  emitter.broadcastLobbyState(lobby.getLobbyState());

  // Room creation
  socket.on(
    Events.CREATE_ROOM,
    (
      config: ClientEvents["createRoom"],
      callback: (result: ServerEvents["createRoom"]) => void
    ) => {
      const result = lobby.createRoom(socket.id, config);
      if (result.success) {
        socket.join(result.data!.id);
        logger.info(`Player ${socket.id} created room ${result.data!.id}`);
      }
      callback(result);
    }
  );

  // Room joining
  socket.on(
    Events.JOIN_ROOM,
    (
      { roomId, seat }: ClientEvents["joinRoom"],
      callback: (result: ServerEvents["joinRoom"]) => void
    ) => {
      const result = lobby.joinRoom(socket.id, roomId, seat);
      if (result.success) {
        socket.join(roomId);
      }
      callback(result);
    }
  );

  // Leave Room
  socket.on(
    Events.LEAVE_ROOM,
    (_, callback: (result: ServerEvents["leaveRoom"]) => void) => {
      const result = lobby.leaveRoom(socket.id);
      if (result.success) {
        socket.leave(result.data!.id);
      }
      callback(result);
    }
  );

  // Handle starting the game
  socket.on(
    Events.START_GAME,
    (_, callback: (result: ServerEvents["startGame"]) => void) => {
      const result = lobby.initiateGame(socket.id);
      callback(result);
    }
  );

  socket.on(Events.PLAYER_CONTROLS, (input: ClientEvents["playerAction"]) => {
    const state = lobby.getLobbyState();
    const player = state.players[socket.id];

    if (player?.roomId) {
      lobby.handlePlayerInput(player.roomId, socket.id, input);
    }
  });

  socket.on("disconnect", () => {
    lobby.removePlayer(socket.id);
    logger.info(`Player disconnected: ${socket.id}`);
  });
});

httpServer
  .listen(PORT, HOST, () => {
    logger.info(`Server started and listening on http://${HOST}:${PORT}`);
    process.send?.("ready");
  })
  .on("error", (error) => {
    logger.error(`Failed to start server: ${error.message}`);
    process.exit(1);
  });

process.on("SIGTERM", () => {
  logger.info("SIGTERM received. Shutting down gracefully...");
  httpServer.close(() => {
    logger.info("Server closed");
    process.exit(0);
  });
});

if (process.env.DEBUG === "true") {
  registerViteHmrServerRestart(io, httpServer);
}
