import { CoreEvents } from "@arcade/protocol";
import type { Server } from "socket.io";
import type { BaseMessage } from "./message/BaseMessage";
import { LobbyMessage } from "./message/LobbyMessage";
import { PrivateMessage } from "./message/PrivateMessage";
import { RoomMessage } from "./message/RoomMessage";
import type { BaseRoom } from "./room/BaseRoom";
import type { RoomService } from "./room/RoomService";
import type { UserService } from "./user/UserService";
import type { User } from "./user/User";

/**
 * Socket.io fan-out for lobby-level events. Game packages call `toRoom`
 * / `toUser` for their own event ids; core events (whoami, lobby, room,
 * gameSnapshot, roundStarted, resync, chat) are typed to their protocol
 * event ids.
 */
export class EventBroadcaster {
  private static instance: EventBroadcaster;

  constructor(
    private readonly io: Server,
    private readonly userService: UserService,
    private readonly roomService: RoomService<unknown>
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
    this.io.to(user.socketId).emit(CoreEvents.USER_STATE, user.getState());
  }

  public lobby() {
    const rooms = this.roomService.getRooms();
    const users = this.userService.getOnlineUsers();

    const lobbyState = {
      rooms: Object.fromEntries(
        [...rooms].map(([id, r]) => [id, r.getState()])
      ),
      users: Object.fromEntries(
        [...users]
          .filter(([_, user]) => user.online)
          .map(([id, u]) => [id, u.getState()])
      ),
    };
    this.io.emit(CoreEvents.GLOBAL_STATE, lobbyState);
  }

  public room(room: BaseRoom) {
    this.io.to(room.id).emit(CoreEvents.ROOM_STATE, room.getState());
  }

  public gameSnapshot(room: BaseRoom, snapshot: unknown): void {
    this.io.to(room.id).emit(CoreEvents.GAME_SNAPSHOT, snapshot);
  }

  public roundStarted(room: BaseRoom, payload: unknown): void {
    this.io.to(room.id).emit(CoreEvents.ROUND_STARTED, payload);
  }

  public resync(user: User, payload: unknown): void {
    this.io.to(user.socketId).emit(CoreEvents.GAME_RESYNC, payload);
  }

  /** Generic room-targeted emit for game-specific events. */
  public toRoom(roomId: string, eventName: string, payload: unknown): void {
    this.io.to(roomId).emit(eventName, payload);
  }

  /** Generic user-targeted emit. */
  public toUser(socketId: string, eventName: string, payload: unknown): void {
    this.io.to(socketId).emit(eventName, payload);
  }

  public chat(message: BaseMessage): void {
    if (message instanceof LobbyMessage) {
      this.io.emit(CoreEvents.GLOBAL_MESSAGE, message.toChatMessage());
    } else if (message instanceof RoomMessage) {
      this.io
        .to(message.to.id)
        .emit(CoreEvents.ROOM_MESSAGE, message.toChatMessage());
    } else if (message instanceof PrivateMessage) {
      this.io
        .to(message.to.socketId)
        .emit(CoreEvents.PRIVATE_MESSAGE, message.toChatMessage());
      this.io
        .to(message.from.socketId)
        .emit(CoreEvents.PRIVATE_MESSAGE, message.toChatMessage());
    } else {
      throw new Error("Unsupported message type");
    }
  }

  public chatHistory(user: User, messages: LobbyMessage[]): void {
    messages.forEach((message) => {
      this.io.to(user.socketId).emit(CoreEvents.GLOBAL_MESSAGE, message);
    });
  }
}
