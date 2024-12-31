import { User } from "./User";

export class UserService {
  private users = new Map<string, User>();

  createUser(socketId: string, name?: string): User {
    const user = new User(socketId, name);
    this.users.set(user.id, user);
    return user;
  }

  getUser(userId: string): User | undefined {
    return this.users.get(userId);
  }

  getUsers(): Map<string, User> {
    return this.users;
  }

  setOffline(user: User): void {
    user.setOffline();
    // Don't delete to allow reconnection
  }

  getOnlineUsers(): Map<string, User> {
    return new Map([...this.users].filter(([_, user]) => user.online));
  }
}
