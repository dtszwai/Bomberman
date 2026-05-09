import type { Socket } from "socket.io-client";

export const DEFAULT_EMIT_TIMEOUT_MS = 10_000;

export type TypedEmit<
  ClientMap extends object,
  ServerMap extends object
> = <E extends keyof ClientMap & keyof ServerMap & string>(
  event: E,
  arg: ClientMap[E] extends void ? undefined : ClientMap[E]
) => Promise<ServerMap[E]>;

/**
 * Typed Promise wrapper around `socket.emit` with ack callback. Resolves
 * with the ack payload, rejects on timeout or if the ack is an Error.
 */
export function createTypedEmit<
  ClientMap extends object,
  ServerMap extends object
>(
  socket: Socket | null,
  timeoutMs: number = DEFAULT_EMIT_TIMEOUT_MS
): TypedEmit<ClientMap, ServerMap> {
  return ((event, arg) => {
    if (!socket) {
      return Promise.reject(new Error("Socket is not connected"));
    }
    return new Promise((resolve, reject) => {
      const timer = setTimeout(
        () => reject(new Error("Socket request timed out")),
        timeoutMs
      );
      socket.emit(event as string, arg, (response: unknown) => {
        clearTimeout(timer);
        if (response instanceof Error) reject(response);
        else resolve(response as never);
      });
    });
  }) as TypedEmit<ClientMap, ServerMap>;
}
