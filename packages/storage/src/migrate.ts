import { migrate } from "drizzle-orm/node-postgres/migrator";
import { createDb } from "./db";

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL not set");
  process.exit(1);
}

const { db, pool } = createDb(url);
await migrate(db, { migrationsFolder: "./migrations" });
await pool.end();
console.log("migrations applied");
