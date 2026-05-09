import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema";

const { Pool } = pg;

export type Db = ReturnType<typeof drizzle<typeof schema>>;

export interface CreateDbOptions {
  url: string;
  max?: number;
}

/**
 * Single entrypoint so other packages don't each import `pg`. Returns
 * the drizzle client and the pool for shutdown.
 */
export function createDb(
  options: string | CreateDbOptions
): { db: Db; pool: pg.Pool; schema: typeof schema } {
  const { url, max = 10 } =
    typeof options === "string" ? { url: options, max: 10 } : options;
  const pool = new Pool({ connectionString: url, max });
  const db = drizzle(pool, { schema });
  return { db, pool, schema };
}
