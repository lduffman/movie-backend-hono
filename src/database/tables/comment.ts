import { text, uuid, varchar } from "drizzle-orm/pg-core";
import { auditData } from "../common/auditData.js";
import { pgTable } from "../common/pgTable.js";
import { movies } from "./movie.js";
import { users } from "./user.js";

export const comments = pgTable("comments", {
  id: uuid().primaryKey().defaultRandom(),
  movieId: uuid().notNull().references(() => movies.id),
  userId: uuid().notNull().references(() => users.id),
  title: varchar({ length: 255 }).notNull(),
  content: text().notNull(),
  ...auditData(),
});

export type Comment = typeof comments.$inferSelect;
export type NewComment = typeof comments.$inferInsert;
