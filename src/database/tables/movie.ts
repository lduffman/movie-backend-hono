import { uuid, varchar, numeric, integer, jsonb, text } from "drizzle-orm/pg-core";
import { pgTable } from "../common/pgTable.js";
import { auditData } from "../common/auditData.js";
import { sql } from "drizzle-orm";

export const movies = pgTable("movies", {
  id: uuid().primaryKey().defaultRandom(),
  externalId: varchar({ length: 20 }).notNull().unique("UX_movies_externalId"),
  title: varchar({ length: 255 }).notNull(),
  year: integer().notNull(),
  genres: text().array().notNull().default(sql`'{}'::text[]`),
  plot: text().notNull(),
  rating: numeric({ precision: 3, scale: 1 }),
  votes: integer(),
  runtime: integer(),
  directors: text().array().notNull().default(sql`'{}'::text[]`),
  writers: text().array().notNull().default(sql`'{}'::text[]`),
  posterUrl: varchar({ length: 1000 }),
  ...auditData(),
});

export type Movie = typeof movies.$inferSelect;
export type NewMovie = typeof movies.$inferInsert;
