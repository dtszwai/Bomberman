import type { Server as HttpServer } from "http";
import type { Server as IoServer } from "socket.io";
import { logger } from "./logger";

function stopHttpAndSocketServers(ioServer: IoServer, httpServer: HttpServer) {
  ioServer.close();
  httpServer.close();
}

export async function registerViteHmrServerRestart(
  ioServer: IoServer,
  httpServer: HttpServer
) {
  if (import.meta.hot) await import.meta.hot.data.stopping;
  if (import.meta.hot) {
    let reload = () => (
      logger.debug("Performing an HMR reload..."),
      stopHttpAndSocketServers(ioServer, httpServer)
    );
    import.meta.hot.on("vite:beforeFullReload", () => {
      const stopping = reload();
      reload = () => Promise.resolve();
      if (import.meta.hot) import.meta.hot.data.stopping = stopping;
    });
  }
}
