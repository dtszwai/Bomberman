import { Send } from "lucide-react";
import { getTypeColor, getTypeIcon } from "./utils";
import { useRef, useState } from "react";
import { MessageType, RoomState, UserState } from "@/server/types";
import { MessageTypeIcon } from "./MessageTypeIcon";

export interface ChatInputProps {
  currentUser: UserState;
  currentRoom?: RoomState;
  selectedUser?: UserState | null;
  selectedMessageType: MessageType;
  onMessageTypeChange: (type: MessageType) => void;
  onSendMessage: (message: string) => Promise<void>;
  isSending: boolean;
  sendError: string | null;
}

export const ChatInput = ({
  currentRoom,
  selectedUser,
  selectedMessageType,
  onMessageTypeChange,
  onSendMessage,
  isSending,
  sendError,
}: ChatInputProps) => {
  const [newMessage, setNewMessage] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || isSending) return;
    await onSendMessage(newMessage.trim());
    setNewMessage("");
  };

  return (
    <div className="flex-shrink-0 p-2 md:p-4 border-t border-gray-800 bg-gray-900/80 backdrop-blur supports-backdrop-blur:bg-gray-900/80">
      <div className="flex items-center space-x-2">
        <div className="flex space-x-1 bg-gray-800 p-1 rounded-lg">
          <MessageTypeIcon
            type={MessageType.GLOBAL}
            active={selectedMessageType === MessageType.GLOBAL}
            onClick={() => onMessageTypeChange(MessageType.GLOBAL)}
          />
          {(currentRoom || selectedMessageType === MessageType.ROOM) && (
            <MessageTypeIcon
              type={MessageType.ROOM}
              active={selectedMessageType === MessageType.ROOM}
              onClick={() => onMessageTypeChange(MessageType.ROOM)}
              disabled={!currentRoom}
            />
          )}
          {selectedUser && (
            <MessageTypeIcon
              type={MessageType.PRIVATE}
              active={selectedMessageType === MessageType.PRIVATE}
              onClick={() => onMessageTypeChange(MessageType.PRIVATE)}
            />
          )}
        </div>

        <div className="relative flex-1">
          <input
            ref={inputRef}
            type="text"
            className="w-full px-3 py-2 md:px-4 md:py-2 bg-gray-800 text-gray-200 rounded-lg 
              placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 
              border border-gray-700 transition-all duration-200
              text-sm md:text-base"
            placeholder="Type your message..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
          />
          <div className="absolute bottom-full my-2 left-4 flex items-center space-x-2 z-10 bg-gray-900 rounded-lg">
            <div
              className={`flex items-center text-xs md:text-sm ${getTypeColor(
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
            size={window.innerWidth >= 768 ? 20 : 18}
            className={`transition-transform duration-200
              ${isSending ? "animate-pulse" : ""} 
              ${newMessage.trim() && !isSending ? "transform -rotate-12" : ""}`}
          />
        </button>
      </div>
      {sendError && (
        <div className="absolute bottom-full right-0 mb-2 p-2 bg-red-500/90 text-white text-xs md:text-sm rounded-lg animate-fade-in">
          {sendError}
        </div>
      )}
    </div>
  );
};
