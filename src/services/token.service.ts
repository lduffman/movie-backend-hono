import type { User } from "#database/schema.js";
import { env } from "#env.js";
import { sign, verify, AlgorithmTypes } from "hono/jwt";
import z from "zod";

const claimSchema = z.object({
  iss: z.string(),
  iat: z.number(),
  exp: z.number(),
  sub: z.string(),
  username: z.string(),
});

export const issueToken = async (user: User): Promise<string> => {
  const now = Date.now();
  const expiresAt = now + env.JWT_EXPIRATION_TIME * 1000; // Convert seconds to milliseconds

  const claims = {
    iss: env.JWT_ISSUER,
    iat: Math.floor(now / 1000), // Issued at in seconds
    exp: Math.floor(expiresAt / 1000), // Expiration time in seconds
    sub: user.id.toString(), // Subject (user ID)
    username: user.username, // Custom claim for username
  };

  return sign(claims, env.JWT_SECRET, AlgorithmTypes.HS256);
};

// Renvoie les claims si le token est valide (signature + expiration), sinon null.
export const verifyToken = async (token: string) => {
  try {
    const decoded = await verify(token, env.JWT_SECRET, AlgorithmTypes.HS256);
    const parsed = claimSchema.safeParse(decoded);
    return parsed.success ? parsed.data : null;
  } catch (error) {
    console.warn("Token verification failed:", error);
    return null;
  }
};
