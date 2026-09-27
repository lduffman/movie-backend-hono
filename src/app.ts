import type { AppEnv } from "#core/context/app-env.js";
import { errorHandler } from "#core/middleware/error-handler.js";
import { requestContainer } from "#core/middleware/request-container.js";
import { env } from "#env.js";
import { authRoutes } from "#routes/auth.routes.js";
import { externalRoutes } from "#routes/external.routes.js";
import { libraryRoutes } from "#routes/library.routes.js";
import { moviesRoutes } from "#routes/movies.routes.js";
import { Hono } from "hono";
import { cors } from "hono/cors";

export function createApp() {
  const app = new Hono<AppEnv>();

  app.onError(errorHandler);

  app.use(
    "*",
    cors({
      origin: env.CORS_ALLOWED_ORIGINS,
    }),
  );

  // Contexte de requête : les services de cette requête
  app.use("*", requestContainer);

  // Routes
  app.get("/health", (c) => {
    c.status(200);
    return c.json({ status: "ok" });
  });

  app.route("/auth", authRoutes);
  app.route("/movies", moviesRoutes);
  app.route("/me/library", libraryRoutes);
  app.route("/external", externalRoutes);

  return app;
}
