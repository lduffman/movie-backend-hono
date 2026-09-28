import { createApp } from "#app.js";
import { createServices } from "#services/index.js";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { services } from "./helpers.js";

vi.mock("#services/index.js", () => ({ createServices: vi.fn() }));

const app = createApp();

describe("external routes", () => {
  beforeEach(() => {
    vi.mocked(createServices).mockReturnValue(services as never);
  });

  it("GET /external/movies is public and returns the external movies", async () => {
    services.movies.searchMovieByExternalClient.mockResolvedValue([
      { id: null, externalId: "tt0133093", title: "The Matrix" },
    ]);

    const res = await app.request("/external/movies?query=matrix");

    expect(res.status).toBe(200);
    expect(services.movies.searchMovieByExternalClient).toHaveBeenCalledWith(
      "matrix",
    );
  });

  it("returns 400 when the query is missing", async () => {
    const res = await app.request("/external/movies");

    expect(res.status).toBe(400);
    expect(services.movies.searchMovieByExternalClient).not.toHaveBeenCalled();
  });

  it("returns a generic 500 when an unexpected error occurs", async () => {
    services.movies.searchMovieByExternalClient.mockRejectedValue(
      new Error("socket hang up — internal detail"),
    );

    const res = await app.request("/external/movies?query=matrix");

    expect(res.status).toBe(500);
    // le détail reste dans les logs, jamais dans la réponse
    expect(await res.json()).toMatchObject({
      status: 500,
      message: "Internal error",
    });
  });
});
