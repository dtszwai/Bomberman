import { MessageType } from "@/server/types";
import { Hash, Users, AtSign } from "lucide-react";

export interface MessageTypeIconProps {
  type: MessageType;
  active?: boolean;
  onClick?: () => void;
  disabled?: boolean;
}

export const MessageTypeIcon = ({
  type,
  active = false,
  onClick,
  disabled = false,
}: MessageTypeIconProps) => {
  const baseClass = `w-8 h-8 md:w-10 md:h-10 flex items-center justify-center rounded-lg transition-all duration-200 
    ${
      active
        ? "bg-blue-500 text-white"
        : "hover:bg-gray-700 text-gray-400 hover:text-gray-200"
    }
    ${disabled ? "opacity-50 cursor-not-allowed" : ""}`;

  const getIcon = () => {
    const size = window.innerWidth >= 768 ? 18 : 16;
    switch (type) {
      case MessageType.GLOBAL:
        return <Hash size={size} />;
      case MessageType.ROOM:
        return <Users size={size} />;
      case MessageType.PRIVATE:
        return <AtSign size={size} />;
    }
  };

  return (
    <button
      className={baseClass}
      onClick={onClick}
      disabled={disabled}
      title={`${type.toLowerCase()} chat`}
    >
      {getIcon()}
    </button>
  );
};
