import { io } from "socket.io-client";

const SOCKET_URL = "ws://localhost:3000";
const socket = io(SOCKET_URL);

socket.connect();

export { socket };
