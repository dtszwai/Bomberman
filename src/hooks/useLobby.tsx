import { useCallback, useEffect, useState } from "react";
import { socket } from "../apis/socket";
import { Player, RoomState } from "@/server/types";
import { ClientEvents, Events, ServerEvents } from "@/events";

interface LobbyState {
  rooms: Record<string, RoomState>;
  players: Record<string, Player>;
  currentPlayer: Player | null;
  currentRoom: RoomState | null;
  isConnected: boolean;
  reconnectAttempts: number;
}

const initialState: LobbyState = {
  rooms: {},
  players: {},
  currentPlayer: null,
  currentRoom: null,
  isConnected: socket.connected,
  reconnectAttempts: 0,
};

export function useLobby() {
  const [state, setState] = useState(initialState);

  const updateState = useCallback((updates: Partial<LobbyState>) => {
    setState((prevState) => ({ ...prevState, ...updates }));
  }, []);

  useEffect(() => {
    const onConnect = () =>
      updateState({ isConnected: true, reconnectAttempts: 0 });

    const onDisconnect = () => updateState({ isConnected: false });

    const onReconnectAttempt = (attempt: number) =>
      updateState({ reconnectAttempts: attempt });

    socket.on("connect", onConnect);

    socket.on("disconnect", onDisconnect);

    socket.io.on("reconnect_attempt", onReconnectAttempt);

    socket.on(Events.PLAYER_STATE, (player: ServerEvents["playerState"]) => {
      updateState({ currentPlayer: player });
    });

    socket.on(Events.ROOM_STATE, (room: ServerEvents["roomState"]) => {
      updateState({ currentRoom: room });
    });

    socket.on(Events.LOBBY_STATE, (state: ServerEvents["lobbyState"]) => {
      updateState({ rooms: state.rooms, players: state.players });
    });

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.io.off("reconnect_attempt", onReconnectAttempt);
      socket.off(Events.PLAYER_STATE);
      socket.off(Events.ROOM_STATE);
      socket.off(Events.LOBBY_STATE);
    };
  }, [updateState]);

  const createRoom = async (
    dto: ClientEvents["createRoom"]
  ): Promise<RoomState> => {
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
  ): Promise<RoomState> => {
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

  return { state, createRoom, joinRoom, leaveRoom, startGame };
}
