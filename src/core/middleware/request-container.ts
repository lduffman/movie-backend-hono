import type { AppEnv } from "#core/context/app-env.js";
import { createCurrentUser } from "#core/context/current-user.js";
import { db } from "#database/client.js";
import { createServices } from "#services/index.js";
import { createMiddleware } from "hono/factory";

// Le "conteneur" de la requête : construit les services avec leurs dépendances
// (db + utilisateur courant) et les expose dans c.var.services.
// C'est ce que fait le conteneur Spring pour nous ; ici on l'écrit à la main.
export const requestContainer = createMiddleware<AppEnv>(async (c, next) => {
  c.set(
    "services",
    createServices({ db, currentUser: createCurrentUser(c.var.user) }),
  );

  await next();
});
