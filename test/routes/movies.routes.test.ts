import { createApp } from "#app.js";
import { NotFoundError } from "#core/errors/http-errors.js";
import { createServices } from "#services/index.js";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { MOVIE_ID } from "../fixtures/test-data.js";
import { bearer, services } from "./helpers.js";

// L'app complète (middlewares, validation, errorHandler) avec des services mockés :
// on teste le contrat HTTP sans base de données (≈ @WebMvcTest).
vi.mock("#services/index.js", () => ({ createServices: vi.fn() }));

const app = createApp();

describe("movies routes", () => {
  beforeEach(() => {
    vi.mocked(createServices).mockReturnValue(services as never);
  });

  describe("GET /movies/:movieId", () => {
    it("returns 200 with the movie", async () => {
      services.movies.getMovieById.mockResolvedValue({
        id: MOVIE_ID,
        title: "The Matrix",
      });

      const res = await app.request(`/movies/${MOVIE_ID}`);

      expect(res.status).toBe(200);
      expect(await res.json()).toMatchObject({ title: "The Matrix" });
    });

    it("returns 404 in the contract error format", async () => {
      services.movies.getMovieById.mockRejectedValue(
        new NotFoundError("Movie not found"),
      );

      const res = await app.request(`/movies/${MOVIE_ID}`);

      expect(res.status).toBe(404);
      expect(await res.json()).toMatchObject({
        status: 404,
        message: "Movie not found",
        timestamp: expect.any(String),
      });
    });

    it("returns 400 when the id is not a UUID, without calling the service", async () => {
      const res = await app.request("/movies/not-a-uuid");

      expect(res.status).toBe(400);
      expect(await res.json()).toMatchObject({
        errors: [{ field: "movieId", message: expect.any(String) }],
      });
      expect(services.movies.getMovieById).not.toHaveBeenCalled();
    });
  });

  describe("GET /movies/search", () => {
    it("passes query, genre and pagination to the service", async () => {
      services.movies.searchMovies.mockResolvedValue({
        items: [],
        page: 1,
        size: 5,
        total: 0,
      });

      const res = await app.request(
        "/movies/search?q=matrix&genre=Action&page=1&size=5&sort=year,desc",
      );

      expect(res.status).toBe(200);
      expect(services.movies.searchMovies).toHaveBeenCalledWith(
        { page: 1, size: 5, sort: "year,desc" },
        "matrix",
        "Action",
      );
    });

    it("uses title,asc as default sort", async () => {
      services.movies.searchMovies.mockResolvedValue({
        items: [],
        page: 0,
        size: 20,
        total: 0,
      });

      await app.request("/movies/search");

      expect(services.movies.searchMovies).toHaveBeenCalledWith(
        { page: 0, size: 20, sort: "title,asc" },
        undefined,
        undefined,
      );
    });

    it("returns 400 when the sort property is not allowed", async () => {
      const res = await app.request("/movies/search?sort=plot,asc");

      expect(res.status).toBe(400);
      expect(services.movies.searchMovies).not.toHaveBeenCalled();
    });
  });

  it("GET /movies/genres returns the genre list", async () => {
    services.movies.getGenres.mockResolvedValue(["Action", "Drama"]);

    const res = await app.request("/movies/genres");

    expect(await res.json()).toEqual(["Action", "Drama"]);
  });

  describe("POST /movies/:movieId/comments", () => {
    const body = JSON.stringify({ title: "Great", content: "Loved it" });

    it("returns 201 when authenticated and the body is valid", async () => {
      services.movies.addMovieComment.mockResolvedValue({ title: "Great" });

      const res = await app.request(`/movies/${MOVIE_ID}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(await bearer()) },
        body,
      });

      expect(res.status).toBe(201);
      expect(services.movies.addMovieComment).toHaveBeenCalledWith(MOVIE_ID, {
        title: "Great",
        content: "Loved it",
      });
    });

    it("returns 401 without a token", async () => {
      const res = await app.request(`/movies/${MOVIE_ID}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body,
      });

      expect(res.status).toBe(401);
      expect(services.movies.addMovieComment).not.toHaveBeenCalled();
    });

    it("returns 400 with field errors when the body is invalid", async () => {
      const res = await app.request(`/movies/${MOVIE_ID}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(await bearer()) },
        body: JSON.stringify({ title: "", content: "" }),
      });

      expect(res.status).toBe(400);
      const error = await res.json();
      expect(error.message).toBe("Invalid request");
      expect(error.errors).toHaveLength(2);
    });

    it("returns 400 when the JSON is malformed", async () => {
      const res = await app.request(`/movies/${MOVIE_ID}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(await bearer()) },
        body: '{"title": ',
      });

      expect(res.status).toBe(400);
      expect(services.movies.addMovieComment).not.toHaveBeenCalled();
    });
  });
});
