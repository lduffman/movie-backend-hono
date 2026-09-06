import { boolean, numeric, unique, uuid } from "drizzle-orm/pg-core";
import { auditData } from "../common/auditData.js";
import { pgTable } from "../common/pgTable.js";
import { movies } from "./movie.js";
import { users } from "./user.js";

export const libraryEntries = pgTable("library_entries", {
  id: uuid().primaryKey().defaultRandom(),
  userId: uuid().notNull().references(() => users.id),
  movieId: uuid().notNull().references(() => movies.id),
  watched: boolean().notNull().default(false),
  rating: numeric({ precision: 3, scale: 1 }),
  ...auditData(),
}, (t) => [
  unique("UX_library_entries_userId_movieId").on(t.userId, t.movieId),
]);

export type LibraryEntry = typeof libraryEntries.$inferSelect;
export type NewLibraryEntry = typeof libraryEntries.$inferInsert;
