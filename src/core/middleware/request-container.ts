import type { AppEnv } from "#core/context/app-env.js";
import { createCurrentUser } from "#core/context/current-user.js";
import { db } from "#database/client.js";
import { env } from "#env.js";
import { createServices } from "#services/index.js";
import { createMiddleware } from "hono/factory";

// Pas encore d'authentification : on simule un utilisateur connecté, configuré
// dans le .env (équivalent du DevCurrentUser côté Spring). Son id doit exister
// dans la table users : crée-le via POST /auth/register.
const devUser = { id: env.DEV_USER_ID, username: env.DEV_USERNAME };

// Le "conteneur" de la requête : construit les services avec leurs dépendances
// (db + utilisateur courant) et les expose dans c.var.services.
// C'est ce que fait le conteneur Spring pour nous ; ici on l'écrit à la main.
export const requestContainer = createMiddleware<AppEnv>(async (c, next) => {
  c.set(
    "services",
    createServices({ db, currentUser: createCurrentUser(devUser) }),
  );

  await next();
});
