import { useChat } from "@/hooks/useChat";
import { ChevronDown } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { MessageType, UserState, RoomState } from "@/server/types";
import { MessageBubble } from "./MessageBubble";
import { ChatInput } from "./ChatInput";

interface ChatSessionProps {
  currentUser: UserState;
  currentRoom?: RoomState;
  selectedUser?: UserState | null;
  onSelectUser?: (userId?: string) => void;
}

export const ChatSession = ({
  currentUser,
  currentRoom,
  selectedUser,
  onSelectUser,
}: ChatSessionProps) => {
  const { messages, sendLobbyMessage, sendRoomMessage, sendPrivateMessage } =
    useChat();
  const [selectedMessageType, setSelectedMessageType] = useState<MessageType>(
    selectedUser ? MessageType.PRIVATE : MessageType.GLOBAL
  );
  const chatEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const [isNearBottom, setIsNearBottom] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const lastMessageTimestampRef = useRef<number>(Date.now());
  const [sendError, setSendError] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const initialScrollRef = useRef(false);

  // Update message type when selectedUser changes
  useEffect(() => {
    if (selectedUser) {
      setSelectedMessageType(MessageType.PRIVATE);
    } else if (currentRoom) {
      setSelectedMessageType(MessageType.ROOM);
    } else {
      setSelectedMessageType(MessageType.GLOBAL);
    }
  }, [selectedUser, currentRoom]);

  const getAllMessages = useCallback(() => {
    return [...messages.global, ...messages.room, ...messages.private].sort(
      (a, b) => a.timestamp - b.timestamp
    );
  }, [messages]);

  const scrollToBottom = useCallback((behavior: ScrollBehavior = "smooth") => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTo({
        top: messagesContainerRef.current.scrollHeight,
        behavior,
      });
    }
    setUnreadCount(0);
  }, []);

  // Initial scroll to bottom
  useEffect(() => {
    const allMessages = getAllMessages();
    if (allMessages.length > 0 && !initialScrollRef.current) {
      scrollToBottom("auto");
      initialScrollRef.current = true;
    }
  }, [getAllMessages, scrollToBottom]);

  // Scroll position monitoring
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      const scrollPosition = scrollHeight - scrollTop - clientHeight;
      const newIsNearBottom = scrollPosition < 100;
      setIsNearBottom(newIsNearBottom);

      if (newIsNearBottom) {
        setUnreadCount(0);
      }
    };

    container.addEventListener("scroll", handleScroll);
    return () => container.removeEventListener("scroll", handleScroll);
  }, []);

  // Message counting and scroll management
  useEffect(() => {
    const allMessages = getAllMessages();
    if (allMessages.length === 0) return;

    const lastMessage = allMessages[allMessages.length - 1];

    if (lastMessage.from.id === currentUser.id) {
      scrollToBottom();
      return;
    }

    if (
      lastMessage.timestamp > lastMessageTimestampRef.current &&
      !isNearBottom
    ) {
      setUnreadCount((prev) => prev + 1);
    }

    lastMessageTimestampRef.current = lastMessage.timestamp;
  }, [messages, isNearBottom, currentUser.id, getAllMessages, scrollToBottom]);

  const handleSendMessage = async (messageContent: string) => {
    setIsSending(true);
    setSendError(null);

    try {
      let response;
      switch (selectedMessageType) {
        case MessageType.GLOBAL:
          response = await sendLobbyMessage(messageContent);
          break;
        case MessageType.ROOM:
          response = await sendRoomMessage(messageContent);
          break;
        case MessageType.PRIVATE:
          if (selectedUser) {
            response = await sendPrivateMessage(
              messageContent,
              selectedUser.id
            );
          }
          break;
      }

      if (response?.success) {
        scrollToBottom();
      } else {
        setSendError(
          response?.message || "Failed to send message. Please try again."
        );
        setTimeout(() => setSendError(null), 5000);
      }
    } catch (_) {
      setSendError("Unable to send message. Please check your connection.");
      setTimeout(() => setSendError(null), 5000);
    } finally {
      setIsSending(false);
    }
  };

  const handleStartDM = (userId: string) => {
    onSelectUser?.(userId);
  };

  const handleMessageTypeChange = (type: MessageType) => {
    setSelectedMessageType(type);
    if (type !== MessageType.PRIVATE) {
      onSelectUser?.(undefined);
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-900 rounded-xl overflow-hidden border border-gray-800">
      <div className="relative flex-1">
        <div
          ref={messagesContainerRef}
          className="absolute inset-0 overflow-y-auto p-2 md:p-4 overflow-x-hidden"
          style={{
            scrollbarWidth: "thin",
            scrollbarColor: "rgb(75 85 99) transparent",
          }}
        >
          <div className="space-y-2 md:space-y-4">
            {getAllMessages().map((message) => (
              <MessageBubble
                key={message.id}
                message={message}
                currentUser={currentUser}
                currentRoom={currentRoom}
                onStartDM={handleStartDM}
              />
            ))}
            <div ref={chatEndRef} />
          </div>
        </div>

        {!isNearBottom && unreadCount > 0 && (
          <button
            onClick={() => scrollToBottom()}
            className="absolute bottom-4 right-4 bg-blue-500 text-white px-2 py-1 md:px-3 md:py-2 rounded-full 
              shadow-lg flex items-center space-x-2 hover:bg-blue-600 transition-colors
              animate-bounce text-xs md:text-sm"
          >
            <span className="font-medium">
              {unreadCount} new {unreadCount === 1 ? "message" : "messages"}
            </span>
            <ChevronDown size={window.innerWidth >= 768 ? 16 : 14} />
          </button>
        )}
      </div>

      <ChatInput
        currentUser={currentUser}
        currentRoom={currentRoom}
        selectedUser={selectedUser}
        selectedMessageType={selectedMessageType}
        onMessageTypeChange={handleMessageTypeChange}
        onSendMessage={handleSendMessage}
        isSending={isSending}
        sendError={sendError}
      />
    </div>
  );
};

export default ChatSession;
