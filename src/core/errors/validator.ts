import { zValidator } from "@hono/zod-validator";
import type { ZodType } from "zod";

// Wrapper de zValidator : en cas d'échec, renvoie le ValidationError du contrat
// (même format que le GlobalExceptionHandler Spring).
export const validate = <T extends ZodType>(
  target: "json" | "query" | "param" | "header",
  schema: T,
) =>
  zValidator(target, schema, (result, c) => {
    if (!result.success) {
      return c.json(
        {
          status: 400,
          message: "Invalid request",
          timestamp: new Date().toISOString(),
          errors: result.error.issues.map((issue) => ({
            field: issue.path.join("."),
            message: issue.message,
          })),
        },
        400,
      );
    }
  });
