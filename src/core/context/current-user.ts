import { UnauthorizedError } from "#core/errors/http-errors.js";

// L'utilisateur connecté (pour l'instant simulé, cf. requestContainer).
export type AuthUser = {
  id: string;
  username: string;
};

// Miroir de l'interface CurrentUser côté Spring : les services demandent
// "qui est connecté ?" sans jamais toucher au Context Hono.
export type CurrentUser = {
  isAuthenticated: () => boolean;
  id: () => string;
  username: () => string;
};

export const createCurrentUser = (user: AuthUser | undefined): CurrentUser => {
  const requireUser = (): AuthUser => {
    if (!user) {
      throw new UnauthorizedError("No authenticated user");
    }
    return user;
  };

  return {
    isAuthenticated: () => user !== undefined,
    id: () => requireUser().id,
    username: () => requireUser().username,
  };
};
