import type { Services } from "#services/index.js";

// Typage des variables de requête (c.var.*) partagé par toutes les routes :
// new Hono<AppEnv>() / createMiddleware<AppEnv>().
export type AppEnv = {
  Variables: {
    // posé par `requestContainer` : les services de CETTE requête
    services: Services;
  };
};
