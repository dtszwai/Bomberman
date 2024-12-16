import { createServer } from "http";
import { Server } from "socket.io";
import { Lobby } from "./Lobby";
import { registerViteHmrServerRestart } from "./vite-hmr-restart";
import { CreateRoomDto, OperationResult, PlayerInput } from "./types";

const DEBUG = (process.env.DEBUG || "false").toLowerCase() === "true";
const PORT = Number(process.env.PORT) || 3000;

if (!DEBUG) console.log = () => {};

// CORS allows the client to connect to the server from a different origin
const httpServer = createServer();
const io = new Server(httpServer, { cors: { origin: "*" } });
const lobby = new Lobby(io);

io.on("connection", (socket) => {
  console.log(`Player connected: ${socket.id}`);

  lobby.addPlayer(socket.id);
  // Send the player ID back to the client immediately after connection
  socket.emit("playerConnected", { playerId: socket.id });
  // Send current room list to newly connected client
  socket.emit("lobbyState", lobby.getLobbyState());

  // Room creation
  socket.on(
    "createRoom",
    (config: CreateRoomDto, callback: (result: OperationResult) => void) => {
      const result = lobby.createRoom(socket.id, config);
      if (result.success) {
        socket.join(result.data!.id);
        console.log(`Player ${socket.id} created room ${result.data!.id}`);
      }
      callback(result);
    }
  );

  // Room joining
  socket.on(
    "joinRoom",
    (roomId: string, callback: (result: OperationResult) => void) => {
      const result = lobby.joinRoom(roomId, socket.id);
      if (result.success) {
        socket.join(roomId);
      }
      callback(result);
    }
  );

  // Handle starting the game
  socket.on(
    "startGame",
    (roomId: string, callback: (result: OperationResult) => void) => {
      const result = lobby.initiateGame(roomId, socket.id);
      callback(result);
    }
  );

  // Leave Room
  socket.on("leaveRoom", (_, callback: (result: OperationResult) => void) => {
    const result = lobby.leaveRoom(socket.id);
    if (result.success) {
      socket.leave(result.data!.id);
    }
    callback(result);
  });

  socket.on("playerInput", (input: PlayerInput) => {
    const state = lobby.getLobbyState();
    const player = state.players[socket.id];

    if (player?.roomId) {
      lobby.handlePlayerInput(player.roomId, socket.id, input);
    }
  });

  socket.on("disconnect", () => {
    console.log(`Player disconnected: ${socket.id}`);
    lobby.removePlayer(socket.id);
  });
});

httpServer.listen(PORT, () => {
  console.log(`Server started on port ${PORT}\n`);
});

registerViteHmrServerRestart(io, httpServer);
