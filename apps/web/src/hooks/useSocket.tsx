import { SocketContext } from "@/contexts/SocketContext";
import { use } from "react";

export const useSocket = () => {
  const context = use(SocketContext);
  if (!context) {
    throw new Error("useSocket must be used within a SocketProvider");
  }
  return context;
};
