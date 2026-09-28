import { createCurrentUser } from "#core/context/current-user.js";
import { NotFoundError, UnauthorizedError } from "#core/errors/http-errors.js";
import type { Database } from "#database/client.js";
import { createLibraryRepository } from "#repositories/library-entry.repository.js";
import { createMovieRepository } from "#repositories/movie.repository.js";
import { createLibraryService } from "#services/library.service.js";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  aLibraryEntry,
  aMovie,
  MOVIE_ID,
  USER_ID,
} from "../fixtures/test-data.js";

vi.mock("#repositories/library-entry.repository.js", () => ({
  createLibraryRepository: vi.fn(),
}));
vi.mock("#repositories/movie.repository.js", () => ({
  createMovieRepository: vi.fn(),
}));

const libraryRepository = {
  findByUserIdAndMovieId: vi.fn(),
  findLibraryEntriesByUserId: vi.fn(),
  createLibraryRepository: vi.fn(),
  deleteByUserIdAndMovieId: vi.fn(),
};
const movieRepository = {
  findById: vi.fn(),
  searchMovies: vi.fn(),
  findAllDistinctMovieGenres: vi.fn(),
};

// Faux `tx` pour l'upsert : il imite la chaîne insert().values().onConflictDoUpdate().returning()
const upsertedEntry = aLibraryEntry({ watched: true, rating: 7.5 });
const onConflictDoUpdate = vi.fn(() => ({
  returning: vi.fn().mockResolvedValue([upsertedEntry]),
}));
const values = vi.fn(() => ({ onConflictDoUpdate }));
const tx = {
  insert: vi.fn(() => ({ values })),
  query: { libraryEntries: { findFirst: vi.fn() } },
};
const db = {
  transaction: vi.fn((callback: (tx: unknown) => unknown) => callback(tx)),
} as unknown as Database;

const currentUser = createCurrentUser({
  id: USER_ID,
  username: "john.doe@example.com",
});

describe("library.service", () => {
  let libraryService: ReturnType<typeof createLibraryService>;

  beforeEach(() => {
    vi.mocked(createLibraryRepository).mockReturnValue(libraryRepository);
    vi.mocked(createMovieRepository).mockReturnValue(movieRepository);
    tx.query.libraryEntries.findFirst.mockResolvedValue(upsertedEntry);

    libraryService = createLibraryService({ db, currentUser });
  });

  it("getMyLibrary queries the current user's entries with the requested sort", async () => {
    libraryRepository.findLibraryEntriesByUserId.mockResolvedValue({
      items: [aLibraryEntry()],
      page: 0,
      size: 10,
      total: 1,
    });

    const result = await libraryService.getMyLibrary(
      { page: 0, size: 10, sort: "movie.year,asc" },
      true,
    );

    expect(libraryRepository.findLibraryEntriesByUserId).toHaveBeenCalledWith(
      USER_ID,
      true,
      expect.objectContaining({ page: 0, size: 10 }),
      "movie.year",
      "asc",
    );
    expect(result.items[0]!.movie.title).toBe("The Matrix");
  });

  it("every method requires an authenticated user", async () => {
    const anonymous = createLibraryService({
      db,
      currentUser: createCurrentUser(undefined),
    });

    await expect(anonymous.getMyLibraryEntry(MOVIE_ID)).rejects.toThrow(
      UnauthorizedError,
    );
  });

  describe("getMyLibraryEntry", () => {
    it("returns the entry of the current user", async () => {
      libraryRepository.findByUserIdAndMovieId.mockResolvedValue(
        aLibraryEntry(),
      );

      const dto = await libraryService.getMyLibraryEntry(MOVIE_ID);

      expect(libraryRepository.findByUserIdAndMovieId).toHaveBeenCalledWith(
        USER_ID,
        MOVIE_ID,
      );
      expect(dto.watched).toBe(true);
    });

    it("throws NotFound when the movie is not in the library", async () => {
      libraryRepository.findByUserIdAndMovieId.mockResolvedValue(undefined);

      await expect(libraryService.getMyLibraryEntry(MOVIE_ID)).rejects.toThrow(
        NotFoundError,
      );
    });
  });

  describe("upsertLibraryEntry", () => {
    it("inserts or updates the entry of the current user", async () => {
      movieRepository.findById.mockResolvedValue(aMovie());

      const dto = await libraryService.upsertLibraryEntry(MOVIE_ID, true, 7.5);

      expect(values).toHaveBeenCalledWith({
        userId: USER_ID,
        movieId: MOVIE_ID,
        watched: true,
        rating: 7.5,
      });
      expect(onConflictDoUpdate).toHaveBeenCalledWith(
        expect.objectContaining({ set: { watched: true, rating: 7.5 } }),
      );
      expect(dto).toMatchObject({ watched: true, rating: 7.5 });
    });

    it("throws NotFound when the movie does not exist", async () => {
      movieRepository.findById.mockResolvedValue(undefined);

      await expect(
        libraryService.upsertLibraryEntry(MOVIE_ID, true, 7.5),
      ).rejects.toThrow("Movie not found");

      expect(db.transaction).not.toHaveBeenCalled();
    });
  });

  describe("removeMovieFromMyLibrary", () => {
    it("deletes the entry inside a transaction", async () => {
      libraryRepository.findByUserIdAndMovieId.mockResolvedValue(
        aLibraryEntry(),
      );

      await libraryService.removeMovieFromMyLibrary(MOVIE_ID);

      expect(libraryRepository.deleteByUserIdAndMovieId).toHaveBeenCalledWith(
        USER_ID,
        MOVIE_ID,
      );
      // le repository de suppression est créé sur la transaction, pas sur `db`
      expect(createLibraryRepository).toHaveBeenCalledWith({ db: tx });
    });

    it("throws NotFound when the movie is not in the library", async () => {
      libraryRepository.findByUserIdAndMovieId.mockResolvedValue(undefined);

      await expect(
        libraryService.removeMovieFromMyLibrary(MOVIE_ID),
      ).rejects.toThrow(NotFoundError);

      expect(libraryRepository.deleteByUserIdAndMovieId).not.toHaveBeenCalled();
    });
  });
});
