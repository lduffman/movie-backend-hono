import type { DbExecutor } from "#database/client.js";
import { users, type NewUser, type User } from "#database/schema.js";
import { eq } from "drizzle-orm";

const createUserRepository = (db: DbExecutor) => {
  const findById = async (id: string): Promise<User | undefined> => {
    const user = await db.query.users.findFirst({
      where: {
        id,
      },
    });

    return user;
  };

  const findByUsername = async (
    username: string,
  ): Promise<User | undefined> => {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.username, username));

    return user;
  };

  const createUser = async (user: NewUser): Promise<User> => {
    const [createdUser] = await db.insert(users).values(user).returning();
    console.log("Created user:", createdUser);
    return createdUser;
  };

  return {
    findById,
    findByUsername,
    createUser,
  };
};

export { createUserRepository };
