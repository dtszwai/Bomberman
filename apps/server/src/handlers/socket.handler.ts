import { ClientPayloads, Events, ServerPayloads } from "@arcade/games-bomberman/sim";
import { DisconnectReason, Socket } from "socket.io";
import { BaseSocketHandler } from "@arcade/transport/server";
import {
  EventBroadcaster,
  GameService,
  MessageService,
  RoomService,
  User,
  UserService,
  logger,
} from "@arcade/lobby";
import type { GameState } from "@arcade/games-bomberman/sim";
import { BombermanRoom } from "@arcade/games-bomberman/room";

export class SocketHandler extends BaseSocketHandler<User> {
  constructor(
    private userService: UserService,
    private roomService: RoomService<GameState>,
    private messageService: MessageService,
    private gameService: GameService<GameState>
  ) {
    super();
  }

  bindEvents(socket: Socket, user: User): void {
    logger.info("Socket connected\n", {
      name: user.name,
      id: user.id,
      socketId: socket.id,
      address:
        socket.handshake.headers["x-forwarded-for"] || socket.handshake.address,
      userAgent: socket.handshake.headers["user-agent"],
    });

    // Resync on (re)connect: if this user is seated in an active game
    // room, rejoin the socket.io room and ship the current round's
    // static data + latest snapshot.
    if (user.position?.roomId) {
      const existingRoom = this.roomService.getRoom(user.position.roomId);
      if (existingRoom instanceof BombermanRoom) {
        socket.join(existingRoom.id);
        const resync = existingRoom.getResyncPayload();
        if (resync) EventBroadcaster.getInstance().resync(user, resync);
      }
    }

    socket.on(
      Events.CREATE_ROOM,
      (
        settings: ClientPayloads["room:create"],
        callback: (result: ServerPayloads["room:create"]) => void
      ) => {
        const result = this.roomService.createRoom(user, settings);
        if (result.success) {
          socket.join(result.data!.id);
        }
        callback({ ...result, data: result.data?.getState() });
      }
    );

    socket.on(
      Events.JOIN_ROOM,
      (
        payload: ClientPayloads["room:join"],
        callback: (result: ServerPayloads["room:join"]) => void
      ) => {
        const result = this.roomService.joinRoom(
          user,
          payload.roomId,
          payload.seatIndex
        );

        if (result.success) {
          socket.join(payload.roomId);
        }

        callback(result);
      }
    );

    socket.on(
      Events.UPDATE_ROOM_SETTINGS,
      (
        payload: ClientPayloads["room:updateSettings"],
        callback: (result: ServerPayloads["room:updateSettings"]) => void
      ) =>
        callback(
          this.roomService.updateRoomSettings(
            user,
            payload.roomId,
            payload.settings
          )
        )
    );

    socket.on(
      Events.LEAVE_ROOM,
      (_, callback: (result: ServerPayloads["room:leave"]) => void) =>
        callback(this.roomService.leaveRoom(user))
    );

    socket.on(
      Events.ADD_BOT,
      (
        payload: ClientPayloads["room:addBot"],
        callback: (result: ServerPayloads["room:addBot"]) => void
      ) =>
        callback(
          this.roomService.addBot(user, payload.roomId, {
            seatIndex: payload.seatIndex,
            difficulty: payload.difficulty,
            name: payload.name,
          })
        )
    );

    socket.on(
      Events.REMOVE_BOT,
      (
        payload: ClientPayloads["room:removeBot"],
        callback: (result: ServerPayloads["room:removeBot"]) => void
      ) =>
        callback(
          this.roomService.removeBot(user, payload.roomId, payload.seatIndex)
        )
    );

    socket.on(
      Events.UPDATE_BOT,
      (
        payload: ClientPayloads["room:updateBot"],
        callback: (result: ServerPayloads["room:updateBot"]) => void
      ) =>
        callback(
          this.roomService.updateBot(user, payload.roomId, payload.seatIndex, {
            difficulty: payload.difficulty,
            name: payload.name,
          })
        )
    );

    socket.on(
      Events.GLOBAL_STATE,
      (_, callback: (result: ServerPayloads["global:state"]) => void) =>
        callback(this.roomService.getGlobalState())
    );

    socket.on(
      Events.UPDATE_PROFILE,
      (
        payload: ClientPayloads["user:updateProfile"],
        callback: (result: ServerPayloads["user:updateProfile"]) => void
      ) => {
        try {
          user.updateProfile(payload);
          const emitter = EventBroadcaster.getInstance();
          emitter.whoami(user);
          emitter.lobby();
          if (user.position?.roomId) {
            const room = this.roomService.getRoom(user.position.roomId);
            if (room) emitter.room(room);
          }
          callback({ success: true, data: user.getState() });
        } catch (e) {
          const error = e instanceof Error ? e.message : "Unknown error";
          logger.error(error);
          callback({ success: false, message: error });
        }
      }
    );

    socket.on(
      Events.CREATE_MESSAGE,
      (
        payload: ClientPayloads["message:create"],
        callback: (result: ServerPayloads["message:create"]) => void
      ) => callback(this.messageService.createMessage(user, payload))
    );

    socket.on(
      Events.START_GAME,
      (_, callback: (result: ServerPayloads["game:start"]) => void) =>
        callback(this.gameService.startGame(user))
    );

    socket.on(
      Events.ROOM_READY,
      (_, callback: (result: ServerPayloads["game:ready"]) => void) =>
        callback(this.gameService.toggleReady(user))
    );

    // Fire-and-forget — no ack. Server-side ActionHandler drops stale seq.
    socket.on(
      Events.USER_CONTROLS,
      (controls: ClientPayloads["game:controls"]) =>
        this.gameService.handleUserInput(user, controls)
    );

    socket.on("disconnect", (reason: DisconnectReason) =>
      this.handleDisconnect(socket, user, reason)
    );

    EventBroadcaster.getInstance().lobby();
  }

  private handleDisconnect(
    socket: Socket,
    user: User,
    reason: DisconnectReason
  ): void {
    this.userService.setOffline(user);

    if (user.position) {
      this.roomService.leaveRoom(user);
    }

    EventBroadcaster.getInstance().lobby();
    logger.info("Socket disconnected\n", {
      name: user.name,
      id: socket.id,
      reason,
    });
  }
}
