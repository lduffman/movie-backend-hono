import { config } from "dotenv";
import { z } from "zod";

config({ path: [".env.local", ".env"], quiet: true });

const postgresUrl = z.string().refine(
  (value) => {
    try {
      return ["postgres:", "postgresql:"].includes(new URL(value).protocol);
    } catch {
      return false;
    }
  },
  { error: "Invalid PostgreSQL URL" },
);

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  APP_NAME: z.string().min(1),
  DATABASE_URL: postgresUrl,
  PORT: z.coerce.number().int().positive().default(3000),

  CORS_ALLOWED_ORIGINS: z.string().transform((value) => value.split(",").map((origin) => origin.trim())),
  
  JWT_SECRET: z.string().min(1),
  JWT_EXPIRATION_TIME: z.coerce.number().int().positive().default(3600),
  JWT_ISSUER: z.string().min(1),

  EXTERNAL_MOVIE_API_KEY: z.string().min(1),
  EXTERNAL_MOVIE_API_BASE_URL: z.url(),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  const details = parsed.error.issues
    .map(
      (issue) => `  - ${issue.path.join(".") || "(root)"} : ${issue.message}`,
    )
    .join("\n");

  throw new Error(`Invalid environment configuration :\n${details}`);
}

export const env = parsed.data;
