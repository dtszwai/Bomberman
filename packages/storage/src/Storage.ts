import { eq } from "drizzle-orm";
import type { Db } from "./db";
import { matches, replayEvents, users } from "./schema";
import type { NewMatch, NewReplayEvent, NewUser } from "./schema";

/**
 * Match/event writer used by game rooms. All writes are fire-and-forget
 * — callers hand off and continue the tick loop without awaiting. Errors
 * are logged but never thrown back into game logic.
 */
export class Storage {
  constructor(
    private readonly db: Db,
    private readonly onError: (err: Error) => void = console.error
  ) {}

  upsertUser(user: NewUser): void {
    this.db
      .insert(users)
      .values(user)
      .onConflictDoUpdate({ target: users.id, set: { name: user.name } })
      .catch(this.onError);
  }

  startMatch(match: NewMatch): void {
    this.db.insert(matches).values(match).catch(this.onError);
  }

  endMatch(matchId: string, winnerSeat: number | null): void {
    this.db
      .update(matches)
      .set({ endedAt: new Date(), winnerSeat })
      .where(eq(matches.id, matchId))
      .catch(this.onError);
  }

  /**
   * Insert a batch of events for a single match. Events from one tick
   * can be accumulated and sent as a single multi-value insert.
   */
  appendEvents(events: NewReplayEvent[]): void {
    if (events.length === 0) return;
    this.db.insert(replayEvents).values(events).catch(this.onError);
  }
}
