import type { User } from "#database/schema.js";
import type { UserDto } from "#schemas/user.schema.js";

export const mapToUserDto = (user: User): UserDto => {
  return {
    id: user.id,
    username: user.username,
    firstName: user.firstName,
    lastName: user.lastName,
  };
};
