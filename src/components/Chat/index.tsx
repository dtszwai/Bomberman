import React, { useState, useEffect, useRef } from "react";
import { socket } from "../../apis/socket";
import { Events } from "@/events";
import { ChatMessage, UserState, AnyRoomState } from "@/server/types";
import { MessageType } from "@/server/types";
import styles from "./Chat.module.css";

interface ChatProps {
  currentUser: UserState | null;
  currentRoom: AnyRoomState | null;
  users: Record<string, UserState>;
  onError?: (message: string) => void;
  selectedUser?: UserState | null;
  className?: string;
}
type MessageTarget = "lobby" | "room" | "private";

const Chat = ({
  currentUser,
  currentRoom,
  users,
  onError,
  selectedUser: externalSelectedUser,
  className = "",
}: ChatProps) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [messageTarget, setMessageTarget] = useState<MessageTarget>("lobby");
  const [selectedUser, setSelectedUser] = useState<UserState | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (externalSelectedUser) {
      setSelectedUser(externalSelectedUser);
      setMessageTarget("private");
    }
  }, [externalSelectedUser]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    const handleMessage = (message: ChatMessage) => {
      setMessages((prev) => [...prev, message]);
    };

    socket.on(Events.LOBBY_MESSAGE, handleMessage);
    socket.on(Events.ROOM_MESSAGE, handleMessage);
    socket.on(Events.PRIVATE_MESSAGE, handleMessage);

    return () => {
      socket.off(Events.LOBBY_MESSAGE, handleMessage);
      socket.off(Events.ROOM_MESSAGE, handleMessage);
      socket.off(Events.PRIVATE_MESSAGE, handleMessage);
    };
  }, []);

  useEffect(() => {
    if (currentRoom) {
      setMessageTarget("room");
    } else {
      setMessageTarget("lobby");
      setSelectedUser(null);
    }
  }, [currentRoom]);

  const handleUserClick = (user: UserState) => {
    if (user.id === currentUser?.id) return;
    setSelectedUser(user);
    setMessageTarget("private");
  };

  const handleTargetChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const target = e.target.value as MessageTarget;
    setMessageTarget(target);
    if (target !== "private") {
      setSelectedUser(null);
    }
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || !currentUser) return;

    try {
      if (messageTarget === "private" && selectedUser) {
        socket.emit(
          Events.PRIVATE_MESSAGE,
          {
            content: inputMessage,
            to: selectedUser.id,
          },
          (response: { success: boolean; message: string }) => {
            if (!response.success) {
              onError?.(response.message);
              return;
            }
            setInputMessage("");
          }
        );
      } else if (messageTarget === "room" && currentRoom) {
        socket.emit(
          Events.ROOM_MESSAGE,
          {
            content: inputMessage,
          },
          (response: { success: boolean; message: string }) => {
            if (!response.success) {
              onError?.(response.message);
              return;
            }
            setInputMessage("");
          }
        );
      } else {
        socket.emit(
          Events.LOBBY_MESSAGE,
          {
            content: inputMessage,
          },
          (response: { success: boolean; message: string }) => {
            if (!response.success) {
              onError?.(response.message);
              return;
            }
            setInputMessage("");
          }
        );
      }
    } catch (error) {
      console.error("Failed to send message:", error);
      onError?.("Failed to send message");
    }
  };

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  const getMessageClass = (message: ChatMessage) => {
    const isCurrentUser = message.from.id === currentUser?.id;
    const baseClasses = [
      styles.message,
      isCurrentUser ? styles.messageSent : styles.messageReceived,
    ];

    switch (message.type) {
      case MessageType.PRIVATE:
        baseClasses.push(styles.privateMessage);
        break;
      case MessageType.ROOM:
        baseClasses.push(styles.roomMessage);
        break;
      default:
        baseClasses.push(styles.lobbyMessage);
    }

    return baseClasses.join(" ");
  };

  const getAvailableTargets = () => {
    const targets: { value: MessageTarget; label: string }[] = [
      { value: "lobby", label: "Lobby" },
    ];

    if (currentRoom) {
      targets.push({ value: "room", label: "Room" });
    }

    if (Object.keys(users).length > 1) {
      targets.push({ value: "private", label: "Private" });
    }

    return targets;
  };

  return (
    <div className={`${styles.chatContainer} ${className}`}>
      <div className={styles.messagesContainer}>
        <div className={styles.messagesList}>
          {messages.map((message, index) => (
            <div
              key={index}
              className={getMessageClass(message)}
              onClick={() => handleUserClick(message.from)}
            >
              <div className={styles.messageHeader}>
                <span className={styles.senderName}>
                  {message.from.name}
                  {message.type === MessageType.PRIVATE && " (Private)"}
                  {message.type === MessageType.ROOM && " (Room)"}
                </span>
                <span className={styles.timestamp}>
                  {formatTimestamp(message.timestamp)}
                </span>
              </div>
              <p className={styles.messageContent}>{message.content}</p>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </div>

      <form onSubmit={sendMessage} className={styles.inputForm}>
        <div className={styles.inputContainer}>
          <div className={styles.inputRow}>
            <select
              className={styles.targetSelect}
              value={messageTarget}
              onChange={handleTargetChange}
            >
              {getAvailableTargets().map((target) => (
                <option key={target.value} value={target.value}>
                  {target.label}
                </option>
              ))}
            </select>
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder={`Message ${
                messageTarget === "private" && selectedUser
                  ? selectedUser.name
                  : messageTarget
              }...`}
              className={styles.messageInput}
            />
            <button
              type="submit"
              disabled={
                !inputMessage.trim() ||
                (messageTarget === "private" && !selectedUser)
              }
              className={styles.sendButton}
            >
              Send
            </button>
          </div>
          {messageTarget === "private" && (
            <div className={styles.targetInfo}>
              {selectedUser
                ? `Sending private message to ${selectedUser.name}`
                : "Click on a user's message to select them as the recipient"}
            </div>
          )}
        </div>
      </form>
    </div>
  );
};

export default Chat;
