import type { AppEnv } from "#core/context/app-env.js";
import { validate } from "#core/errors/validator.js";
import { Hono } from "hono";
import z from "zod";

const externalRoutes = new Hono<AppEnv>();

externalRoutes.get(
  "/movies",
  validate("query", z.object({ query: z.string().trim().nonempty() })),
  async (c) => {
    const { query } = c.req.valid("query");

    const result = await c.var.services.movies.searchMovieByExternalClient(query);

    return c.json(result);
  },
);

export { externalRoutes };
