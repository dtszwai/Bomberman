import { MessageType } from "@/server/types";
import { Hash, Users, AtSign } from "lucide-react";

export const getTypeColor = (type: MessageType) => {
  switch (type) {
    case MessageType.GLOBAL:
      return "text-emerald-500";
    case MessageType.ROOM:
      return "text-amber-500";
    case MessageType.PRIVATE:
      return "text-purple-500";
  }
};

export const getTypeIcon = (type: MessageType) => {
  const size = window.innerWidth >= 768 ? 14 : 12;
  switch (type) {
    case MessageType.GLOBAL:
      return <Hash size={size} />;
    case MessageType.ROOM:
      return <Users size={size} />;
    case MessageType.PRIVATE:
      return <AtSign size={size} />;
  }
};
