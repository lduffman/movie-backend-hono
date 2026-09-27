import type { ContentfulStatusCode } from "hono/utils/http-status";

export class AppError extends Error {
  constructor(
    message: string,
    public readonly statusCode: ContentfulStatusCode,
    public readonly code: string,
    options?: ErrorOptions,
  ) {
    super(message, options);

    this.name = "AppError";
  }
}
