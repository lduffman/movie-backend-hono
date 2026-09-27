import { ConflictError } from "#core/errors/http-errors.js";
import { hashPassword } from "#core/utils/auth.utils.js";
import type { Database } from "#database/client.js";
import { createRepositories } from "#repositories/index.js";
import type { RegisterUserDto } from "#schemas/auth.schema.js";
import type { UserDto } from "#schemas/user.schema.js";
import { mapToUserDto } from "#types/converters/user.converter.js";

export const createUserService = ({ db }: { db: Database }) => {
  const createUser = async (user: RegisterUserDto): Promise<UserDto> => {
    const registeredUser = await db.transaction(async (tx) => {
      const txRepo = createRepositories(tx);

      const existingUser = await txRepo.users.findByUsername(
        user.username.toLowerCase(),
      );
      if (existingUser) {
        throw new ConflictError(
          `User with username ${user.username} already exists.`,
        );
      }
      const hashedPassword = await hashPassword(user.password);

      return await txRepo.users.createUser({
        username: user.username.toLowerCase(),
        password: hashedPassword,
        firstName: user.firstName,
        lastName: user.lastName,
      });
    });
    return mapToUserDto(registeredUser);
  };

  return {
    createUser,
  };
};
