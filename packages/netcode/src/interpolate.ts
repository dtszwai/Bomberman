import { clamp01 } from "./math";
import type { TimestampedSnapshot } from "./SnapshotBuffer";

export interface InterpolationPair<S> {
  prev: S | undefined;
  next: S | undefined;
  /** Fractional progress from prev→next at renderAt; 0 when only next, 1 when only prev. */
  t: number;
}

/**
 * Find the two snapshots flanking `renderAt` for time-based interpolation.
 * Assumes `buffer` is ascending by timestamp (SnapshotBuffer preserves
 * push order).
 *
 * Cases:
 * - all samples are after renderAt → extrapolate backwards: prev=undefined, next=first
 * - all samples are before renderAt → clamp forward: prev=last, next=undefined
 * - otherwise: prev = last sample ≤ renderAt, next = first sample > renderAt
 */
export function findInterpolationPair<S extends TimestampedSnapshot>(
  buffer: readonly S[],
  renderAt: number
): InterpolationPair<S> {
  let prev: S | undefined;
  let next: S | undefined;

  for (const s of buffer) {
    if (s.timestamp <= renderAt) prev = s;
    else {
      next = s;
      break;
    }
  }

  if (!prev) return { prev: undefined, next: buffer[0], t: 0 };
  if (!next) return { prev, next: undefined, t: 1 };

  const span = next.timestamp - prev.timestamp;
  const t = span > 0 ? clamp01((renderAt - prev.timestamp) / span) : 1;
  return { prev, next, t };
}
