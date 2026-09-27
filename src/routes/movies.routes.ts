import type { AppEnv } from "#core/context/app-env.js";
import { validate } from "#core/errors/validator.js";
import { paginationSchema } from "#schemas/common.schema.js";
import {
  commentUpsertSchema,
  searchMoviesSchema,
} from "#schemas/movie.schema.js";
import { Hono } from "hono";
import z from "zod";

const movieIdParam = z.object({ movieId: z.uuid() });

const moviesRoutes = new Hono<AppEnv>();

moviesRoutes.get("/search", validate("query", searchMoviesSchema), async (c) => {
  const { q, genre, page, size, sort } = c.req.valid("query");

  const result = await c.var.services.movies.searchMovies(
    { page, size, sort },
    q,
    genre,
  );

  return c.json(result);
});

moviesRoutes.get("/genres", async (c) => {
  const result = await c.var.services.movies.getGenres();

  return c.json(result);
});

moviesRoutes.get("/:movieId", validate("param", movieIdParam), async (c) => {
  const { movieId } = c.req.valid("param");

  const result = await c.var.services.movies.getMovieById(movieId);

  return c.json(result);
});

moviesRoutes.get(
  "/:movieId/comments",
  validate("param", movieIdParam),
  validate("query", paginationSchema),
  async (c) => {
    const { movieId } = c.req.valid("param");
    const { page, size } = c.req.valid("query");

    const result = await c.var.services.movies.retrieveMovieComments(movieId, {
      page,
      size,
    });

    return c.json(result);
  },
);

moviesRoutes.post(
  "/:movieId/comments",
  validate("param", movieIdParam),
  validate("json", commentUpsertSchema),
  async (c) => {
    const { movieId } = c.req.valid("param");
    const dto = c.req.valid("json");

    const result = await c.var.services.movies.addMovieComment(movieId, dto);

    return c.json(result, 201);
  },
);

export { moviesRoutes };
