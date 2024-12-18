import React from "react";

interface ConnectionStatusProps {
  isConnected: boolean;
  reconnectAttempts: number;
  maxReconnectAttempts?: number;
}

const ConnectionStatus: React.FC<ConnectionStatusProps> = ({
  isConnected,
  reconnectAttempts,
  maxReconnectAttempts = 5,
}) => {
  if (isConnected && reconnectAttempts === 0) {
    return null;
  }

  const style: React.CSSProperties = {
    position: "fixed",
    bottom: "1rem",
    right: "1rem",
    backgroundColor: "#ef4444",
    color: "white",
    padding: "1rem",
    borderRadius: "0.375rem",
    boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
    zIndex: 50,
    maxWidth: "24rem",
    animation: "slideIn 0.2s ease-out",
  };

  let message = "";
  if (!isConnected && reconnectAttempts < maxReconnectAttempts) {
    message = "Lost connection to game server. Attempting to reconnect...";
  } else if (!isConnected && reconnectAttempts >= maxReconnectAttempts) {
    message = "Unable to connect to game server. Please refresh the page.";
  } else if (isConnected && reconnectAttempts > 0) {
    message = "Reconnected to server successfully!";
  }

  return (
    <div style={style} role="alert">
      <style>
        {`
          @keyframes slideIn {
            from {
              transform: translateY(100%);
              opacity: 0;
            }
            to {
              transform: translateY(0);
              opacity: 1;
            }
          }
        `}
      </style>
      {message}
    </div>
  );
};

export default ConnectionStatus;
