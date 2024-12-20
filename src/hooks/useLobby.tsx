import { useCallback, useEffect, useState } from "react";
import { socket } from "../apis/socket";
import { ClientEvents, Events, ServerEvents } from "@/events";
import { UserState, AnyRoomState, LobbyState } from "@/server/types";

interface State extends LobbyState {
  currentUser: UserState | null;
  currentRoom: AnyRoomState | null;
  isConnected: boolean;
  reconnectAttempts: number;
  initialConnecting: boolean;
}

const initialState: State = {
  rooms: {},
  users: {},
  currentUser: null,
  currentRoom: null,
  isConnected: socket.connected,
  reconnectAttempts: 0,
  initialConnecting: true,
};

export function useLobby() {
  const [state, setState] = useState(initialState);

  const updateState = useCallback((updates: Partial<State>) => {
    setState((prevState) => ({ ...prevState, ...updates }));
  }, []);

  useEffect(() => {
    const initialConnectionTimeout = setTimeout(() => {
      if (state.initialConnecting) {
        updateState({ initialConnecting: false });
      }
    }, 2000); // Allow 2 seconds for initial connection

    return () => clearTimeout(initialConnectionTimeout);
  }, [state.initialConnecting, updateState]);

  const onConnect = useCallback(
    () =>
      updateState({
        isConnected: true,
        reconnectAttempts: 0,
        initialConnecting: false,
      }),
    [updateState]
  );

  const onDisconnect = useCallback(
    () => updateState({ isConnected: false, initialConnecting: false }),
    [updateState]
  );

  const onReconnectAttempt = useCallback(
    (attempt: number) =>
      updateState({ reconnectAttempts: attempt, initialConnecting: false }),
    [updateState]
  );

  const handleWhoami = useCallback(
    (user: ServerEvents["whoami"]) => {
      updateState({ currentUser: user });
    },
    [updateState]
  );

  const handleRoomState = useCallback(
    (room: ServerEvents["roomState"]) => {
      updateState({ currentRoom: room });
    },
    [updateState]
  );

  const handleLobbyState = useCallback(
    (state: ServerEvents["lobbyState"]) => {
      updateState({ rooms: state.rooms, users: state.users });
    },
    [updateState]
  );

  useEffect(() => {
    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.io.on("reconnect_attempt", onReconnectAttempt);

    socket.on(Events.WHOAMI, handleWhoami);
    socket.on(Events.ROOM_STATE, handleRoomState);
    socket.on(Events.LOBBY_STATE, handleLobbyState);

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.io.off("reconnect_attempt", onReconnectAttempt);
      socket.off(Events.WHOAMI, handleWhoami);
      socket.off(Events.ROOM_STATE, handleRoomState);
      socket.off(Events.LOBBY_STATE, handleLobbyState);
    };
  }, [
    onConnect,
    onDisconnect,
    onReconnectAttempt,
    handleWhoami,
    handleRoomState,
    handleLobbyState,
  ]);

  const createRoom = async (
    dto?: ClientEvents["createRoom"]
  ): Promise<AnyRoomState> => {
    if (!state.isConnected) {
      throw new Error("Cannot create room while disconnected from server");
    }

    return new Promise((resolve, reject) => {
      socket.emit(
        Events.CREATE_ROOM,
        dto,
        (result: ServerEvents["createRoom"]) => {
          if (result.success) {
            updateState({ currentRoom: result.data! });
            resolve(result.data!);
          } else {
            reject(new Error(result.message));
          }
        }
      );
    });
  };

  const joinRoom = async (
    dto: ClientEvents["joinRoom"]
  ): Promise<AnyRoomState> => {
    if (!state.isConnected) {
      throw new Error("Cannot join room while disconnected from server");
    }

    return new Promise((resolve, reject) => {
      socket.emit(Events.JOIN_ROOM, dto, (result: ServerEvents["joinRoom"]) => {
        if (result.success) {
          updateState({ currentRoom: result.data! });
          resolve(result.data!);
        } else {
          reject(new Error(result.message));
        }
      });
    });
  };

  const leaveRoom = async () => {
    if (!state.isConnected) {
      throw new Error("Cannot leave room while disconnected from server");
    }

    return new Promise<void>((resolve, reject) => {
      socket.emit(
        Events.LEAVE_ROOM,
        null,
        (result: ServerEvents["leaveRoom"]) => {
          if (result.success) {
            updateState({ currentRoom: null });
            resolve();
          } else {
            reject(new Error(result.message));
          }
        }
      );
    });
  };

  const startGame = async () => {
    if (!state.isConnected) {
      throw new Error("Cannot start game while disconnected from server");
    }

    return new Promise<void>((resolve, reject) => {
      socket.emit(
        Events.START_GAME,
        null,
        (result: ServerEvents["startGame"]) => {
          if (result.success) {
            resolve();
          } else {
            reject(new Error(result.message));
          }
        }
      );
    });
  };

  const toggleReady = async () => {
    if (!state.isConnected) {
      throw new Error("Cannot toggle ready while disconnected from server");
    }

    return new Promise<void>((resolve, reject) => {
      socket.emit(
        Events.TOGGLE_READY,
        null,
        (result: ServerEvents["toggleReady"]) => {
          if (result.success) {
            resolve();
          } else {
            reject(new Error(result.message));
          }
        }
      );
    });
  };

  return { state, createRoom, joinRoom, leaveRoom, startGame, toggleReady };
}
