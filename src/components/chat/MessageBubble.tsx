import { AtSign, Hash, Users } from "lucide-react";
import { ChatMessage, MessageType, RoomState, UserState } from "@/server/types";
import { getTypeColor } from "./utils";

export interface MessageBubbleProps {
  message: ChatMessage;
  currentUser: UserState;
  currentRoom?: RoomState;
  onStartDM: (userId: string) => void;
}

export const MessageBubble = ({
  message,
  currentUser,
  currentRoom,
  onStartDM,
}: MessageBubbleProps) => {
  const isOwnMessage = message.from.id === currentUser.id;
  const formattedTime = new Date(message.timestamp).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  const MessageInfo = () => {
    const CommonIcon = () => {
      const iconClass = `mx-1 ${getTypeColor(message.type)}`;
      const size = window.innerWidth >= 768 ? 14 : 12;
      switch (message.type) {
        case MessageType.PRIVATE:
          return <AtSign size={size} className={iconClass} />;
        case MessageType.ROOM:
          return <Users size={size} className={iconClass} />;
        case MessageType.GLOBAL:
          return <Hash size={size} className={iconClass} />;
      }
    };

    if (isOwnMessage) {
      return (
        <div className="flex items-center space-x-1 text-xs md:text-sm">
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
      <div className="flex items-center space-x-1 text-xs md:text-sm">
        <button
          onClick={() => onStartDM(message.from.id)}
          className="font-medium text-gray-300 hover:underline"
        >
          {message.from.name}
        </button>
        <CommonIcon />
        <span className={getTypeColor(message.type)}>{formattedTime}</span>
      </div>
    );
  };

  return (
    <div
      className={`flex mb-4 ${isOwnMessage ? "justify-end" : "justify-start"}`}
    >
      {!isOwnMessage && (
        <button
          onClick={() => onStartDM(message.from.id)}
          className="flex-shrink-0 mr-2 md:mr-3 group"
        >
          <div
            className="w-6 h-6 md:w-8 md:h-8 rounded-full bg-gray-700 flex items-center justify-center
            font-medium text-xs md:text-sm text-gray-300 group-hover:bg-gray-600 transition-colors"
          >
            {message.from.name.charAt(0).toUpperCase()}
          </div>
        </button>
      )}
      <div
        className={`flex flex-col ${
          isOwnMessage ? "items-end" : "items-start"
        } max-w-[75%] md:max-w-[70%]`}
      >
        <MessageInfo />
        <div
          className={`
            mt-1 px-3 py-2 md:px-4 md:py-2 rounded-2xl text-sm md:text-base leading-relaxed break-words
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
        <div className="flex-shrink-0 ml-2 md:ml-3">
          <div
            className="w-6 h-6 md:w-8 md:h-8 rounded-full bg-blue-500 flex items-center justify-center
            font-medium text-xs md:text-sm text-white"
          >
            {currentUser.name.charAt(0).toUpperCase()}
          </div>
        </div>
      )}
    </div>
  );
};
