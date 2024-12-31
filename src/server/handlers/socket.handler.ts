import { ClientPayloads, Events, ServerPayloads } from "@/events";
import { Socket } from "socket.io";
import { MessageService, RoomService, User } from "../models";
import { UserService } from "../models/user";
import { emitter } from "..";
import { GameService } from "../models/room/game.service";

export class SocketHandler {
  constructor(
    private userService: UserService,
    private roomService: RoomService,
    private messageService: MessageService,
    private gameService: GameService
  ) {}

  bindEvents(socket: Socket, user: User): void {
    // Room events
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
      Events.LEAVE_ROOM,
      (_, callback: (result: ServerPayloads["room:leave"]) => void) =>
        callback(this.roomService.leaveRoom(user))
    );

    socket.on(
      Events.GLOBAL_STATE,
      (_, callback: (result: ServerPayloads["global:state"]) => void) =>
        callback(this.roomService.getGlobalState())
    );

    // Message events
    socket.on(
      Events.CREATE_MESSAGE,
      (
        payload: ClientPayloads["message:create"],
        callback: (result: ServerPayloads["message:create"]) => void
      ) => callback(this.messageService.createMessage(user, payload))
    );

    // Game events
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

    socket.on(
      Events.USER_CONTROLS,
      (
        controls: ClientPayloads["game:controls"],
        callback: (result: ServerPayloads["game:controls"]) => void
      ) => callback(this.gameService.handleUserInput(user, controls))
    );

    // Disconnect
    socket.on("disconnect", () => this.handleDisconnect(socket, user));
  }

  private handleDisconnect(socket: Socket, user: User): void {
    this.userService.setOffline(user);

    if (user.position) {
      this.roomService.leaveRoom(user);
    }
  }
}
