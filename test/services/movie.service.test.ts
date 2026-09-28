import { externalMovieClient } from "#clients/externalMovie.client.js";
import { createCurrentUser } from "#core/context/current-user.js";
import { NotFoundError } from "#core/errors/http-errors.js";
import type { Database } from "#database/client.js";
import { createCommentRepository } from "#repositories/comment.repository.js";
import { createMovieRepository } from "#repositories/movie.repository.js";
import { createUserRepository } from "#repositories/user.repository.js";
import { createMovieService } from "#services/movie.service.js";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  aComment,
  aMovie,
  aUser,
  MOVIE_ID,
  USER_ID,
} from "../fixtures/test-data.js";

vi.mock("#repositories/movie.repository.js", () => ({
  createMovieRepository: vi.fn(),
}));
vi.mock("#repositories/comment.repository.js", () => ({
  createCommentRepository: vi.fn(),
}));
vi.mock("#repositories/user.repository.js", () => ({
  createUserRepository: vi.fn(),
}));
vi.mock("#clients/externalMovie.client.js", () => ({
  externalMovieClient: vi.fn(),
}));

const movieRepository = {
  findById: vi.fn(),
  searchMovies: vi.fn(),
  findAllDistinctMovieGenres: vi.fn(),
};
const commentRepository = {
  findAllByMovieId: vi.fn(),
  findAllByUserIdAndMovieId: vi.fn(),
  createComment: vi.fn(),
};
const userRepository = {
  findById: vi.fn(),
  findByUsername: vi.fn(),
  createUser: vi.fn(),
};

const pageable = { page: 0, size: 20 };

describe("movie.service", () => {
  let movieService: ReturnType<typeof createMovieService>;

  beforeEach(() => {
    vi.mocked(createMovieRepository).mockReturnValue(movieRepository);
    vi.mocked(createCommentRepository).mockReturnValue(commentRepository);
    vi.mocked(createUserRepository).mockReturnValue(userRepository);

    movieService = createMovieService({
      db: {} as Database,
      currentUser: createCurrentUser({
        id: USER_ID,
        username: "john.doe@example.com",
      }),
    });
  });

  describe("getMovieById", () => {
    it("returns the mapped movie", async () => {
      movieRepository.findById.mockResolvedValue(aMovie());

      const dto = await movieService.getMovieById(MOVIE_ID);

      expect(dto).toMatchObject({ id: MOVIE_ID, title: "The Matrix" });
    });

    it("throws NotFound when the movie does not exist", async () => {
      movieRepository.findById.mockResolvedValue(undefined);

      await expect(movieService.getMovieById(MOVIE_ID)).rejects.toThrow(
        "Movie not found",
      );
    });
  });

  it("searchMovies splits the sort parameter and maps the page", async () => {
    movieRepository.searchMovies.mockResolvedValue({
      items: [aMovie()],
      page: 0,
      size: 20,
      total: 1,
    });

    const result = await movieService.searchMovies(
      { ...pageable, sort: "year,desc" },
      "matrix",
      "Action",
    );

    expect(movieRepository.searchMovies).toHaveBeenCalledWith(
      "matrix",
      "Action",
      expect.objectContaining(pageable),
      "year",
      "desc",
    );
    expect(result.items[0]!.title).toBe("The Matrix");
    expect(result.total).toBe(1);
  });

  describe("retrieveMovieComments", () => {
    it("returns the mapped comments of an existing movie", async () => {
      movieRepository.findById.mockResolvedValue(aMovie());
      commentRepository.findAllByMovieId.mockResolvedValue({
        items: [aComment()],
        page: 0,
        size: 20,
        total: 1,
      });

      const result = await movieService.retrieveMovieComments(
        MOVIE_ID,
        pageable,
      );

      expect(result.items[0]!.author).toBe("John Doe");
    });

    it("throws NotFound when the movie does not exist", async () => {
      movieRepository.findById.mockResolvedValue(undefined);

      await expect(
        movieService.retrieveMovieComments(MOVIE_ID, pageable),
      ).rejects.toThrow(NotFoundError);

      expect(commentRepository.findAllByMovieId).not.toHaveBeenCalled();
    });
  });

  describe("addMovieComment", () => {
    const dto = { title: "Great", content: "Loved it" };

    it("creates the comment for the movie and the current user", async () => {
      // Given
      const user = aUser();
      movieRepository.findById.mockResolvedValue(aMovie());
      userRepository.findById.mockResolvedValue(user);
      commentRepository.createComment.mockResolvedValue(
        aComment({ title: "Great", content: "Loved it" }),
      );

      // When
      const result = await movieService.addMovieComment(MOVIE_ID, dto);

      // Then
      expect(userRepository.findById).toHaveBeenCalledWith(USER_ID);
      expect(commentRepository.createComment).toHaveBeenCalledWith({
        movieId: MOVIE_ID,
        userId: USER_ID,
        title: "Great",
        content: "Loved it",
      });
      expect(result).toMatchObject({ title: "Great", author: "John Doe" });
    });

    it("throws NotFound when the movie does not exist", async () => {
      movieRepository.findById.mockResolvedValue(undefined);

      await expect(movieService.addMovieComment(MOVIE_ID, dto)).rejects.toThrow(
        "Movie not found",
      );

      expect(commentRepository.createComment).not.toHaveBeenCalled();
    });

    it("throws NotFound when the current user does not exist", async () => {
      movieRepository.findById.mockResolvedValue(aMovie());
      userRepository.findById.mockResolvedValue(undefined);

      await expect(movieService.addMovieComment(MOVIE_ID, dto)).rejects.toThrow(
        "User not found",
      );

      expect(commentRepository.createComment).not.toHaveBeenCalled();
    });
  });

  it("searchMovieByExternalClient maps every external movie", async () => {
    const searchMovie = vi.fn().mockResolvedValue([
      {
        external_id: "tt0133093",
        title: "The Matrix",
        plot: "…",
        year: 1999,
        poster_url: "https://example.com/p.jpg",
        rating: 8.7,
        runtime: 136,
        votes: 1,
        genres: [],
        directors: [],
        writers: [],
      },
    ]);
    vi.mocked(externalMovieClient).mockReturnValue({ searchMovie });

    const result = await movieService.searchMovieByExternalClient("matrix");

    expect(searchMovie).toHaveBeenCalledWith("matrix");
    expect(result).toEqual([
      expect.objectContaining({ id: null, externalId: "tt0133093" }),
    ]);
  });

  it("getGenres hits the database only once (cache)", async () => {
    movieRepository.findAllDistinctMovieGenres.mockResolvedValue([
      "Action",
      "Drama",
    ]);

    expect(await movieService.getGenres()).toEqual(["Action", "Drama"]);
    expect(await movieService.getGenres()).toEqual(["Action", "Drama"]);

    expect(movieRepository.findAllDistinctMovieGenres).toHaveBeenCalledTimes(1);
  });
});
