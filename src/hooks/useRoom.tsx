import { use } from "react";
import { RoomContext } from "@/contexts/RoomContext";

export const useRoom = () => {
  const context = use(RoomContext);
  if (!context) {
    throw new Error("useRoom must be used within a RoomProvider");
  }
  return context;
};
