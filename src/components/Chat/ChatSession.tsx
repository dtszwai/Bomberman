import { useChat } from "@/hooks/useChat";
import { Send, Hash, Users, AtSign, ChevronDown } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { MessageType, ChatMessage, UserState, RoomState } from "@/server/types";

interface ChatSessionProps {
  currentUser: UserState;
  currentRoom?: RoomState;
  selectedUser?: UserState | null;
  onSelectUser?: (user?: UserState) => void;
}

export const ChatSession = ({
  currentUser,
  currentRoom,
  selectedUser,
  onSelectUser,
}: ChatSessionProps) => {
  const { messages, sendLobbyMessage, sendRoomMessage, sendPrivateMessage } =
    useChat();
  const [newMessage, setNewMessage] = useState("");
  const [selectedMessageType, setSelectedMessageType] = useState<MessageType>(
    selectedUser ? MessageType.PRIVATE : MessageType.GLOBAL
  );
  const chatEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
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

  useEffect(() => {
    const allMessages = getAllMessages();
    if (allMessages.length > 0 && !initialScrollRef.current) {
      scrollToBottom("auto");
      initialScrollRef.current = true;
    }
  }, [getAllMessages, scrollToBottom]);

  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      const scrollPosition = scrollHeight - scrollTop - clientHeight;
      const newIsNearBottom = scrollPosition < 100;
      setIsNearBottom(newIsNearBottom);

      // Clear unread count when scrolling to bottom
      if (newIsNearBottom) {
        setUnreadCount(0);
      }
    };

    container.addEventListener("scroll", handleScroll);
    return () => container.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const allMessages = getAllMessages();
    if (allMessages.length === 0) return;

    const lastMessage = allMessages[allMessages.length - 1];

    // Don't count own messages
    if (lastMessage.from.id === currentUser.id) {
      scrollToBottom();
      return;
    }

    // If message is newer than last checked and we're not at bottom
    if (
      lastMessage.timestamp > lastMessageTimestampRef.current &&
      !isNearBottom
    ) {
      setUnreadCount((prev) => prev + 1);
    }

    lastMessageTimestampRef.current = lastMessage.timestamp;
  }, [messages, isNearBottom, currentUser.id, getAllMessages, scrollToBottom]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || isSending) return;

    const messageContent = newMessage.trim();
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
        setNewMessage("");
        scrollToBottom();
      } else {
        setSendError(
          response?.message || "Failed to send message. Please try again."
        );
        setTimeout(() => setSendError(null), 5000); // Clear error after 5 seconds
      }
    } catch (_) {
      setSendError("Unable to send message. Please check your connection.");
      setTimeout(() => setSendError(null), 5000);
    } finally {
      setIsSending(false);
    }
  };

  const handleStartDM = (user: UserState) => {
    onSelectUser?.(user);
    inputRef.current?.focus();
  };

  const handleMessageTypeChange = (type: MessageType) => {
    setSelectedMessageType(type);
    // Clear selected user if switching away from private messages
    if (type !== MessageType.PRIVATE) {
      onSelectUser?.(undefined);
    }
  };

  const MessageTypeIcon = ({
    type,
    active = false,
  }: {
    type: MessageType;
    active?: boolean;
  }) => {
    const baseClass = `w-8 h-8 flex items-center justify-center rounded-lg transition-all duration-200 
      ${
        active
          ? "bg-blue-500 text-white"
          : "hover:bg-gray-700 text-gray-400 hover:text-gray-200"
      }`;

    switch (type) {
      case MessageType.GLOBAL:
        return (
          <button
            className={baseClass}
            onClick={() => handleMessageTypeChange(MessageType.GLOBAL)}
            title="Global chat"
          >
            <Hash size={16} />
          </button>
        );
      case MessageType.ROOM:
        return (
          <button
            className={baseClass}
            onClick={() => handleMessageTypeChange(MessageType.ROOM)}
            title="Room chat"
            disabled={!currentRoom}
          >
            <Users size={16} />
          </button>
        );
      case MessageType.PRIVATE:
        return (
          <button
            className={baseClass}
            onClick={() =>
              selectedUser && handleMessageTypeChange(MessageType.PRIVATE)
            }
            title="Direct message"
            disabled={!selectedUser}
          >
            <AtSign size={16} />
          </button>
        );
    }
  };

  const MessageBubble = ({ message }: { message: ChatMessage }) => {
    const isOwnMessage = message.from.id === currentUser.id;
    const formattedTime = new Date(message.timestamp).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });

    const MessageInfo = () => {
      const CommonIcon = () => {
        const iconClass = `mx-1 ${getTypeColor(message.type)}`;
        switch (message.type) {
          case MessageType.PRIVATE:
            return <AtSign size={12} className={iconClass} />;
          case MessageType.ROOM:
            return <Users size={12} className={iconClass} />;
          case MessageType.GLOBAL:
            return <Hash size={12} className={iconClass} />;
        }
      };

      if (isOwnMessage) {
        return (
          <div className="flex items-center space-x-1 text-xs">
            <CommonIcon />
            {message.type === MessageType.PRIVATE && (
              <span className={getTypeColor(message.type)}>
                {message.to?.name}
              </span>
            )}
            {message.type === MessageType.ROOM && (
              <span className={getTypeColor(message.type)}>
                {currentRoom?.name}
              </span>
            )}
            <span className="text-gray-500">{formattedTime}</span>
          </div>
        );
      }

      return (
        <div className="flex items-center space-x-1 text-xs">
          <button
            onClick={() => handleStartDM(message.from)}
            className="text-sm font-medium text-gray-300 hover:underline"
          >
            {message.from.name}
          </button>
          <CommonIcon />
          <span className={`${getTypeColor(message.type)}`}>
            {formattedTime}
          </span>
        </div>
      );
    };

    return (
      <div
        className={`flex mb-4 ${
          isOwnMessage ? "justify-end" : "justify-start"
        }`}
      >
        {!isOwnMessage && (
          <button
            onClick={() => handleStartDM(message.from)}
            className="flex-shrink-0 mr-3 group"
          >
            <div
              className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center
              font-medium text-sm text-gray-300 group-hover:bg-gray-600 transition-colors"
            >
              {message.from.name.charAt(0).toUpperCase()}
            </div>
          </button>
        )}
        <div
          className={`flex flex-col ${
            isOwnMessage ? "items-end" : "items-start"
          } max-w-[75%]`}
        >
          <MessageInfo />
          <div
            className={`
            mt-1 px-4 py-2 rounded-2xl text-sm leading-relaxed break-words
            ${
              isOwnMessage
                ? "bg-blue-500 text-white"
                : "bg-gray-800 text-gray-200 border border-gray-700"
            }
          `}
          >
            {message.content}
          </div>
        </div>
        {isOwnMessage && (
          <div className="flex-shrink-0 ml-3">
            <div
              className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center
              font-medium text-sm text-white"
            >
              {currentUser.name.charAt(0).toUpperCase()}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full bg-gray-900 rounded-xl overflow-hidden border border-gray-800">
      <div className="relative flex-1">
        <div
          ref={messagesContainerRef}
          className="absolute inset-0 overflow-y-auto p-4 overflow-x-hidden"
          style={{
            scrollbarWidth: "thin",
            scrollbarColor: "rgb(75 85 99) transparent",
          }}
        >
          <div className="space-y-4">
            {getAllMessages().map((message) => (
              <MessageBubble key={message.id} message={message} />
            ))}
            <div ref={chatEndRef} />
          </div>
        </div>

        {!isNearBottom && unreadCount > 0 && (
          <button
            onClick={() => scrollToBottom()}
            className="absolute bottom-4 right-4 bg-blue-500 text-white px-3 py-2 rounded-full 
              shadow-lg flex items-center space-x-2 hover:bg-blue-600 transition-colors
              animate-bounce"
          >
            <span className="text-sm font-medium">
              {unreadCount} new {unreadCount === 1 ? "message" : "messages"}
            </span>
            <ChevronDown size={16} />
          </button>
        )}
      </div>

      {/* Input Area */}
      <div className="flex-shrink-0 p-4 border-t border-gray-800 bg-gray-900/80 backdrop-blur supports-backdrop-blur:bg-gray-900/80">
        <div className="flex items-center space-x-2">
          <div className="flex space-x-1 bg-gray-800 p-1 rounded-lg">
            <MessageTypeIcon
              type={MessageType.GLOBAL}
              active={selectedMessageType === MessageType.GLOBAL}
            />
            {/* Show room button when either in a room or viewing room messages */}
            {(currentRoom || selectedMessageType === MessageType.ROOM) && (
              <MessageTypeIcon
                type={MessageType.ROOM}
                active={selectedMessageType === MessageType.ROOM}
              />
            )}
            {selectedUser && (
              <MessageTypeIcon
                type={MessageType.PRIVATE}
                active={selectedMessageType === MessageType.PRIVATE}
              />
            )}
          </div>

          <div className="relative flex-1">
            <input
              ref={inputRef}
              type="text"
              className="w-full px-4 py-2 bg-gray-800 text-gray-200 rounded-lg 
                placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 
                border border-gray-700 transition-all duration-200"
              placeholder="Type your message..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
            />
            <div className="absolute bottom-full my-2 left-4 flex items-center space-x-2 z-10 bg-gray-900 rounded-lg">
              <div
                className={`flex items-center text-xs ${getTypeColor(
                  selectedMessageType
                )}`}
              >
                {getTypeIcon(selectedMessageType)}
                <span className="ml-1">
                  {selectedMessageType === MessageType.GLOBAL &&
                    "Sending to everyone"}
                  {selectedMessageType === MessageType.ROOM &&
                    `Sending to ${currentRoom?.name}`}
                  {selectedMessageType === MessageType.PRIVATE &&
                    selectedUser &&
                    `Sending to ${selectedUser.name}`}
                </span>
              </div>
            </div>
          </div>

          <button
            className={`p-2 rounded-lg transition-all duration-200 
              ${
                newMessage.trim() && !isSending
                  ? "bg-blue-500 hover:bg-blue-600 text-white"
                  : "bg-gray-800 text-gray-500 cursor-not-allowed"
              }
              focus:outline-none focus:ring-2 focus:ring-blue-500`}
            onClick={handleSendMessage}
            disabled={!newMessage.trim() || isSending}
          >
            <Send
              size={20}
              className={`transition-transform duration-200
                ${isSending ? "animate-pulse" : ""} 
                ${
                  newMessage.trim() && !isSending ? "transform -rotate-12" : ""
                }`}
            />
          </button>
        </div>
        {sendError && (
          <div className="absolute bottom-full right-0 mb-2 p-2 bg-red-500/90 text-white text-sm rounded-lg animate-fade-in">
            {sendError}
          </div>
        )}
      </div>
    </div>
  );
};

const getTypeColor = (type: MessageType) => {
  switch (type) {
    case MessageType.GLOBAL:
      return "text-emerald-500";
    case MessageType.ROOM:
      return "text-amber-500";
    case MessageType.PRIVATE:
      return "text-purple-500";
  }
};

const getTypeIcon = (type: MessageType) => {
  switch (type) {
    case MessageType.GLOBAL:
      return <Hash size={12} />;
    case MessageType.ROOM:
      return <Users size={12} />;
    case MessageType.PRIVATE:
      return <AtSign size={12} />;
  }
};
