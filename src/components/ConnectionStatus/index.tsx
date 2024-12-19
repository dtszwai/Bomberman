import { useEffect, useState } from "react";
import styles from "./ConnectionStatus.module.css";

interface ConnectionStatusProps {
  isConnected: boolean;
  reconnectAttempts: number;
  initialConnecting: boolean;
  maxReconnectAttempts?: number;
}

const ConnectionStatus = ({
  isConnected,
  reconnectAttempts,
  initialConnecting,
  maxReconnectAttempts = 5,
}: ConnectionStatusProps) => {
  const [showStatus, setShowStatus] = useState(false);

  useEffect(() => {
    let displayTimeout: NodeJS.Timeout;

    if (initialConnecting) {
      displayTimeout = setTimeout(() => {
        setShowStatus(true);
      }, 500);
    } else {
      setShowStatus(true);
    }

    return () => {
      clearTimeout(displayTimeout);
    };
  }, [initialConnecting]);

  if (
    (isConnected && reconnectAttempts === 0) ||
    (initialConnecting && !showStatus)
  ) {
    return null;
  }

  const statusClassName = `${styles.status} ${
    initialConnecting
      ? styles.connecting
      : isConnected
      ? styles.connected
      : styles.disconnected
  } ${showStatus ? styles.visible : ""}`;

  let message = "";
  if (initialConnecting && showStatus) {
    message = "Connecting to game server...";
  } else if (!isConnected && reconnectAttempts < maxReconnectAttempts) {
    message = "Lost connection to game server. Attempting to reconnect...";
  } else if (!isConnected && reconnectAttempts >= maxReconnectAttempts) {
    message = "Unable to connect to game server. Please refresh the page.";
  } else if (isConnected && reconnectAttempts > 0) {
    message = "Reconnected to server successfully!";
  }

  return message ? (
    <div className={statusClassName} role="alert">
      {message}
    </div>
  ) : null;
};

export default ConnectionStatus;
