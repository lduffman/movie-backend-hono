import { mapToCommentDto } from "#types/converters/comment.converter.js";
import { mapToLibraryEntryDto } from "#types/converters/library.converter.js";
import {
  mapExternalToMovieDto,
  mapToMovieDto,
} from "#types/converters/movie.converter.js";
import { mapToUserDto } from "#types/converters/user.converter.js";
import { describe, expect, it } from "vitest";
import {
  aComment,
  aLibraryEntry,
  aMovie,
  aUser,
  MOVIE_ID,
} from "./fixtures/test-data.js";

// Les converters sont des fonctions pures : ni mock, ni base, on appelle et on compare.
describe("converters", () => {
  describe("mapToMovieDto", () => {
    it("copies every public field of the movie", () => {
      const movie = aMovie();

      expect(mapToMovieDto(movie)).toEqual({
        id: MOVIE_ID,
        externalId: "tt0133093",
        title: "The Matrix",
        plot: movie.plot,
        year: 1999,
        votes: 2_000_000,
        runtime: 136,
        genres: ["Action", "Sci-Fi"],
        directors: movie.directors,
        writers: movie.writers,
        rating: 8.7,
        posterUrl: movie.posterUrl,
      });
    });
  });

  describe("mapExternalToMovieDto", () => {
    it("maps the external format to ours, without an internal id", () => {
      const dto = mapExternalToMovieDto({
        external_id: "tt0111161",
        title: "The Shawshank Redemption",
        plot: "Two imprisoned men bond.",
        year: 1994,
        poster_url: "https://example.com/poster.jpg",
        rating: 9.3,
        runtime: 142,
        votes: 2_800_000,
        genres: ["Drama"],
        directors: ["Frank Darabont"],
        writers: ["Stephen King", "Frank Darabont"],
      });

      expect(dto.id).toBeNull(); // pas encore en base
      expect(dto.externalId).toBe("tt0111161");
      expect(dto.posterUrl).toBe("https://example.com/poster.jpg");
      expect(dto.writers).toEqual(["Stephen King", "Frank Darabont"]);
    });
  });

  it("mapToCommentDto builds the author from the user's first and last name", () => {
    const dto = mapToCommentDto(aComment());

    expect(dto).toMatchObject({
      movieId: MOVIE_ID,
      author: "John Doe",
      title: "Masterpiece",
      content: "Still holds up today.",
      createdAt: "2026-01-15T10:00:00.000Z",
    });
  });

  it("mapToLibraryEntryDto maps the entry and its nested movie", () => {
    const dto = mapToLibraryEntryDto(aLibraryEntry());

    expect(dto.watched).toBe(true);
    expect(dto.rating).toBe(9);
    expect(dto.movie.title).toBe("The Matrix");
  });

  it("mapToUserDto never exposes the password", () => {
    const dto = mapToUserDto(aUser());

    expect(dto).toEqual({
      id: aUser().id,
      username: "john.doe@example.com",
      firstName: "John",
      lastName: "Doe",
    });
    expect(dto).not.toHaveProperty("password");
  });
});
