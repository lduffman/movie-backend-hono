import { timestamp } from "drizzle-orm/pg-core";

export const auditData = () => ({
  createdAt: timestamp({ withTimezone: true, mode: "date" })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp({ withTimezone: true, mode: "date" })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});
