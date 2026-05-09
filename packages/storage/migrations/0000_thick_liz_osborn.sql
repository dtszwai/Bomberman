CREATE TABLE IF NOT EXISTS "match" (
	"id" uuid PRIMARY KEY NOT NULL,
	"game_type" text NOT NULL,
	"room_id" text NOT NULL,
	"started_at" timestamp NOT NULL,
	"ended_at" timestamp,
	"winner_seat" integer,
	"seats" jsonb NOT NULL,
	"map_seed" bigint,
	"settings" jsonb
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "replay_event" (
	"match_id" uuid NOT NULL,
	"seq" integer NOT NULL,
	"timestamp_ms" bigint NOT NULL,
	"type" text NOT NULL,
	"payload" jsonb NOT NULL,
	CONSTRAINT "replay_event_match_id_seq_pk" PRIMARY KEY("match_id","seq")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "user" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "replay_event" ADD CONSTRAINT "replay_event_match_id_match_id_fk" FOREIGN KEY ("match_id") REFERENCES "public"."match"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
