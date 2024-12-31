import { Server } from "socket.io";
import { Events, ServerPayloads } from "@/events";
import {
  User,
  Room,
  BaseMessage,
  LobbyMessage,
  RoomMessage,
  PrivateMessage,
  RoomService,
} from "../models";
import { UserService } from "../models/user";

export class EventBroadcaster {
  private static instance: EventBroadcaster;

  constructor(
    private readonly io: Server,
    private readonly userService: UserService,
    private readonly roomService: RoomService
  ) {
    EventBroadcaster.instance = this;
  }

  public static getInstance(): EventBroadcaster {
    if (!EventBroadcaster.instance) {
      throw new Error("EventBroadcaster must be initialized first");
    }
    return EventBroadcaster.instance;
  }

  public whoami(user: User) {
    this.io
      .to(user.socketId)
      .emit(Events.USER_STATE, user.getState() as ServerPayloads["user:state"]);
  }

  public lobby() {
    const rooms = this.roomService.getRooms();
    const users = this.userService.getOnlineUsers();

    const lobbyState: ServerPayloads["global:state"] = {
      rooms: Object.fromEntries(
        [...rooms].map(([id, r]) => [id, r.getState()])
      ),
      users: Object.fromEntries(
        [...users]
          .filter(([_, user]) => user.online)
          .map(([id, u]) => [id, u.getState()])
      ),
    };
    this.io.emit(Events.GLOBAL_STATE, lobbyState);
  }

  public room(room: Room) {
    this.io
      .to(room.id)
      .emit(Events.ROOM_STATE, room.getState() as ServerPayloads["room:state"]);
  }

  public gameSnapshot(
    room: Room,
    snapshot: ServerPayloads["game:snapshot"]
  ): void {
    this.io.to(room.id).emit(Events.GAME_SNAPSHOT, snapshot);
  }

  public chat(message: BaseMessage): void {
    if (message instanceof LobbyMessage) {
      this.io.emit(
        Events.GLOBAL_MESSAGE,
        message.toChatMessage() as ServerPayloads["global:message"]
      );
    } else if (message instanceof RoomMessage) {
      this.io
        .to(message.to.id)
        .emit(
          Events.ROOM_MESSAGE,
          message.toChatMessage() as ServerPayloads["room:message"]
        );
    } else if (message instanceof PrivateMessage) {
      this.io
        .to(message.to.socketId)
        .emit(
          Events.PRIVATE_MESSAGE,
          message.toChatMessage() as ServerPayloads["user:message"]
        );
      this.io
        .to(message.from.socketId)
        .emit(
          Events.PRIVATE_MESSAGE,
          message.toChatMessage() as ServerPayloads["user:message"]
        );
    } else {
      throw new Error("Unsupported message type");
    }
  }

  public chatHistory(user: User, messages: LobbyMessage[]): void {
    messages.forEach((message) => {
      this.io.to(user.socketId).emit(Events.GLOBAL_MESSAGE, message);
    });
  }
}
