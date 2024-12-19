import { io } from "socket.io-client";

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || "ws://localhost:3000";
const socket = io(SOCKET_URL, { autoConnect: false });

setTimeout(() => {
  socket.connect();
}, 100);

export { socket };
