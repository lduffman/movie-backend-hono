import type { DbExecutor } from "#database/client.js";
import { createUserRepository } from "./user.repository.js";

export const createRepositories = (db: DbExecutor) => ({
  users: createUserRepository(db),
});

export type Repositories = ReturnType<typeof createRepositories>;
