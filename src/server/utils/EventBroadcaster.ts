import { Server } from "socket.io";
import { Events, ServerEvents } from "@/events";
import { User } from "../models/User";
import { Room } from "../models/Room";

export class EventBroadcaster {
  private static instance: EventBroadcaster;
  private readonly io: Server;
  private readonly users: Map<string, User>;
  private readonly rooms: Map<string, Room>;

  constructor(io: Server, users: Map<string, User>, rooms: Map<string, Room>) {
    this.io = io;
    this.users = users;
    this.rooms = rooms;
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
      .to(user.id)
      .emit(Events.WHOAMI, user.getState() as ServerEvents["whoami"]);
  }

  public lobby() {
    const lobbyState: ServerEvents["lobbyState"] = {
      rooms: Object.fromEntries(
        [...this.rooms].map(([id, r]) => [id, r.getState()])
      ),
      users: Object.fromEntries(
        [...this.users].map(([id, u]) => [id, u.getState()])
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
}
