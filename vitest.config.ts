import { defineConfig } from "vitest/config";

export default defineConfig({
  // Les imports "#…" (package.json > imports) pointent vers ./src en condition
  // "development", comme pour `npm run dev`.
  resolve: {
    conditions: ["development"],
  },
  ssr: {
    resolve: {
      conditions: ["development"],
    },
  },
  test: {
    include: ["test/**/*.test.ts"],
    // remet à zéro les appels enregistrés par les mocks entre chaque test
    clearMocks: true,
    // src/env.ts valide la configuration dès son import : on fournit des valeurs
    // de test (aucune base n'est contactée par les tests unitaires).
    env: {
      APP_NAME: "movie-backend-hono-test",
      DATABASE_URL: "postgresql://test:test@localhost:5432/unused",
      CORS_ALLOWED_ORIGINS: "http://localhost:5173",
      JWT_ISSUER: "movie-backend-hono-test",
      JWT_SECRET: "test-secret-that-is-long-enough-for-hs256",
      JWT_EXPIRATION_TIME: "3600",
      EXTERNAL_MOVIE_API_BASE_URL: "https://external.example",
      EXTERNAL_MOVIE_API_KEY: "test-api-key",
    },
  },
});
