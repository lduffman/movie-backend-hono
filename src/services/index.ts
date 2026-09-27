import type { CurrentUser } from "#core/context/current-user.js";
import type { Database } from "#database/client.js";
import { createLibraryService } from "./library.service.js";
import { createMovieService } from "./movie.service.js";
import { createUserService } from "./user.service.js";

// Les dépendances disponibles pour tous les services d'une requête.
export type ServiceDeps = {
  db: Database;
  currentUser: CurrentUser;
};

export const createServices = (deps: ServiceDeps) => ({
  users: createUserService(deps),
  movies: createMovieService(deps),
  library: createLibraryService(deps),
});

export type Services = ReturnType<typeof createServices>;
