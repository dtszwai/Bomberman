import type { Socket } from "socket.io";

/**
 * Base shape for a server-side socket handler: one method per bound event.
 * Game packages subclass to register game-specific events on top of
 * lobby-level bindings.
 *
 * Handshake `auth` is treated opaquely so JWT can drop in later without
 * touching call sites.
 */
export abstract class BaseSocketHandler<UserT = unknown> {
  abstract bindEvents(socket: Socket, user: UserT): void;
}

export type HandshakeAuth = Record<string, unknown>;

export function readHandshakeAuth(socket: Socket): HandshakeAuth {
  return (socket.handshake.auth ?? {}) as HandshakeAuth;
}
