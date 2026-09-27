import type { AppEnv } from "#core/context/app-env.js";
import { UnauthorizedError } from "#core/errors/http-errors.js";
import { verifyToken } from "#services/token.service.js";
import { createMiddleware } from "hono/factory";

// Global : si un header Authorization est présent, le token doit être valide
// (sinon 401) et l'utilisateur est posé dans c.var.user. Sans header, la
// requête continue en anonyme — c'est `requireAuth` qui protège les routes.
export const authenticate = createMiddleware<AppEnv>(async (c, next) => {
  const authHeader = c.req.header("Authorization");

  if (authHeader) {
    if (!authHeader.startsWith("Bearer ")) {
      throw new UnauthorizedError("Invalid authorization header");
    }

    const claims = await verifyToken(authHeader.slice("Bearer ".length));

    if (!claims) {
      throw new UnauthorizedError("Invalid or expired token");
    }

    c.set("user", { id: claims.sub, username: claims.username });
  }

  await next();
});

// Par route : équivalent du `.anyRequest().authenticated()` de Spring Security.
export const requireAuth = createMiddleware<AppEnv>(async (c, next) => {
  if (!c.var.user) {
    throw new UnauthorizedError("Authentication required");
  }

  await next();
});
