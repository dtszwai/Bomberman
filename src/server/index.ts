import { createServer } from "http";
import { Server } from "socket.io";
import { RoomManager } from "./RoomManager";
import { registerViteHmrServerRestart } from "./vite-hmr-restart";
import { CreateRoomDto, Lobby } from "./types";

const DEBUG = (process.env.DEBUG || "false").toLowerCase() === "true";
const PORT = Number(process.env.PORT) || 3000;

if (!DEBUG) console.log = () => {};

const lobby: Lobby = {
  rooms: {},
  players: {},
};

const httpServer = createServer();
const io = new Server(httpServer);
const roomManager = new RoomManager(io, lobby);

io.on("connection", (socket) => {
  console.log(
    `Client connected: ${socket.id}, total: ${io.engine.clientsCount}`
  );

  // Add player to the lobby
  lobby.players[socket.id] = { id: socket.id };

  // Send current room list to newly connected client
  const lobbyData = Object.values(lobby.rooms).map((r) => ({
    id: r.id,
    playerCount: Object.keys(r.players).length,
    maxPlayers: r.maxPlayers,
    started: r.started,
  }));
  socket.emit("roomListUpdate", lobbyData);

  socket.on("createRoom", (dto: CreateRoomDto, callback) => {
    const room = roomManager.createRoom(socket.id, dto);
    if (room) {
      socket.join(room.id);
      console.log(`Player ${socket.id} created room ${room.id}`);
    }
    callback(room);
  });

  socket.on("joinRoom", (roomId: string, callback) => {
    const result = roomManager.joinRoom(roomId, socket.id);
    if (result.success) socket.join(roomId);
    callback(result);
  });

  socket.on("leaveRoom", (_, callback) => {
    roomManager.leaveRoom(socket.id);
    callback();
  });

  socket.on("playerInput", (_) => {
    // TODO: Handle player input
  });

  socket.on("disconnect", () => {
    roomManager.handleDisconnect(socket.id);
  });
});

httpServer.listen(PORT, () => {
  console.log(`Server started on port ${PORT}\n`);
});

registerViteHmrServerRestart(io, httpServer);
