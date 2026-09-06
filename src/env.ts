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
  { error: "Invalid PostgreSQL URL" }
);

const envSchema = z
  .object({
    NODE_ENV: z
      .enum(["development", "production"])
      .default("development"),
    APP_NAME: z.string().min(1),
    DATABASE_URL: postgresUrl,
    PORT: z.coerce.number().int().positive().default(3000),
  });

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  const details = parsed.error.issues
    .map((issue) => `  - ${issue.path.join(".") || "(root)"} : ${issue.message}`)
    .join("\n");

  throw new Error(`Invalid environment configuration :\n${details}`);
}

export const env = parsed.data;
