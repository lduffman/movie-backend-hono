import { HTTPException } from "hono/http-exception";
import type { ErrorHandler } from "hono";
import type { ContentfulStatusCode } from "hono/utils/http-status";
import { AppError } from "#core/errors/app-error.js";

// Format d'erreur du contrat (schéma `Error`), identique au backend Spring.
const apiError = (status: ContentfulStatusCode, message: string) => ({
  status,
  message,
  timestamp: new Date().toISOString(),
});

export const errorHandler: ErrorHandler = (error, c) => {
  // Nos erreurs métier : elles portent leur status (NotFoundError, ConflictError...)
  if (error instanceof AppError) {
    console.warn("Application error", {
      path: c.req.path,
      method: c.req.method,
      status: error.statusCode,
      code: error.code,
      message: error.message,
    });

    return c.json(apiError(error.statusCode, error.message), error.statusCode);
  }

  // Erreurs levées par Hono lui-même (ex. JSON mal formé)
  if (error instanceof HTTPException) {
    const status = error.status as ContentfulStatusCode;
    return c.json(apiError(status, error.message), status);
  }

  // Filet de sécurité : le détail dans les logs, jamais dans la réponse
  console.error("Unhandled error", {
    error,
    path: c.req.path,
    method: c.req.method,
  });

  return c.json(apiError(500, "Internal error"), 500);
};
