import { Server } from "socket.io";
import { Events, ServerPayloads } from "@/events";
import {
  User,
  Room,
  BaseMessage,
  LobbyMessage,
  RoomMessage,
  PrivateMessage,
} from "../models";

export class EventBroadcaster {
  private static instance: EventBroadcaster;

  constructor(
    private readonly io: Server,
    private readonly users: Map<string, User>,
    private readonly rooms: Map<string, Room>
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
    const lobbyState: ServerPayloads["global:state"] = {
      rooms: Object.fromEntries(
        [...this.rooms].map(([id, r]) => [id, r.getState()])
      ),
      users: Object.fromEntries(
        [...this.users]
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

  public pause(room: Room): void {
    this.io.to(room.id).emit(Events.GAME_PAUSE);
  }

  public resume(room: Room): void {
    this.io.to(room.id).emit(Events.GAME_RESUME);
  }

  public end(room: Room, result: ServerPayloads["game:end"]): void {
    this.io.to(room.id).emit(Events.GAME_END, result);
  }

  public start(room: Room): void {
    this.io.to(room.id).emit(Events.round_end);
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
