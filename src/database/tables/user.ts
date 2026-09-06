import { uuid, varchar } from "drizzle-orm/pg-core";
import { pgTable } from "../common/pgTable.js";
import { auditData } from "../common/auditData.js";

export const users = pgTable("users", {
  id: uuid().primaryKey().defaultRandom(),
  username: varchar({ length: 255 }).notNull().unique("UX_users_username"),
  firstName: varchar({ length: 255 }).notNull(),
  lastName: varchar({ length: 255 }).notNull(),
  password: varchar({ length: 255 }).notNull(),
  ...auditData(),
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
