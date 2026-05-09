/** Minimum shape for anything buffered + interpolated by netcode. */
export interface TimestampedSnapshot {
  timestamp: number;
}

/**
 * Bounded snapshot buffer. Oldest entry evicted when the buffer hits
 * `maxSize`. Exposes the underlying array for callers that need to iterate
 * (the interpolator, resync flows that want to clear and seed).
 */
export class SnapshotBuffer<S extends TimestampedSnapshot> {
  private readonly items: S[] = [];

  constructor(public readonly maxSize: number = 6) {}

  push(snapshot: S): void {
    this.items.push(snapshot);
    if (this.items.length > this.maxSize) this.items.shift();
  }

  clear(): void {
    this.items.length = 0;
  }

  values(): readonly S[] {
    return this.items;
  }

  latest(): S | undefined {
    return this.items[this.items.length - 1];
  }

  get length(): number {
    return this.items.length;
  }

  /** Reset and seed with a single snapshot (common resync path). */
  reset(seed?: S): void {
    this.clear();
    if (seed) this.items.push(seed);
  }
}
