/**
 * Fixed-step ticker with a delta accumulator.
 *
 * Drives a simulation at exactly `stepMs` intervals regardless of how
 * frequently the host (RAF, setInterval) calls {@link tick}. If the host
 * fires late, catch-up ticks run until the accumulator is below one step.
 *
 * Guards against the "spiral of death" by clamping a single real-time
 * delta to 5 steps' worth — if the process was paused (tab backgrounded,
 * server event-loop blocked), we don't try to simulate the missed seconds.
 */
export class Ticker {
  private lastTime = 0;
  private accumulator = 0;
  private readonly stepSeconds: number;

  constructor(
    private readonly stepMs: number,
    private readonly onStep: (stepSeconds: number, now: number) => void
  ) {
    this.stepSeconds = stepMs / 1000;
  }

  public tick(now: number = Date.now()): void {
    if (this.lastTime === 0) {
      this.lastTime = now;
      return;
    }

    let delta = now - this.lastTime;
    this.lastTime = now;

    const maxDelta = this.stepMs * 5;
    if (delta > maxDelta) delta = maxDelta;

    this.accumulator += delta;
    while (this.accumulator >= this.stepMs) {
      this.onStep(this.stepSeconds, now);
      this.accumulator -= this.stepMs;
    }
  }

  public reset(): void {
    this.lastTime = 0;
    this.accumulator = 0;
  }
}
