import type { Services } from "#services/index.js";
import type { AuthUser } from "./current-user.js";

// Typage des variables de requête (c.var.*) partagé par toutes les routes :
// new Hono<AppEnv>() / createMiddleware<AppEnv>().
export type AppEnv = {
  Variables: {
    // posé par `authenticate` si un JWT valide est fourni
    user?: AuthUser;
    // posé par `requestContainer` : les services de CETTE requête
    services: Services;
  };
};
