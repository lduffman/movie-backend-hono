import { UnauthorizedError } from "#core/errors/http-errors.js";
import type { Database } from "#database/client.js";
import { createUserRepository } from "#repositories/user.repository.js";
import z from "zod";
import { issueToken } from "./token.service.js";
import { verifyPassword } from "#core/utils/auth.utils.js";
import { env } from "#env.js";

const loginResponseSchema = z.object({
  accessToken: z.string(),
  tokenType: z.string(),
  expiresIn: z.number(),
});

export type LoginResponse = z.infer<typeof loginResponseSchema>;

export const createAuthService = ({ db }: { db: Database }) => {
  const userRepository = createUserRepository(db);

  const login = async (
    username: string,
    password: string,
  ): Promise<LoginResponse> => {
    console.log("Logging in user:", username);
    const user = await userRepository.findByUsername(username);
    if (!user) {
      console.log("User not found:", username);
      throw new UnauthorizedError("Invalid username or password");
    }

    const isPasswordValid = await verifyPassword(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedError("Invalid username or password");
    }

    const accessToken = await issueToken(user);

    return {
      accessToken,
      tokenType: "Bearer",
      expiresIn: env.JWT_EXPIRATION_TIME,
    };
  };

  return {
    login,
  };
};
