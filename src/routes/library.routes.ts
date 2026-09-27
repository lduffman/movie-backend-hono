import type { AppEnv } from "#core/context/app-env.js";
import { validate } from "#core/errors/validator.js";
import { requireAuth } from "#core/middleware/auth.middleware.js";
import {
  searchLibrarySchema,
  upsertLibrarySchema,
} from "#schemas/library.schema.js";
import { Hono } from "hono";
import z from "zod";

const movieIdParam = z.object({ movieId: z.uuid() });

const libraryRoutes = new Hono<AppEnv>();

// Toute la bibliothèque est privée : /me/library/* exige un utilisateur connecté
libraryRoutes.use("*", requireAuth);

libraryRoutes.get("/", validate("query", searchLibrarySchema), async (c) => {
  const { watched, page, size, sort } = c.req.valid("query");

  const result = await c.var.services.library.getMyLibrary(
    { page, size, sort },
    watched,
  );

  return c.json(result);
});

libraryRoutes.get("/:movieId", validate("param", movieIdParam), async (c) => {
  const { movieId } = c.req.valid("param");

  const result = await c.var.services.library.getMyLibraryEntry(movieId);

  return c.json(result);
});

libraryRoutes.put(
  "/:movieId",
  validate("param", movieIdParam),
  validate("json", upsertLibrarySchema),
  async (c) => {
    const { movieId } = c.req.valid("param");
    const { watched, rating } = c.req.valid("json");

    const result = await c.var.services.library.upsertLibraryEntry(
      movieId,
      watched,
      rating ?? undefined,
    );

    return c.json(result);
  },
);

libraryRoutes.delete(
  "/:movieId",
  validate("param", movieIdParam),
  async (c) => {
    const { movieId } = c.req.valid("param");

    await c.var.services.library.removeMovieFromMyLibrary(movieId);

    return c.body(null, 204);
  },
);

export { libraryRoutes };
