import { Server } from "socket.io";
import { Events, ServerEvents } from "@/events";
import { User } from "../models/User";
import { Room } from "../models/Room";
import { BaseMessage } from "../models/Message/BaseMessage";
import { LobbyMessage } from "../models/Message/LobbyMessage";
import { RoomMessage } from "../models/Message/RoomMessage";
import { PrivateMessage } from "../models/Message/PrivateMessage";

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
      .emit(Events.WHOAMI, user.getState() as ServerEvents["whoami"]);
  }

  public lobby() {
    const lobbyState: ServerEvents["lobbyState"] = {
      rooms: Object.fromEntries(
        [...this.rooms].map(([id, r]) => [id, r.getState()])
      ),
      users: Object.fromEntries(
        [...this.users]
          .filter(([_, user]) => user.online)
          .map(([id, u]) => [id, u.getState()])
      ),
    };
    this.io.emit(Events.LOBBY_STATE, lobbyState);
  }

  public room(room: Room) {
    this.io
      .to(room.id)
      .emit(Events.ROOM_STATE, room.getState() as ServerEvents["roomState"]);
  }

  public gameSnapshot(
    room: Room,
    snapshot: ServerEvents["gameSnapshot"]
  ): void {
    this.io.to(room.id).emit(Events.GAME_SNAPSHOT, snapshot);
  }

  public pause(room: Room): void {
    this.io.to(room.id).emit(Events.GAME_PAUSED);
  }

  public resume(room: Room): void {
    this.io.to(room.id).emit(Events.GAME_RESUMED);
  }

  public end(room: Room, result: ServerEvents["gameEnded"]): void {
    this.io.to(room.id).emit(Events.GAME_ENDED, result);
  }

  public start(room: Room): void {
    this.io.to(room.id).emit(Events.ROUND_START);
  }

  public chat(message: BaseMessage): void {
    if (message instanceof LobbyMessage) {
      this.io.emit(
        Events.LOBBY_MESSAGE,
        message.toChatMessage() as ServerEvents["lobby:message"]
      );
    } else if (message instanceof RoomMessage) {
      this.io
        .to(message.to.id)
        .emit(
          Events.ROOM_MESSAGE,
          message.toChatMessage() as ServerEvents["room:message"]
        );
    } else if (message instanceof PrivateMessage) {
      this.io
        .to(message.to.socketId)
        .emit(
          Events.PRIVATE_MESSAGE,
          message.toChatMessage() as ServerEvents["user:message"]
        );
      this.io
        .to(message.from.socketId)
        .emit(
          Events.PRIVATE_MESSAGE,
          message.toChatMessage() as ServerEvents["user:message"]
        );
    } else {
      throw new Error("Unsupported message type");
    }
  }

  public chatHistory(user: User, messages: LobbyMessage[]): void {
    messages.forEach((message) => {
      this.io.to(user.socketId).emit(Events.LOBBY_MESSAGE, message);
    });
  }
}
