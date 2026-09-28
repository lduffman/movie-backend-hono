import { createApp } from "#app.js";
import { NotFoundError } from "#core/errors/http-errors.js";
import { createServices } from "#services/index.js";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { MOVIE_ID } from "../fixtures/test-data.js";
import { bearer, services } from "./helpers.js";

vi.mock("#services/index.js", () => ({ createServices: vi.fn() }));

const app = createApp();
const emptyPage = { items: [], page: 0, size: 20, total: 0 };

describe("library routes", () => {
  beforeEach(() => {
    vi.mocked(createServices).mockReturnValue(services as never);
    services.library.getMyLibrary.mockResolvedValue(emptyPage);
  });

  it("every endpoint returns 401 without a token", async () => {
    for (const [method, path] of [
      ["GET", "/me/library"],
      ["GET", `/me/library/${MOVIE_ID}`],
      ["PUT", `/me/library/${MOVIE_ID}`],
      ["DELETE", `/me/library/${MOVIE_ID}`],
    ] as const) {
      const res = await app.request(path, { method });
      expect(res.status, `${method} ${path}`).toBe(401);
    }
  });

  it("returns 401 with an invalid token", async () => {
    const res = await app.request("/me/library", {
      headers: { Authorization: "Bearer not.a.valid.token" },
    });

    expect(res.status).toBe(401);
    expect(await res.json()).toMatchObject({ status: 401 });
  });

  describe("GET /me/library", () => {
    it("parses watched=false as false (not as a truthy string)", async () => {
      await app.request("/me/library?watched=false", {
        headers: await bearer(),
      });

      expect(services.library.getMyLibrary).toHaveBeenCalledWith(
        expect.anything(),
        false,
      );
    });

    it("sorts by most recent first by default", async () => {
      await app.request("/me/library", { headers: await bearer() });

      expect(services.library.getMyLibrary).toHaveBeenCalledWith(
        { page: 0, size: 20, sort: "createdAt,desc" },
        undefined,
      );
    });

    it("accepts a sort on a movie property", async () => {
      const res = await app.request("/me/library?sort=movie.year,asc", {
        headers: await bearer(),
      });

      expect(res.status).toBe(200);
    });

    it("returns 400 when the sort property is not allowed", async () => {
      const res = await app.request("/me/library?sort=user.password,asc", {
        headers: await bearer(),
      });

      expect(res.status).toBe(400);
      expect(services.library.getMyLibrary).not.toHaveBeenCalled();
    });
  });

  it("GET /me/library/:movieId returns 404 when the entry does not exist", async () => {
    services.library.getMyLibraryEntry.mockRejectedValue(
      new NotFoundError("Library entry not found"),
    );

    const res = await app.request(`/me/library/${MOVIE_ID}`, {
      headers: await bearer(),
    });

    expect(res.status).toBe(404);
  });

  describe("PUT /me/library/:movieId", () => {
    const put = async (body: unknown) =>
      app.request(`/me/library/${MOVIE_ID}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", ...(await bearer()) },
        body: JSON.stringify(body),
      });

    it("returns 200 with the upserted entry", async () => {
      services.library.upsertLibraryEntry.mockResolvedValue({ watched: true });

      const res = await put({ watched: true, rating: 8.5 });

      expect(res.status).toBe(200);
      expect(services.library.upsertLibraryEntry).toHaveBeenCalledWith(
        MOVIE_ID,
        true,
        8.5,
      );
    });

    it("resets omitted fields (PUT = full state)", async () => {
      services.library.upsertLibraryEntry.mockResolvedValue({});

      await put({});

      expect(services.library.upsertLibraryEntry).toHaveBeenCalledWith(
        MOVIE_ID,
        false,
        undefined,
      );
    });

    it("returns 400 when the rating is out of range", async () => {
      const res = await put({ watched: true, rating: 11 });

      expect(res.status).toBe(400);
      expect(await res.json()).toMatchObject({
        errors: [{ field: "rating", message: expect.any(String) }],
      });
    });
  });

  describe("DELETE /me/library/:movieId", () => {
    it("returns 204", async () => {
      services.library.removeMovieFromMyLibrary.mockResolvedValue(undefined);

      const res = await app.request(`/me/library/${MOVIE_ID}`, {
        method: "DELETE",
        headers: await bearer(),
      });

      expect(res.status).toBe(204);
      expect(services.library.removeMovieFromMyLibrary).toHaveBeenCalledWith(
        MOVIE_ID,
      );
    });

    it("returns 404 when the movie is not in the library", async () => {
      services.library.removeMovieFromMyLibrary.mockRejectedValue(
        new NotFoundError("Library entry not found"),
      );

      const res = await app.request(`/me/library/${MOVIE_ID}`, {
        method: "DELETE",
        headers: await bearer(),
      });

      expect(res.status).toBe(404);
    });
  });
});
