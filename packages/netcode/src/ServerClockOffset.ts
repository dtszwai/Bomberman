/**
 * EMA-smoothed estimate of (server_ts - client_now). Lets the client
 * render "server time" without hard syncing — renderAt = Date.now() +
 * offset - interpolationDelay.
 */
export class ServerClockOffset {
  private offset = 0;
  private initialised = false;

  constructor(private readonly alpha: number = 0.1) {}

  sample(serverTs: number, clientNow: number = Date.now()): void {
    const sampled = serverTs - clientNow;
    if (!this.initialised) {
      this.offset = sampled;
      this.initialised = true;
      return;
    }
    this.offset = (1 - this.alpha) * this.offset + this.alpha * sampled;
  }

  get value(): number {
    return this.offset;
  }

  /** Server's estimated wall-clock time "now". */
  now(clientNow: number = Date.now()): number {
    return clientNow + this.offset;
  }
}
