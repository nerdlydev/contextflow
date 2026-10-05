import { config } from "@contextflow/config";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

/**
 * Raw postgres connection used by Drizzle.
 * In production, a connection pool should be configured here.
 */
const queryClient = postgres(config.DATABASE_URL);

/**
 * Drizzle database instance.
 *
 * Schema will be added as tables are defined in future phases.
 * Example usage:
 *   import { db } from "@contextflow/database";
 *   const rows = await db.select().from(someTable);
 */
export const db = drizzle(queryClient);

export type Database = typeof db;
