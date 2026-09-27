import type { AppEnv } from "#core/context/app-env.js";
import { validate } from "#core/errors/validator.js";
import { registerUserSchema } from "#schemas/auth.schema.js";
import { Hono } from "hono";

const authRoutes = new Hono<AppEnv>();

authRoutes.post(
  "/register",
  validate("json", registerUserSchema),
  async (c) => {
    const requestDto = c.req.valid("json");

    const result = await c.var.services.users.createUser(requestDto);

    return c.json(result, 201);
  },
);

export { authRoutes };
