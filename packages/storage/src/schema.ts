import {
  bigint,
  integer,
  jsonb,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

type StoredMatchSeat = {
  index: number;
  actor:
    | { kind: "human"; userId: string }
    | {
        kind: "bot";
        botId: string;
        name: string;
        difficulty: "easy" | "normal" | "hard" | "hell";
        seed: number;
      }
    | null;
};

export const users = pgTable("user", {
  id: varchar("id", { length: 64 }).primaryKey(),
  name: text("name").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const matches = pgTable("match", {
  id: uuid("id").primaryKey(),
  gameType: text("game_type").notNull(),
  roomId: text("room_id").notNull(),
  startedAt: timestamp("started_at").notNull(),
  endedAt: timestamp("ended_at"),
  winnerSeat: integer("winner_seat"),
  seats: jsonb("seats").$type<StoredMatchSeat[]>().notNull(),
  mapSeed: bigint("map_seed", { mode: "number" }),
  settings: jsonb("settings"),
});

export const replayEvents = pgTable(
  "replay_event",
  {
    matchId: uuid("match_id")
      .references(() => matches.id)
      .notNull(),
    seq: integer("seq").notNull(),
    timestampMs: bigint("timestamp_ms", { mode: "number" }).notNull(),
    type: text("type").notNull(),
    payload: jsonb("payload").notNull(),
  },
  (t) => [primaryKey({ columns: [t.matchId, t.seq] })]
);

export type NewUser = typeof users.$inferInsert;
export type NewMatch = typeof matches.$inferInsert;
export type NewReplayEvent = typeof replayEvents.$inferInsert;
