import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { env } from "../env.js";
import { relations } from "./relations.js";

const pool = new Pool({
  connectionString: env.DATABASE_URL,
});

export const db = drizzle({ client: pool, relations });

export type Database = typeof db;

export type DbExecutor =
  Database | Parameters<Parameters<Database["transaction"]>[0]>[0];
