import { Events, ServerPayloads } from "@/events";
import { useSocket } from "@/hooks/useSocket";
import {
  GlobalChatMessage,
  MessageType,
  OperationResult,
  PrivateChatMessage,
  RoomChatMessage,
} from "@/server/types";
import { createContext, useEffect, useState } from "react";

interface ChatMessage {
  global: GlobalChatMessage[];
  room: RoomChatMessage[];
  private: PrivateChatMessage[];
}

interface ChatContextType {
  messages: ChatMessage;
  sendLobbyMessage: (content: string) => Promise<OperationResult>;
  sendRoomMessage: (content: string) => Promise<OperationResult>;
  sendPrivateMessage: (content: string, to: string) => Promise<OperationResult>;
}

export const ChatContext = createContext<ChatContextType | null>(null);

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { socket, emit } = useSocket();
  const [messages, setMessages] = useState<ChatMessage>({
    global: [],
    room: [],
    private: [],
  });

  useEffect(() => {
    if (!socket) return;

    socket.on(
      Events.GLOBAL_MESSAGE,
      (message: ServerPayloads["global:message"]) => {
        setMessages((prev) => ({
          ...prev,
          global: [...prev.global, message],
        }));
      }
    );

    socket.on(
      Events.ROOM_MESSAGE,
      (message: ServerPayloads["room:message"]) => {
        setMessages((prev) => ({
          ...prev,
          room: [...prev.room, message],
        }));
      }
    );

    socket.on(
      Events.PRIVATE_MESSAGE,
      (message: ServerPayloads["user:message"]) => {
        setMessages((prev) => ({
          ...prev,
          private: [...prev.private, message],
        }));
      }
    );

    return () => {
      socket.off(Events.GLOBAL_MESSAGE);
      socket.off(Events.ROOM_MESSAGE);
      socket.off(Events.PRIVATE_MESSAGE);
    };
  }, [socket]);

  const sendLobbyMessage = (content: string) =>
    emit(Events.CREATE_MESSAGE, { type: MessageType.GLOBAL, content });

  const sendRoomMessage = (content: string) =>
    emit(Events.CREATE_MESSAGE, { type: MessageType.ROOM, content });

  const sendPrivateMessage = (content: string, to: string) =>
    emit(Events.CREATE_MESSAGE, { type: MessageType.PRIVATE, content, to });

  return (
    <ChatContext
      value={{
        messages,
        sendLobbyMessage,
        sendRoomMessage,
        sendPrivateMessage,
      }}
    >
      {children}
    </ChatContext>
  );
};
